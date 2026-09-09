export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    // Helper: CORS & JSON responses
    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });

    // 1. API: Get Operational Offices (55 offices)
    if (pathname === "/api/offices") {
      const { results } = await env.DB.prepare(
        "SELECT id, office_name, hpo_group, is_operational FROM offices WHERE is_active = 1 AND is_operational = 1 ORDER BY office_name ASC"
      ).all();
      return json({ offices: results });
    }

    // 2. API: Get Active Products
    if (pathname === "/api/products") {
      const { results } = await env.DB.prepare(
        "SELECT id, code, name, short_name, section, entry_mode, display_order FROM products WHERE is_active = 1 ORDER BY display_order ASC"
      ).all();
      return json({ products: results });
    }

    // 3. API: Check Existing Submission
    if (pathname === "/api/submission") {
      const officeId = searchParams.get("office_id");
      const date = searchParams.get("date");
      if (!officeId || !date) return json({ error: "Missing parameters" }, 400);

      const sub = await env.DB.prepare(
        "SELECT s.*, o.office_name, o.hpo_group FROM daily_submissions s JOIN offices o ON s.office_id = o.id WHERE s.office_id = ? AND s.report_date = ?"
      ).bind(officeId, date).first();

      if (!sub) return json({ exists: false });

      const items = await env.DB.prepare(
        "SELECT si.product_id, p.code, p.name, p.short_name, p.section, p.entry_mode, si.opened_count, si.closed_count, si.achievement_count FROM submission_items si JOIN products p ON si.product_id = p.id WHERE si.submission_id = ?"
      ).bind(sub.id).all();

      const itemsMap = {};
      for (const it of items.results) itemsMap[it.code] = it;
      sub.items = itemsMap;
      return json({ exists: true, submission: sub });
    }

    // 4. API: Submit / Update Figures
    if (pathname === "/api/submit" && request.method === "POST") {
      const body = await request.json();
      const { office_id, pin, report_date, submitted_by, items, is_admin, admin_notes } = body;

      if (!office_id || !report_date) return json({ detail: "Office and date required" }, 400);

      // Verify PIN if not admin
      if (!is_admin) {
        const off = await env.DB.prepare("SELECT pin_code FROM offices WHERE id = ?").bind(office_id).first();
        if (!off || off.pin_code !== String(pin).trim()) {
          return json({ detail: "Invalid 4-digit Office Verification PIN" }, 403);
        }
      }

      // Check existing submission
      const existing = await env.DB.prepare(
        "SELECT id FROM daily_submissions WHERE office_id = ? AND report_date = ?"
      ).bind(office_id, report_date).first();

      let subId;
      let action = "SUBMIT";
      const now = new Date().toISOString().replace("T", " ").substring(0, 19);

      if (existing) {
        subId = existing.id;
        action = is_admin ? "ADMIN_EDIT" : "UPDATE";
        await env.DB.prepare(
          "UPDATE daily_submissions SET submitted_by = ?, updated_at = ?, is_modified_by_admin = ?, admin_notes = ? WHERE id = ?"
        ).bind(submitted_by || "Staff", now, is_admin ? 1 : 0, admin_notes || null, subId).run();
      } else {
        const res = await env.DB.prepare(
          "INSERT INTO daily_submissions (office_id, report_date, submitted_by, submitted_at, updated_at, is_modified_by_admin, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
        ).bind(office_id, report_date, submitted_by || "Staff", now, now, is_admin ? 1 : 0, admin_notes || null).run();
        subId = res.meta.last_row_id;
      }

      // Upsert Items
      const products = await env.DB.prepare("SELECT id, code, entry_mode FROM products WHERE is_active = 1").all();
      for (const p of products.results) {
        const pData = (items && items[p.code]) || {};
        let opened = parseInt(pData.opened || 0);
        let closed = parseInt(pData.closed || 0);
        let achieve = parseInt(pData.achievement || 0);

        if (p.entry_mode === "CLOSED_ONLY") { opened = 0; achieve = 0; }
        if (p.entry_mode === "OPENED_ONLY") { closed = 0; achieve = 0; }
        if (p.entry_mode === "ACHIEVEMENT_COUNT") { opened = 0; closed = 0; }
        if (p.entry_mode === "OPENED_AND_CLOSED") { achieve = 0; }

        await env.DB.prepare(`
          INSERT INTO submission_items (submission_id, product_id, opened_count, closed_count, achievement_count)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(submission_id, product_id) DO UPDATE SET
            opened_count = excluded.opened_count,
            closed_count = excluded.closed_count,
            achievement_count = excluded.achievement_count
        `).bind(subId, p.id, opened, closed, achieve).run();
      }

      return json({ status: "success", submission_id: subId, action });
    }

    // 5. API: Dashboard Metrics & Consolidated Data
    if (pathname === "/api/dashboard") {
      const date = searchParams.get("date") || new Date().toISOString().substring(0, 10);

      const offices = await env.DB.prepare("SELECT * FROM offices WHERE is_active = 1 AND is_operational = 1 ORDER BY office_name ASC").all();
      const submissions = await env.DB.prepare(
        "SELECT s.*, o.office_name, o.hpo_group FROM daily_submissions s JOIN offices o ON s.office_id = o.id WHERE s.report_date = ? AND o.is_operational = 1"
      ).bind(date).all();

      const submittedOfficeIds = new Set(submissions.results.map((s) => s.office_id));
      const pendingOffices = offices.results.filter((o) => !submittedOfficeIds.has(o.id));

      // Consolidated product totals
      const totals = await env.DB.prepare(`
        SELECT p.code, p.name, p.short_name, p.section, p.entry_mode, p.display_order,
               COALESCE(SUM(si.opened_count), 0) as total_opened,
               COALESCE(SUM(si.closed_count), 0) as total_closed,
               COALESCE(SUM(si.achievement_count), 0) as total_achievement
        FROM products p
        LEFT JOIN submission_items si ON p.id = si.product_id
        LEFT JOIN daily_submissions s ON si.submission_id = s.id AND s.report_date = ?
        LEFT JOIN offices o ON s.office_id = o.id AND o.is_operational = 1 AND o.is_active = 1
        WHERE p.is_active = 1
        GROUP BY p.id
        ORDER BY p.display_order ASC
      `).bind(date).all();

      let totalSavingsO = 0, totalSavingsC = 0, totalIppbO = 0, totalIppbC = 0, totalIppbAch = 0;
      for (const t of totals.results) {
        if (t.section === "SAVINGS") {
          totalSavingsO += t.total_opened;
          totalSavingsC += t.total_closed;
        } else if (t.section === "IPPB") {
          if (t.entry_mode === "OPENED_AND_CLOSED") {
            totalIppbO += t.total_opened;
            totalIppbC += t.total_closed;
          } else {
            totalIppbAch += t.total_achievement;
          }
        }
      }

      return json({
        report_date: date,
        metrics: {
          total_offices: offices.results.length,
          submitted_count: submissions.results.length,
          pending_count: pendingOffices.length,
          completion_pct: Math.round((submissions.results.length / offices.results.length) * 1000) / 10,
          total_savings_opened: totalSavingsO,
          total_savings_closed: totalSavingsC,
          total_ippb_opened: totalIppbO,
          total_ippb_closed: totalIppbC,
          total_ippb_achievements: totalIppbAch,
        },
        consolidated_products: totals.results,
        pending_offices: pendingOffices,
        submitted_offices: submissions.results,
      });
    }

    // Default: Forward static assets or render HTML
    return new Response("India Post Savings Monitor Edge Worker Live", { status: 200 });
  },
};
