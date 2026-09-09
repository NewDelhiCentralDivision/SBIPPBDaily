// Cloudflare Worker for India Post - New Delhi Central Division Savings Monitor
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });

    const html = (content, status = 200) =>
      new Response(content, {
        status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });

    // 1. API: Offices List (55 Operational Offices)
    if (pathname === "/api/offices") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT id, office_name, hpo_group, pin_code, is_operational FROM offices WHERE is_active = 1 AND is_operational = 1 ORDER BY office_name ASC"
        ).all();
        return json({ offices: results });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    // 2. API: Products List (21 Savings & IPPB Products)
    if (pathname === "/api/products") {
      try {
        const { results } = await env.DB.prepare(
          "SELECT id, code, name, short_name, section, entry_mode, display_order FROM products WHERE is_active = 1 ORDER BY display_order ASC"
        ).all();
        return json({ products: results });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    // 3. API: Existing Submission Check
    if (pathname === "/api/submission") {
      const officeId = searchParams.get("office_id");
      const date = searchParams.get("date");
      if (!officeId || !date) return json({ error: "Missing parameters" }, 400);

      try {
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
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    // 4. API: Submit / Update Performance Data
    if (pathname === "/api/submit" && request.method === "POST") {
      try {
        const body = await request.json();
        const { office_id, pin, report_date, submitted_by, items, is_admin, admin_notes } = body;

        if (!office_id || !report_date) return json({ detail: "Office and Date required" }, 400);

        if (!is_admin) {
          const off = await env.DB.prepare("SELECT pin_code FROM offices WHERE id = ?").bind(office_id).first();
          if (!off || String(off.pin_code).trim() !== String(pin).trim()) {
            return json({ detail: "Invalid 4-digit Office Verification PIN for this office" }, 403);
          }
        }

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

        const prods = await env.DB.prepare("SELECT id, code, entry_mode FROM products WHERE is_active = 1").all();
        for (const p of prods.results) {
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
      } catch (e) {
        return json({ detail: e.message }, 500);
      }
    }

    // 5. API: Dashboard Metrics & Consolidated Totals
    if (pathname === "/api/dashboard") {
      try {
        const date = searchParams.get("date") || new Date().toISOString().substring(0, 10);
        const offices = await env.DB.prepare("SELECT * FROM offices WHERE is_active = 1 AND is_operational = 1 ORDER BY office_name ASC").all();
        const submissions = await env.DB.prepare(
          "SELECT s.*, o.office_name, o.hpo_group FROM daily_submissions s JOIN offices o ON s.office_id = o.id WHERE s.report_date = ? AND o.is_operational = 1"
        ).bind(date).all();

        const submittedIds = new Set(submissions.results.map((s) => s.office_id));
        const pendingOffices = offices.results.filter((o) => !submittedIds.has(o.id));

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

        const matrix = [];
        for (const off of offices.results) {
          const sub = submissions.results.find((s) => s.office_id === off.id);
          const row = {
            office_id: off.id,
            office_name: off.office_name,
            hpo_group: off.hpo_group,
            status: sub ? "SUBMITTED" : "PENDING",
            submitted_at: sub ? sub.submitted_at : null,
            updated_at: sub ? sub.updated_at : null,
            is_modified_by_admin: sub ? Boolean(sub.is_modified_by_admin) : false,
            submitted_by: sub ? sub.submitted_by : "",
            counts: {}
          };
          if (sub) {
            const subItems = await env.DB.prepare(
              "SELECT p.code, si.opened_count, si.closed_count, si.achievement_count FROM submission_items si JOIN products p ON si.product_id = p.id WHERE si.submission_id = ?"
            ).bind(sub.id).all();
            for (const item of subItems.results) {
              row.counts[item.code] = {
                opened: item.opened_count,
                closed: item.closed_count,
                achievement: item.achievement_count
              };
            }
          }
          matrix.push(row);
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
          office_matrix: matrix
        });
      } catch (e) {
        return json({ error: e.message }, 500);
      }
    }

    // 6. API: WhatsApp Formatted Text
    if (pathname === "/api/whatsapp-text") {
      const date = searchParams.get("date") || new Date().toISOString().substring(0, 10);
      const dashReq = new Request(`${url.origin}/api/dashboard?date=${date}`);
      const dashRes = await this.fetch(dashReq, env, ctx);
      const dash = await dashRes.json();
      const m = dash.metrics;

      const pParts = date.split("-");
      const displayDate = pParts.length === 3 ? `${pParts}.${pParts}.${pParts[0]}` : date;

      const lines = [
        "📮 *DEPARTMENT OF POSTS – INDIA POST*",
        "*NEW DELHI CENTRAL DIVISION*",
        "*DAILY SAVINGS & IPPB PERFORMANCE REPORT*",
        `📅 *Date: ${displayDate}*`,
        "━━━━━━━━━━━━━━━━━━━━━━",
        `📊 *Reporting Status:* ${m.submitted_count} /${m.total_offices} Offices`,
        `⏳ *Pending Offices:* ${m.pending_count}`,
        `📈 *Completion Rate:* ${m.completion_pct}%`,
        "━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "💰 *SAVINGS / POSB PERFORMANCE*",
        "┌────────┬────────┬────────┐",
        "│ *Scheme* │ *Opened* │ *Closed* │",
        "├────────┼────────┼────────┤"
      ];

      for (const p of dash.consolidated_products) {
        if (p.section === "SAVINGS") {
          const sname = (p.short_name + "      ").substring(0, 6);
          if (p.entry_mode === "CLOSED_ONLY") {
            lines.push(`│ ${sname} │   --   │${String(p.total_closed).padStart(5, " ")} │`);
          } else {
            lines.push(`│ ${sname} │  ${String(p.total_opened).padStart(5, " ")} │  ${String(p.total_closed).padStart(5, " ")} │`);
          }
        }
      }

      lines.push(
        "├────────┼────────┼────────┤",
        `│ *TOTAL*  │ *${String(m.total_savings_opened).padStart(5, " ")}* │ *${String(m.total_savings_closed).padStart(5, " ")}* │`,
        "└────────┴────────┴────────┘",
        "",
        "📱 *IPPB PERFORMANCE*",
        `• *Accounts Opened:* ${m.total_ippb_opened}`,
        `• *Accounts Closed:* ${m.total_ippb_closed}`,
        "--- Activities / Services ---"
      );

      for (const p of dash.consolidated_products) {
        if (p.section === "IPPB" && p.entry_mode === "ACHIEVEMENT_COUNT") {
          lines.push(`• ${p.name}: *${p.total_achievement}*`);
        }
      }

      lines.push("", "━━━━━━━━━━━━━━━━━━━━━━", "Generated via Divisional Reporting Portal");
      return json({ text: lines.join("\n") });
    }

    // 7. API: CSV Export
    if (pathname === "/api/export/csv") {
      const date = searchParams.get("date") || new Date().toISOString().substring(0, 10);
      const dashReq = new Request(`${url.origin}/api/dashboard?date=${date}`);
      const dashRes = await this.fetch(dashReq, env, ctx);
      const dash = await dashRes.json();

      const products = await env.DB.prepare("SELECT * FROM products WHERE is_active=1 ORDER BY display_order").all();
      const headers = ["Office Name", "HPO Group", "Status", "Submitted By", "Submission Time", "Last Updated"];
      for (const p of products.results) {
        if (p.entry_mode === "OPENED_AND_CLOSED") {
          headers.push(`${p.short_name} Opened`, `${p.short_name} Closed`);
        } else if (p.entry_mode === "CLOSED_ONLY") {
          headers.push(`${p.short_name} Closed`);
        } else {
          headers.push(`${p.short_name} Count`);
        }
      }

      const rows = [headers.map((h) => `"${h}"`).join(",")];
      for (const r of dash.office_matrix) {
        const line = [r.office_name, r.hpo_group, r.status, r.submitted_by || "", r.submitted_at || "", r.updated_at || ""];
        for (const p of products.results) {
          const v = (r.counts && r.counts[p.code]) || { opened: 0, closed: 0, achievement: 0 };
          if (p.entry_mode === "OPENED_AND_CLOSED") line.push(v.opened, v.closed);
          else if (p.entry_mode === "CLOSED_ONLY") line.push(v.closed);
          else line.push(v.achievement);
        }
        rows.push(line.map((val) => `"${val}"`).join(","));
      }

      return new Response(rows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=Savings_Performance_${date}.csv`
        }
      });
    }

    // -------------------------------------------------------------
    // FRONTEND HTML ROUTING
    // -------------------------------------------------------------
    if (pathname === "/admin") return html(getAdminHtml());
    if (pathname === "/report") return html(getReportHtml());
    return html(getIndexHtml());
  }
};

function getCommonCss() {
  return `
:root {
  --primary: #C8102E; --primary-dark: #9E0C24; --secondary: #F8B133; --bg: #F8FAFC;
  --card-bg: #FFFFFF; --text-main: #0F172A; --text-muted: #64748B; --border: #E2E8F0;
  --success: #10B981; --success-bg: #ECFDF5; --warning: #F59E0B; --warning-bg: #FFFBEB;
  --danger: #EF4444; --danger-bg: #FEF2F2; --info: #3B82F6; --info-bg: #EFF6FF;
  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: var(--font); background-color: var(--bg); color: var(--text-main); line-height: 1.5; padding-bottom: 50px; }
.header-bar { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: white; padding: 16px 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
.brand-section { display: flex; align-items: center; gap: 12px; }
.brand-icon { background: var(--secondary); color: var(--text-main); font-weight: 800; padding: 8px 12px; border-radius: 8px; font-size: 1.1rem; }
.brand-title { font-size: 1.15rem; font-weight: 700; }
.brand-sub { font-size: 0.85rem; opacity: 0.9; }
.nav-links { display: flex; gap: 12px; }
.nav-btn { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 0.88rem; font-weight: 600; cursor: pointer; }
.nav-btn:hover { background: rgba(255,255,255,0.25); }
.container { max-width: 1100px; margin: 24px auto; padding: 0 16px; }
.card { background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 1px 3px rgba(0,0,0,0.05); padding: 24px; margin-bottom: 20px; }
.card-title { font-size: 1.15rem; font-weight: 700; color: var(--primary); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid var(--border); padding-bottom: 8px; }
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { background: white; padding: 18px; border-radius: 10px; border: 1px solid var(--border); border-top: 4px solid var(--primary); }
.stat-card.stat-success { border-top-color: var(--success); }
.stat-card.stat-danger { border-top-color: var(--danger); }
.stat-card.stat-warning { border-top-color: var(--warning); }
.stat-label { font-size: 0.82rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); }
.stat-val { font-size: 2rem; font-weight: 800; color: var(--text-main); margin-top: 4px; }
.stat-sub { font-size: 0.82rem; color: var(--text-muted); margin-top: 4px; }
.form-group { margin-bottom: 18px; }
label { display: block; font-size: 0.88rem; font-weight: 600; margin-bottom: 6px; }
.form-control { width: 100%; padding: 10px 14px; border-radius: 8px; border: 1.5px solid var(--border); font-size: 0.95rem; font-family: inherit; background: white; }
.form-control:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.15); }
.grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media (max-width: 640px) { .grid-3 { grid-template-columns: 1fr; } }
.entry-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.entry-table th { background: #F1F5F9; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); padding: 10px 12px; text-align: left; border-bottom: 2px solid var(--border); }
.entry-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: middle; }
.entry-table tr:hover { background: #F8FAFC; }
.prod-name { font-weight: 600; font-size: 0.92rem; }
.prod-code { font-size: 0.78rem; background: #E2E8F0; color: #475569; padding: 2px 6px; border-radius: 4px; margin-left: 6px; font-weight: 600; }
.num-input { width: 90px; padding: 8px 10px; font-size: 1rem; font-weight: 600; text-align: center; border-radius: 6px; border: 1.5px solid var(--border); background: #FAFAFA; }
.num-input:focus { background: white; border-color: var(--primary); outline: none; box-shadow: 0 0 0 2px rgba(200, 16, 46, 0.15); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; border: none; text-decoration: none; }
.btn-primary { background: var(--primary); color: white; }
.btn-primary:hover { background: var(--primary-dark); }
.btn-warning { background: var(--warning); color: #78350F; }
.btn-outline { background: transparent; border: 1.5px solid var(--border); color: var(--text-main); }
.btn-outline:hover { background: #F1F5F9; }
.badge { display: inline-block; padding: 4px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.badge-success { background: var(--success-bg); color: #065F46; border: 1px solid #A7F3D0; }
.badge-danger { background: var(--danger-bg); color: #991B1B; border: 1px solid #FECACA; }
.badge-warning { background: var(--warning-bg); color: #92400E; border: 1px solid #FDE68A; }
.badge-info { background: var(--info-bg); color: #1E40AF; border: 1px solid #BFDBFE; }
.alert { padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; font-size: 0.92rem; }
.alert-warning { background: var(--warning-bg); border: 1px solid #FDE68A; color: #B45309; }
.alert-success { background: var(--success-bg); border: 1px solid #A7F3D0; color: #065F46; }
.alert-danger { background: var(--danger-bg); border: 1px solid #FECACA; color: #991B1B; }
.progress-bar-container { background: #E2E8F0; height: 12px; border-radius: 6px; overflow: hidden; margin: 10px 0; }
.progress-bar-fill { background: linear-gradient(90deg, var(--secondary) 0%, var(--primary) 100%); height: 100%; border-radius: 6px; transition: width 0.4s ease; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); display: none; align-items: center; justify-content: center; z-index: 999; padding: 16px; }
.modal-content { background: white; border-radius: 12px; max-width: 500px; width: 100%; padding: 24px; }
`;
}

function getIndexHtml() {
  const css = getCommonCss();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>India Post - Daily Savings Performance Entry</title>
  <style>${css}</style>
</head>
<body>
  <header class="header-bar">
    <div class="brand-section">
      <div class="brand-icon">IP</div>
      <div>
        <div class="brand-title">Department of Posts – India Post</div>
        <div class="brand-sub">New Delhi Central Division | Daily Performance Entry Portal</div>
      </div>
    </div>
    <div class="nav-links">
      <a href="/admin" class="nav-btn">📊 Admin Dashboard</a>
      <a href="/report" class="nav-btn">📱 WhatsApp Card</a>
    </div>
  </header>

  <main class="container">
    <div id="updateBanner" class="alert alert-warning" style="display: none;">
      ⚠️ <strong>Existing Submission Found:</strong> <span id="updateBannerText"></span>
      <div style="font-size:0.85rem; margin-top:4px;">You are currently in <strong>Update Mode</strong>. Submitting will update your office figures.</div>
    </div>

    <div id="statusAlert" class="alert" style="display: none;"></div>

    <form id="submissionForm" onsubmit="handleFormSubmit(event)">
      <!-- 1. Office Identification -->
      <div class="card">
        <div class="card-title">
          <span>🏢 1. Office Identification</span>
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal;">Mandatory</span>
        </div>
        <div class="grid-3">
          <div class="form-group">
            <label for="officeSelect">Select Office Name *</label>
            <select id="officeSelect" class="form-control" required onchange="handleOfficeChange()">
              <option value="">Loading 55 operational offices...</option>
            </select>
          </div>
          <div class="form-group">
            <label for="officePin">Office 4-Digit PIN *</label>
            <input type="password" id="officePin" class="form-control" placeholder="Enter 4-digit PIN" maxlength="6" required oninput="handlePinInput()">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
              <small style="color: var(--text-muted);">Prevents accidental cross-submission</small>
              <label style="font-size: 0.78rem; font-weight: normal; margin: 0; cursor: pointer;">
                <input type="checkbox" id="rememberPin" checked> Remember
              </label>
            </div>
          </div>
          <div class="form-group">
            <label for="reportDate">Reporting Date *</label>
            <input type="date" id="reportDate" class="form-control" required onchange="handleDateChange()">
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label for="submittedBy">Submitted By (Official Name / Designation)</label>
          <input type="text" id="submittedBy" class="form-control" placeholder="e.g. SPM / Postal Assistant">
        </div>
      </div>

      <!-- 2. Savings / POSB -->
      <div class="card">
        <div class="card-title">
          <span>💰 2. Savings Bank (POSB) Performance</span>
          <span class="badge badge-success">Section 1</span>
        </div>
        <h4 style="font-size:0.95rem; color:#1E293B; margin-bottom:8px;">A. Active Savings Schemes (Opening & Closing)</h4>
        <div style="overflow-x: auto;">
          <table class="entry-table">
            <thead>
              <tr>
                <th style="width: 50%;">Product / Scheme Name</th>
                <th style="width: 25%; text-align: center;">Opened (Count)</th>
                <th style="width: 25%; text-align: center;">Closed (Count)</th>
              </tr>
            </thead>
            <tbody id="savingsActiveBody"><tr><td colspan="3" style="text-align:center;">Loading products from D1...</td></tr></tbody>
          </table>
        </div>

        <h4 style="font-size:0.95rem; color:#1E293B; margin-top:24px; margin-bottom:8px;">B. Discontinued Savings Schemes (Closing Only)</h4>
        <div style="overflow-x: auto;">
          <table class="entry-table">
            <thead>
              <tr>
                <th style="width: 50%;">Scheme Name</th>
                <th style="width: 25%; text-align: center;">Opened</th>
                <th style="width: 25%; text-align: center;">Closed (Count)</th>
              </tr>
            </thead>
            <tbody id="savingsDiscontinuedBody"></tbody>
          </table>
        </div>
      </div>

      <!-- 3. IPPB -->
      <div class="card">
        <div class="card-title">
          <span>📱 3. IPPB (India Post Payments Bank) Performance</span>
          <span class="badge badge-warning">Section 2</span>
        </div>
        <h4 style="font-size:0.95rem; color:#1E293B; margin-bottom:8px;">A. IPPB Accounts (Opening & Closing)</h4>
        <div style="overflow-x: auto;">
          <table class="entry-table">
            <thead>
              <tr>
                <th style="width: 50%;">Account Type</th>
                <th style="width: 25%; text-align: center;">Opened (Count)</th>
                <th style="width: 25%; text-align: center;">Closed (Count)</th>
              </tr>
            </thead>
            <tbody id="ippbAccountsBody"></tbody>
          </table>
        </div>

        <h4 style="font-size:0.95rem; color:#1E293B; margin-top:24px; margin-bottom:8px;">B. IPPB Services & Activities (Achievement Count Only)</h4>
        <div style="overflow-x: auto;">
          <table class="entry-table">
            <thead>
              <tr>
                <th style="width: 70%;">Activity / Service</th>
                <th style="width: 30%; text-align: center;">Today's Count</th>
              </tr>
            </thead>
            <tbody id="ippbServicesBody"></tbody>
          </table>
        </div>
      </div>

      <div style="display: flex; gap: 16px; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
        <button type="button" class="btn btn-outline" onclick="resetFormToZeroes()">Clear All Fields to 0</button>
        <button type="submit" id="submitBtn" class="btn btn-primary" style="padding: 12px 32px; font-size: 1.05rem;">
          📤 Submit Daily Performance
        </button>
      </div>
    </form>
  </main>

  <div id="zeroModal" class="modal-overlay">
    <div class="modal-content">
      <h3 style="color: #B45309; margin-bottom: 12px;">⚠️ Zero Performance Confirmation</h3>
      <p style="font-size: 0.95rem; color: #475569; margin-bottom: 20px;">
        You have entered <strong>0</strong> for all Savings and IPPB products.<br><br>
        Are you sure your office had <strong>zero transactions</strong> today?
      </p>
      <div style="display: flex; justify-content: flex-end; gap: 12px;">
        <button type="button" class="btn btn-outline" onclick="closeZeroModal()">Cancel & Review</button>
        <button type="button" class="btn btn-warning" onclick="executeSubmission(true)">Yes, Submit Zero Figures</button>
      </div>
    </div>
  </div>

  <script>
    let allProducts = [];
    document.addEventListener('DOMContentLoaded', async () => {
      const today = new Date().toISOString().substring(0, 10);
      document.getElementById('reportDate').value = today;

      await Promise.all([loadOffices(), loadProducts()]);

      const savedOfficeId = localStorage.getItem('ip_office_id');
      const savedPin = localStorage.getItem('ip_office_pin');
      if (savedOfficeId) {
        document.getElementById('officeSelect').value = savedOfficeId;
        if (savedPin) document.getElementById('officePin').value = savedPin;
        checkExistingSubmission();
      }
    });

    async function loadOffices() {
      try {
        const res = await fetch('/api/offices');
        const data = await res.json();
        const sel = document.getElementById('officeSelect');
        sel.innerHTML = '<option value="">-- Choose Post Office (55 Operational) --</option>';
        data.offices.forEach(o => {
          const opt = document.createElement('option');
          opt.value = o.id;
          opt.text = \`\${o.office_name} (\${o.hpo_group})\`;
          sel.appendChild(opt);
        });
      } catch (err) {
        console.error('Failed to load offices:', err);
      }
    }

    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        allProducts = data.products;

        const sActive = document.getElementById('savingsActiveBody');
        const sDisc = document.getElementById('savingsDiscontinuedBody');
        const iAcc = document.getElementById('ippbAccountsBody');
        const iServ = document.getElementById('ippbServicesBody');

        sActive.innerHTML = ''; sDisc.innerHTML = ''; iAcc.innerHTML = ''; iServ.innerHTML = '';

        allProducts.forEach(p => {
          if (p.section === 'SAVINGS' && p.entry_mode === 'OPENED_AND_CLOSED') {
            sActive.innerHTML += \`
              <tr>
                <td><span class="prod-name">\${p.name}</span><span class="prod-code">\${p.short_name}</span></td>
                <td style="text-align: center;"><input type="number" min="0" id="prod_\${p.code}_opened" class="num-input count-field" value="0" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"></td>
                <td style="text-align: center;"><input type="number" min="0" id="prod_\${p.code}_closed" class="num-input count-field" value="0" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"></td>
              </tr>\`;
          } else if (p.section === 'SAVINGS' && p.entry_mode === 'CLOSED_ONLY') {
            sDisc.innerHTML += \`
              <tr>
                <td><span class="prod-name">\${p.name}</span><span class="prod-code">\${p.short_name}</span></td>
                <td style="text-align: center; color: var(--text-muted); font-size: 0.85rem; font-style: italic;">Discontinued</td>
                <td style="text-align: center;"><input type="number" min="0" id="prod_\${p.code}_closed" class="num-input count-field" value="0" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"></td>
              </tr>\`;
          } else if (p.section === 'IPPB' && p.entry_mode === 'OPENED_AND_CLOSED') {
            iAcc.innerHTML += \`
              <tr>
                <td><span class="prod-name">\${p.name}</span><span class="prod-code">\${p.short_name}</span></td>
                <td style="text-align: center;"><input type="number" min="0" id="prod_\${p.code}_opened" class="num-input count-field" value="0" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"></td>
                <td style="text-align: center;"><input type="number" min="0" id="prod_\${p.code}_closed" class="num-input count-field" value="0" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"></td>
              </tr>\`;
          } else if (p.section === 'IPPB' && p.entry_mode === 'ACHIEVEMENT_COUNT') {
            iServ.innerHTML += \`
              <tr>
                <td><span class="prod-name">\${p.name}</span><span class="prod-code">\${p.short_name}</span></td>
                <td style="text-align: center;"><input type="number" min="0" id="prod_\${p.code}_achievement" class="num-input count-field" value="0" onfocus="if(this.value=='0')this.value=''" onblur="if(this.value=='')this.value='0'"></td>
              </tr>\`;
          }
        });
      } catch (err) {
        console.error('Failed to load products:', err);
      }
    }

    function handleOfficeChange() {
      const officeId = document.getElementById('officeSelect').value;
      const savedOfficeId = localStorage.getItem('ip_office_id');
      const savedPin = localStorage.getItem('ip_office_pin');
      if (savedOfficeId === officeId && savedPin) {
        document.getElementById('officePin').value = savedPin;
      }
      checkExistingSubmission();
    }

    function handleDateChange() { checkExistingSubmission(); }

    function handlePinInput() {
      const remember = document.getElementById('rememberPin').checked;
      const officeId = document.getElementById('officeSelect').value;
      const pin = document.getElementById('officePin').value;
      if (remember && officeId && pin.length >= 4) {
        localStorage.setItem('ip_office_id', officeId);
        localStorage.setItem('ip_office_pin', pin);
      }
    }

    async function checkExistingSubmission() {
      const officeId = document.getElementById('officeSelect').value;
      const reportDate = document.getElementById('reportDate').value;
      const updateBanner = document.getElementById('updateBanner');
      const submitBtn = document.getElementById('submitBtn');
      if (!officeId || !reportDate) return;

      try {
        const res = await fetch(\`/api/submission?office_id=\${officeId}&date=\${reportDate}\`);
        const data = await res.json();
        if (data.exists) {
          const sub = data.submission;
          document.getElementById('updateBannerText').innerHTML = \`Recorded by <strong>\${sub.submitted_by || 'Staff'}</strong> at <strong>\${sub.submitted_at}</strong>\`;
          updateBanner.style.display = 'block';
          submitBtn.innerText = '✏️ Update Daily Performance';
          submitBtn.className = 'btn btn-warning';

          if (sub.items) {
            for (const [code, item] of Object.entries(sub.items)) {
              const oInp = document.getElementById(\`prod_\${code}_opened\`);
              const cInp = document.getElementById(\`prod_\${code}_closed\`);
              const aInp = document.getElementById(\`prod_\${code}_achievement\`);
              if (oInp) oInp.value = item.opened_count;
              if (cInp) cInp.value = item.closed_count;
              if (aInp) aInp.value = item.achievement_count;
            }
          }
          if (sub.submitted_by) document.getElementById('submittedBy').value = sub.submitted_by;
        } else {
          updateBanner.style.display = 'none';
          submitBtn.innerText = '📤 Submit Daily Performance';
          submitBtn.className = 'btn btn-primary';
          resetFormToZeroes();
        }
      } catch (err) {
        console.error(err);
      }
    }

    function resetFormToZeroes() {
      document.querySelectorAll('.count-field').forEach(f => f.value = '0');
    }

    function handleFormSubmit(event) {
      event.preventDefault();
      const countFields = document.querySelectorAll('.count-field');
      let totalSum = 0;
      for (const f of countFields) {
        const val = parseInt(f.value || 0, 10);
        if (isNaN(val) || val < 0) {
          showAlert('Negative or invalid numbers are not allowed.', 'danger');
          f.focus(); return;
        }
        totalSum += val;
      }
      if (totalSum === 0) {
        document.getElementById('zeroModal').style.display = 'flex';
        return;
      }
      executeSubmission(false);
    }

    function closeZeroModal() { document.getElementById('zeroModal').style.display = 'none'; }

    async function executeSubmission(isConfirmedZero) {
      closeZeroModal();
      const officeSelect = document.getElementById('officeSelect');
      const officeId = officeSelect.value;
      const pin = document.getElementById('officePin').value.trim();
      const reportDate = document.getElementById('reportDate').value;
      const submittedBy = document.getElementById('submittedBy').value.trim() || 'Staff';

      const items = {};
      document.querySelectorAll('[id^="prod_"][id$="_opened"]').forEach(inp => {
        const code = inp.id.replace('prod_', '').replace('_opened', '');
        if (!items[code]) items[code] = {};
        items[code].opened = parseInt(inp.value || 0, 10);
      });
      document.querySelectorAll('[id^="prod_"][id$="_closed"]').forEach(inp => {
        const code = inp.id.replace('prod_', '').replace('_closed', '');
        if (!items[code]) items[code] = {};
        items[code].closed = parseInt(inp.value || 0, 10);
      });
      document.querySelectorAll('[id^="prod_"][id$="_achievement"]').forEach(inp => {
        const code = inp.id.replace('prod_', '').replace('_achievement', '');
        if (!items[code]) items[code] = {};
        items[code].achievement = parseInt(inp.value || 0, 10);
      });

      const payload = { office_id: parseInt(officeId, 10), pin, report_date: reportDate, submitted_by: submittedBy, items };
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true; submitBtn.innerText = 'Submitting...';

      try {
        const res = await fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
          showAlert(data.detail || 'Submission failed.', 'danger');
        } else {
          if (document.getElementById('rememberPin').checked) {
            localStorage.setItem('ip_office_id', officeId);
            localStorage.setItem('ip_office_pin', pin);
          }
          showAlert(\`✅ Success! Daily Performance successfully \${data.action === 'UPDATE' ? 'Updated' : 'Submitted'}.\`, 'success');
          checkExistingSubmission();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        showAlert('Network error occurred.', 'danger');
      } finally {
        submitBtn.disabled = false;
      }
    }

    function showAlert(msg, type) {
      const alertEl = document.getElementById('statusAlert');
      alertEl.className = \`alert alert-\${type}\`;
      alertEl.innerHTML = msg;
      alertEl.style.display = 'block';
    }
  </script>
</body>
</html>`;
}

function getAdminHtml() {
  const css = getCommonCss();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - New Delhi Central Division</title>
  <style>${css}</style>
</head>
<body>
  <header class="header-bar">
    <div class="brand-section">
      <div class="brand-icon">ADMIN</div>
      <div>
        <div class="brand-title">New Delhi Central Division – Executive Dashboard</div>
        <div class="brand-sub">Daily Savings & IPPB Performance Live Monitoring</div>
      </div>
    </div>
    <div class="nav-links">
      <a href="/" class="nav-btn">📝 Office Portal</a>
      <a href="/report" class="nav-btn">📱 WhatsApp Card</a>
      <button onclick="downloadCSV()" class="nav-btn">📥 Export CSV</button>
    </div>
  </header>

  <main class="container">
    <div class="card" style="padding: 16px 24px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <label for="adminDateSelect" style="margin: 0; font-weight: 700;">Date:</label>
          <input type="date" id="adminDateSelect" class="form-control" style="width: auto; padding: 6px 12px;" onchange="loadDashboard()">
          <button class="btn btn-outline" style="padding: 6px 14px;" onclick="loadDashboard()">🔄 Refresh</button>
        </div>
        <div style="font-size: 0.9rem; color: var(--text-muted);">
          Operational Units: <strong>55 Offices</strong>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Operational Offices</div>
        <div class="stat-val" id="kpiTotal">55</div>
        <div class="stat-sub">Divisional Target</div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-label">Offices Submitted</div>
        <div class="stat-val" style="color: var(--success);" id="kpiSubmitted">0</div>
        <div class="stat-sub" id="kpiCompletion">0% Completion</div>
      </div>
      <div class="stat-card stat-danger">
        <div class="stat-label">Offices Pending</div>
        <div class="stat-val" style="color: var(--danger);" id="kpiPending">55</div>
        <div class="stat-sub">Action required</div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-label">Savings Accounts</div>
        <div class="stat-val"><span id="kpiSavingsO">0</span> <span style="font-size:1.1rem; color:var(--text-muted);">/ <span id="kpiSavingsC">0</span></span></div>
        <div class="stat-sub">Opened / Closed</div>
      </div>
      <div class="stat-card" style="border-top-color: var(--info);">
        <div class="stat-label">IPPB Accounts & Activities</div>
        <div class="stat-val"><span id="kpiIppbO">0</span> <span style="font-size:1.1rem; color:var(--text-muted);">/ <span id="kpiIppbAch">0</span></span></div>
        <div class="stat-sub">A/Cs Opened / Services</div>
      </div>
    </div>

    <div class="card" style="padding: 16px 20px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 700; margin-bottom: 4px;">
        <span>Division Reporting Progress</span>
        <span id="progressBarText">0 of 55 Submitted (0%)</span>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-fill" id="progressBarFill" style="width: 0%;"></div>
      </div>
    </div>

    <!-- Pending Alert -->
    <div class="card" style="border-left: 6px solid var(--danger);">
      <div class="card-title">
        <span style="color: var(--danger);">⏳ Pending Offices (<span id="pendingCountBadge">0</span>)</span>
        <button class="btn btn-outline" style="font-size: 0.85rem; padding: 6px 14px; border-color: var(--danger); color: var(--danger);" onclick="copyPendingForWhatsApp()">
          📋 Copy Pending Offices for WhatsApp
        </button>
      </div>
      <div id="pendingContainer" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
    </div>

    <!-- Consolidated Summary -->
    <div class="card">
      <div class="card-title">
        <span>📊 Division Consolidated Performance Summary</span>
        <a href="/report" id="reportLink" class="btn btn-primary" style="font-size: 0.85rem; padding: 6px 14px;">📱 Open WhatsApp Report Card</a>
      </div>
      <div style="overflow-x: auto;">
        <table class="entry-table">
          <thead>
            <tr>
              <th>Scheme / Product Name</th>
              <th>Section</th>
              <th style="text-align: center;">Total Opened</th>
              <th style="text-align: center;">Total Closed</th>
              <th style="text-align: center;">Net / Achievements</th>
            </tr>
          </thead>
          <tbody id="consolidatedSummaryBody"></tbody>
        </table>
      </div>
    </div>

    <!-- Matrix -->
    <div class="card">
      <div class="card-title">
        <span>📑 Office-wise Submissions & Matrix (55 Offices)</span>
      </div>
      <div class="grid-3" style="margin-bottom: 16px;">
        <div>
          <label>Filter Search:</label>
          <input type="text" id="matrixSearch" class="form-control" placeholder="Search office..." oninput="filterMatrix()">
        </div>
        <div>
          <label>Filter HPO:</label>
          <select id="hpoFilter" class="form-control" onchange="filterMatrix()">
            <option value="ALL">All HPOs</option>
            <option value="Indraprastha HPO">Indraprastha HPO</option>
            <option value="Sansad Marg HPO">Sansad Marg HPO</option>
            <option value="New Delhi HO">New Delhi HO</option>
          </select>
        </div>
        <div>
          <label>Filter Status:</label>
          <select id="statusFilter" class="form-control" onchange="filterMatrix()">
            <option value="ALL">All Status</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>
      <div style="overflow-x: auto; max-height: 500px;">
        <table class="entry-table" id="matrixTable">
          <thead style="position: sticky; top: 0; z-index: 10;">
            <tr>
              <th>Office Name</th>
              <th>HPO</th>
              <th style="text-align: center;">Status</th>
              <th>Submitted At</th>
              <th style="text-align: center;">Savings (O / C)</th>
              <th style="text-align: center;">IPPB (O / C)</th>
              <th style="text-align: center;">Action</th>
            </tr>
          </thead>
          <tbody id="matrixBody"></tbody>
        </table>
      </div>
    </div>
  </main>

  <script>
    let currentData = null;
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('adminDateSelect').value = new Date().toISOString().substring(0, 10);
      loadDashboard();
    });

    async function loadDashboard() {
      const dt = document.getElementById('adminDateSelect').value;
      document.getElementById('reportLink').href = \`/report?date=\${dt}\`;
      try {
        const res = await fetch(\`/api/dashboard?date=\${dt}\`);
        currentData = await res.json();
        renderDashboard(currentData);
      } catch (err) {
        console.error(err);
      }
    }

    function renderDashboard(data) {
      const m = data.metrics;
      document.getElementById('kpiTotal').innerText = m.total_offices;
      document.getElementById('kpiSubmitted').innerText = m.submitted_count;
      document.getElementById('kpiCompletion').innerText = \`\${m.completion_pct}% Completion\`;
      document.getElementById('kpiPending').innerText = m.pending_count;
      document.getElementById('kpiSavingsO').innerText = m.total_savings_opened;
      document.getElementById('kpiSavingsC').innerText = m.total_savings_closed;
      document.getElementById('kpiIppbO').innerText = m.total_ippb_opened;
      document.getElementById('kpiIppbAch').innerText = m.total_ippb_achievements;

      document.getElementById('progressBarText').innerText = \`\${m.submitted_count} of \${m.total_offices} Submitted (\${m.completion_pct}%)\`;
      document.getElementById('progressBarFill').style.width = \`\${m.completion_pct}%\`;

      document.getElementById('pendingCountBadge').innerText = data.pending_offices.length;
      const pendCont = document.getElementById('pendingContainer');
      if (data.pending_offices.length === 0) {
        pendCont.innerHTML = '<div class="alert alert-success" style="width:100%; margin:0;">🎉 All 55 offices have submitted!</div>';
      } else {
        pendCont.innerHTML = data.pending_offices.map(o => \`<span class="badge badge-danger" style="font-size:0.82rem; padding:6px 10px;">❌ \${o.office_name} <small>(\${o.hpo_group})</small></span>\`).join('');
      }

      const sumBody = document.getElementById('consolidatedSummaryBody');
      let sHtml = '<tr style="background:#FFF1F2; font-weight:700;"><td colspan="5" style="color:var(--primary);">SAVINGS BANK (POSB)</td></tr>';
      data.consolidated_products.filter(p => p.section === 'SAVINGS').forEach(p => {
        sHtml += \`<tr>
          <td><strong>\${p.name}</strong> (\${p.short_name})</td>
          <td><span class="badge badge-success">POSB</span></td>
          <td style="text-align:center;">\${p.entry_mode === 'CLOSED_ONLY' ? '--' : p.total_opened}</td>
          <td style="text-align:center;">\${p.total_closed}</td>
          <td style="text-align:center; font-weight:700;">\${p.entry_mode === 'CLOSED_ONLY' ? -p.total_closed : (p.total_opened - p.total_closed)}</td>
        </tr>\`;
      });
      sHtml += \`<tr style="background:#FFE4E6; font-weight:800;">
        <td>TOTAL SAVINGS</td><td><span class="badge badge-success">TOTAL</span></td>
        <td style="text-align:center; color:var(--primary); font-size:1.1rem;">\${m.total_savings_opened}</td>
        <td style="text-align:center; color:#991B1B; font-size:1.1rem;">\${m.total_savings_closed}</td>
        <td style="text-align:center; font-size:1.1rem;">\${m.total_savings_opened - m.total_savings_closed}</td>
      </tr>\`;

      sHtml += '<tr style="background:#FEF3C7; font-weight:700;"><td colspan="5" style="color:#92400E;">IPPB ACCOUNTS</td></tr>';
      data.consolidated_products.filter(p => p.section === 'IPPB' && p.entry_mode === 'OPENED_AND_CLOSED').forEach(p => {
        sHtml += \`<tr>
          <td><strong>\${p.name}</strong> (\${p.short_name})</td>
          <td><span class="badge badge-warning">IPPB A/C</span></td>
          <td style="text-align:center;">\${p.total_opened}</td>
          <td style="text-align:center;">\${p.total_closed}</td>
          <td style="text-align:center; font-weight:700;">\${p.total_opened - p.total_closed}</td>
        </tr>\`;
      });

      sHtml += '<tr style="background:#EFF6FF; font-weight:700;"><td colspan="5" style="color:#1E40AF;">IPPB SERVICES ACHIEVEMENTS</td></tr>';
      data.consolidated_products.filter(p => p.section === 'IPPB' && p.entry_mode === 'ACHIEVEMENT_COUNT').forEach(p => {
        sHtml += \`<tr>
          <td><strong>\${p.name}</strong></td>
          <td><span class="badge badge-info">Service</span></td>
          <td style="text-align:center; color:var(--text-muted);">--</td>
          <td style="text-align:center; color:var(--text-muted);">--</td>
          <td style="text-align:center; font-weight:800; color:#1E40AF;">\${p.total_achievement}</td>
        </tr>\`;
      });
      sumBody.innerHTML = sHtml;

      renderMatrix(data.office_matrix);
    }

    function renderMatrix(matrix) {
      const mb = document.getElementById('matrixBody');
      mb.innerHTML = matrix.map(r => {
        let so = 0, sc = 0;
        if (r.counts) {
          for (const v of Object.values(r.counts)) {
            so += (v.opened || 0); sc += (v.closed || 0);
          }
        }
        return \`<tr class="matrix-row" data-office="\${r.office_name.toLowerCase()}" data-hpo="\${r.hpo_group}" data-status="\${r.status}">
          <td><strong>\${r.office_name}</strong> \${r.is_modified_by_admin ? '<span class="badge badge-warning" style="font-size:0.65rem;">Edited</span>' : ''}</td>
          <td><small>\${r.hpo_group}</small></td>
          <td style="text-align:center;">\${r.status === 'SUBMITTED' ? '<span class="badge badge-success">Submitted</span>' : '<span class="badge badge-danger">Pending</span>'}</td>
          <td style="font-size:0.8rem; color:var(--text-muted);">\${r.submitted_at || '--'}</td>
          <td style="text-align:center; font-weight:600;">\${r.status === 'SUBMITTED' ? \`\${so} / \${sc}\` : '--'}</td>
          <td style="text-align:center; font-weight:600;">\${r.status === 'SUBMITTED' ? \`\${(r.counts?.IPPB_REG?.opened||0) + (r.counts?.IPPB_PREM?.opened||0)} / \${(r.counts?.IPPB_REG?.closed||0) + (r.counts?.IPPB_PREM?.closed||0)}\` : '--'}</td>
          <td style="text-align:center;"><a href="/?office=\${r.office_id}" class="btn btn-outline" style="padding:2px 8px; font-size:0.78rem;">View</a></td>
        </tr>\`;
      }).join('');
    }

    function filterMatrix() {
      const search = document.getElementById('matrixSearch').value.toLowerCase();
      const hpo = document.getElementById('hpoFilter').value;
      const status = document.getElementById('statusFilter').value;
      document.querySelectorAll('.matrix-row').forEach(r => {
        let match = true;
        if (search && !r.dataset.office.includes(search)) match = false;
        if (hpo !== 'ALL' && r.dataset.hpo !== hpo) match = false;
        if (status !== 'ALL' && r.dataset.status !== status) match = false;
        r.style.display = match ? '' : 'none';
      });
    }

    async function copyPendingForWhatsApp() {
      if (!currentData || currentData.pending_offices.length === 0) {
        alert('All offices have submitted!'); return;
      }
      const dt = document.getElementById('adminDateSelect').value;
      const list = currentData.pending_offices.map((o, i) => \`\${i+1}. *\${o.office_name}* (\${o.hpo_group})\`).join('\\n');
      const text = \`⚠️ *PENDING DAILY SAVINGS REPORT ALERT*\\nDepartment of Posts – India Post\\nNew Delhi Central Division\\n📅 *Date: \${dt}*\\n\\nThe following *\${currentData.pending_offices.length} offices* have NOT submitted today's Daily Savings Performance figures:\\n\\n\${list}\\n\\nKindly submit immediately via the official portal.\\n_Administrative Office, New Delhi Central Division_\`;
      await navigator.clipboard.writeText(text);
      alert(\`📋 Successfully copied \${currentData.pending_offices.length} pending offices to clipboard!\`);
    }

    function downloadCSV() {
      const dt = document.getElementById('adminDateSelect').value;
      window.location.href = \`/api/export/csv?date=\${dt}\`;
    }
  </script>
</body>
</html>`;
}

function getReportHtml() {
  const css = getCommonCss();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Savings Performance Report Card</title>
  <style>
    ${css}
    .report-card-container { background: white; border: 2px solid var(--primary); border-radius: 12px; overflow: hidden; max-width: 680px; margin: 0 auto 30px auto; }
    .rc-header { background: var(--primary); color: white; text-align: center; padding: 16px; }
    .rc-kpis { background: #FFFBEB; border-bottom: 2px dashed #F8B133; padding: 12px 16px; display: flex; justify-content: space-around; text-align: center; }
    .rc-body { padding: 16px; }
    .rc-section-title { background: #F1F5F9; padding: 6px 12px; font-weight: 700; font-size: 0.85rem; border-left: 4px solid var(--primary); margin-bottom: 10px; margin-top: 14px; text-transform: uppercase; }
  </style>
</head>
<body>
  <header class="header-bar">
    <div class="brand-section">
      <div class="brand-icon">WHATSAPP</div>
      <div>
        <div class="brand-title">Daily Performance Report Card</div>
        <div class="brand-sub">WhatsApp-Ready Formats</div>
      </div>
    </div>
    <div class="nav-links">
      <a href="/admin" class="nav-btn">📊 Admin Dashboard</a>
      <a href="/" class="nav-btn">📝 Office Portal</a>
    </div>
  </header>

  <main class="container">
    <div class="card" style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <label style="margin: 0; font-weight: 700;">Date:</label>
        <input type="date" id="reportDate" class="form-control" style="width: auto; padding: 6px 12px;" onchange="loadReport()">
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-outline" onclick="copyWhatsAppReportText()">📋 Copy WhatsApp Text</button>
        <button class="btn btn-primary" onclick="downloadReportPNG()">🖼️ Download as PNG Image</button>
      </div>
    </div>

    <div class="report-card-container" id="reportCard">
      <div class="rc-header">
        <div style="display:inline-block; background: #F8B133; color: #1E293B; font-weight: 800; font-size: 0.8rem; padding: 2px 10px; border-radius: 4px; margin-bottom: 6px;">DEPARTMENT OF POSTS • INDIA POST</div>
        <h2 style="font-size: 1.25rem;">NEW DELHI CENTRAL DIVISION</h2>
        <h3 style="font-size: 1.05rem; margin-top: 2px;">DAILY SAVINGS & IPPB PERFORMANCE REPORT</h3>
        <p style="font-size: 0.9rem; margin-top: 4px;">Reporting Date: <strong id="rcDisplayDate">--</strong></p>
      </div>

      <div class="rc-kpis">
        <div><div style="font-size:0.75rem; font-weight:700; color:#78350F;">REPORTED</div><div style="font-size:1.35rem; font-weight:800; color:#B45309;" id="rcKpiReported">-- / 55</div></div>
        <div><div style="font-size:0.75rem; font-weight:700; color:#78350F;">PENDING</div><div style="font-size:1.35rem; font-weight:800; color:#DC2626;" id="rcKpiPending">--</div></div>
        <div><div style="font-size:0.75rem; font-weight:700; color:#78350F;">COMPLETION</div><div style="font-size:1.35rem; font-weight:800; color:#2563EB;" id="rcKpiCompletion">--%</div></div>
      </div>

      <div class="rc-body">
        <div class="rc-section-title">1. SAVINGS / POSB PERFORMANCE</div>
        <table class="entry-table" style="margin-bottom: 16px;">
          <thead><tr><th>Scheme</th><th style="text-align:center;">Opened</th><th style="text-align:center;">Closed</th></tr></thead>
          <tbody id="rcSavingsBody"></tbody>
        </table>

        <div class="rc-section-title" style="border-left-color: #F59E0B;">2. IPPB PERFORMANCE</div>
        <table class="entry-table" style="margin-bottom: 12px;">
          <thead><tr><th>IPPB Account</th><th style="text-align:center;">Opened</th><th style="text-align:center;">Closed</th></tr></thead>
          <tbody id="rcIppbBody"></tbody>
        </table>

        <div style="font-size:0.8rem; font-weight:700; color:#475569; margin: 8px 0 4px 0;">IPPB SERVICES ACHIEVEMENTS</div>
        <div id="rcIppbServicesGrid" style="display:grid; grid-template-columns: 1fr 1fr; gap:6px;"></div>
      </div>

      <div style="text-align:center; background:#F8FAFC; padding:10px; font-size:0.78rem; color:var(--text-muted); border-top:1px solid var(--border);">
        New Delhi Central Division Savings Monitoring System • India Post
      </div>
    </div>

    <canvas id="hiddenCanvas" style="display: none;"></canvas>

    <div class="card" style="max-width: 680px; margin: 0 auto;">
      <div class="card-title">
        <span>💬 WhatsApp Monospace Text</span>
        <button class="btn btn-outline" style="font-size:0.8rem; padding:2px 8px;" onclick="copyWhatsAppReportText()">Copy</button>
      </div>
      <textarea id="waText" class="form-control" rows="12" readonly style="font-family:monospace; background:#F8FAFC;"></textarea>
    </div>
  </main>

  <script>
    let reportData = null;
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('reportDate').value = new Date().toISOString().substring(0, 10);
      loadReport();
    });

    async function loadReport() {
      const dt = document.getElementById('reportDate').value;
      document.getElementById('rcDisplayDate').innerText = dt;
      try {
        const [dashRes, waRes] = await Promise.all([
          fetch(\`/api/dashboard?date=\${dt}\`).then(r => r.json()),
          fetch(\`/api/whatsapp-text?date=\${dt}\`).then(r => r.json())
        ]);
        reportData = dashRes;
        document.getElementById('waText').value = waRes.text;

        const m = dashRes.metrics;
        document.getElementById('rcKpiReported').innerText = \`\${m.submitted_count} / \${m.total_offices}\`;
        document.getElementById('rcKpiPending').innerText = m.pending_count;
        document.getElementById('rcKpiCompletion').innerText = \`\${m.completion_pct}%\`;

        const sb = document.getElementById('rcSavingsBody');
        let sHtml = '';
        dashRes.consolidated_products.filter(p => p.section === 'SAVINGS').forEach(p => {
          sHtml += \`<tr>
            <td><strong>\${p.short_name}</strong> - \${p.name.split('(')[0]}</td>
            <td style="text-align:center;">\${p.entry_mode === 'CLOSED_ONLY' ? '<span style="color:#94A3B8;">--</span>' : \`<strong>\${p.total_opened}</strong>\`}</td>
            <td style="text-align:center;"><strong>\${p.total_closed}</strong></td>
          </tr>\`;
        });
        sHtml += \`<tr style="background:#FFF1F2; font-weight:800;">
          <td>TOTAL SAVINGS / POSB</td>
          <td style="text-align:center; color:var(--primary);">\${m.total_savings_opened}</td>
          <td style="text-align:center; color:#991B1B;">\${m.total_savings_closed}</td>
        </tr>\`;
        sb.innerHTML = sHtml;

        const ib = document.getElementById('rcIppbBody');
        let iHtml = '';
        dashRes.consolidated_products.filter(p => p.section === 'IPPB' && p.entry_mode === 'OPENED_AND_CLOSED').forEach(p => {
          iHtml += \`<tr>
            <td><strong>\${p.name}</strong></td>
            <td style="text-align:center;"><strong>\${p.total_opened}</strong></td>
            <td style="text-align:center;"><strong>\${p.total_closed}</strong></td>
          </tr>\`;
        });
        iHtml += \`<tr style="background:#FEF3C7; font-weight:800;">
          <td>TOTAL IPPB ACCOUNTS</td>
          <td style="text-align:center; color:#B45309;">\${m.total_ippb_opened}</td>
          <td style="text-align:center; color:#991B1B;">\${m.total_ippb_closed}</td>
        </tr>\`;
        ib.innerHTML = iHtml;

        const ig = document.getElementById('rcIppbServicesGrid');
        ig.innerHTML = dashRes.consolidated_products.filter(p => p.section === 'IPPB' && p.entry_mode === 'ACHIEVEMENT_COUNT').map(p => \`
          <div style="background:#F8FAFC; border:1px solid var(--border); padding:6px 10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.84rem;">\${p.short_name}</span>
            <strong style="color:#1E40AF;">\${p.total_achievement}</strong>
          </div>\`).join('');
      } catch (err) {
        console.error(err);
      }
    }

    async function copyWhatsAppReportText() {
      await navigator.clipboard.writeText(document.getElementById('waText').value);
      alert('📋 Formatted WhatsApp report copied to clipboard!');
    }

    function downloadReportPNG() {
      if (!reportData) return;
      const canvas = document.getElementById('hiddenCanvas');
      const width = 1200, height = 1680;
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = "#F8FAFC"; ctx.fillRect(0, 0, width, height);

      const m = 30, cw = width - 60, ch = height - 60;
      ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#C8102 - 60;
      ctx.fillStyle = "#FFFFFF"; ctx.strokeStyle = "#C8102E"; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.roundRect(m, m, cw, ch, 24); ctx.fill(); ctx.stroke();

      ctx.save();
      ctx.beginPath(); ctx.roundRect(m, m, cw, 200, [24, 24, 0, 0]); ctx.clip();
      ctx.fillStyle = "#C8102E"; ctx.fillRect(m, m, cw, 200);

      ctx.fillStyle = "#F8B133";
      ctx.beginPath(); ctx.roundRect(width/2 - 200, m + 20, 400, 32, 16); ctx.fill();
      ctx.fillStyle = "#1E293B"; ctx.font = "bold 16px sans-serif"; ctx.textAlign = "center";
      ctx.fillText("DEPARTMENT OF POSTS • INDIA POST", width/2, m + 42);

      ctx.fillStyle = "#FFFFFF"; ctx.font = "bold 32px sans-serif";
      ctx.fillText("NEW DELHI CENTRAL DIVISION", width/2, m + 98);
      ctx.font = "600 22px sans-serif";
      ctx.fillText("DAILY SAVINGS & IPPB PERFORMANCE REPORT", width/2, m + 135);
      ctx.font = "500 18px sans-serif"; ctx.fillStyle = "#FDE68A";
      ctx.fillText(\`Reporting Date: \${reportData.report_date}\`, width/2, m + 172);
      ctx.restore();

      const kpiY = m + 200;
      ctx.fillStyle = "#FFFBEB"; ctx.fillRect(m, kpiY, cw, 110);
      ctx.strokeStyle = "#FDE68A"; ctx.lineWidth = 2; ctx.strokeRect(m, kpiY, cw, 110);

      const met = reportData.metrics;
      ctx.fillStyle = "#78350F"; ctx.font = "bold 15px sans-serif";
      ctx.fillText("OFFICES REPORTED", m + cw * 0.16, kpiY + 38);
      ctx.font = "bold 34px sans-serif"; ctx.fillStyle = "#B45309";
      ctx.fillText(\`\${met.submitted_count} / \${met.total_offices}\`, m + cw * 0.16, kpiY + 82);

      ctx.fillStyle = "#78350F"; ctx.font = "bold 15px sans-serif";
      ctx.fillText("PENDING OFFICES", width/2, kpiY + 38);
      ctx.font = "bold 34px sans-serif"; ctx.fillStyle = met.pending_count > 0 ? "#DC2626" : "#16A34A";
      ctx.fillText(\`\${met.pending_count}\`, width/2, kpiY + 82);

      ctx.fillStyle = "#78350F"; ctx.font = "bold 15px sans-serif";
      ctx.fillText("COMPLETION RATE", m + cw * 0.83, kpiY + 38);
      ctx.font = "bold 34px sans-serif"; ctx.fillStyle = "#2563EB";
      ctx.fillText(\`\${met.completion_pct}%\`, m + cw * 0.83, kpiY + 82);

      let curY = kpiY + 140;
      ctx.fillStyle = "#C8102E"; ctx.fillRect(m + 30, curY, 8, 28);
      ctx.fillStyle = "#0F172A"; ctx.font = "bold 20px sans-serif"; ctx.textAlign = "left";
      ctx.fillText("1. SAVINGS / POSB PERFORMANCE", m + 48, curY + 22);

      curY += 40;
      const tx = m + 30, tw = cw - 60;
      ctx.fillStyle = "#F1F5F9"; ctx.fillRect(tx, curY, tw, 36);
      ctx.fillStyle = "#4
