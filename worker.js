// Cloudflare Worker: India Post New Delhi Central Division Savings Monitor
// No PIN Verification - Direct Office Dropdown Submission

const OFFICES = [{"id":1,"name":"AGCR SO","hpo":"Indraprastha HPO"},{"id":2,"name":"Ajmeri Gate Extn SO","hpo":"Indraprastha HPO"},{"id":3,"name":"Anand Parbat Indl Area SO","hpo":"New Delhi HO"},{"id":4,"name":"Anand Parbat SO","hpo":"New Delhi HO"},{"id":5,"name":"Baroda House SO","hpo":"Indraprastha HPO"},{"id":6,"name":"Bengali Market SO","hpo":"Sansad Marg HPO"},{"id":7,"name":"CAT EXTENSION COUNTER","hpo":"Indraprastha HPO"},{"id":8,"name":"Civic Centre PO","hpo":"Indraprastha HPO"},{"id":9,"name":"Connaught Place SO","hpo":"Sansad Marg HPO"},{"id":10,"name":"Dada Ghosh Bhawan SO","hpo":"New Delhi HO"},{"id":11,"name":"Darya Ganj SO","hpo":"Indraprastha HPO"},{"id":12,"name":"Delhi High Court Extension Counter SO","hpo":"Indraprastha HPO"},{"id":13,"name":"Delhi High Court SO","hpo":"Indraprastha HPO"},{"id":14,"name":"Desh Bandhu Gupta Road SO","hpo":"New Delhi HO"},{"id":15,"name":"Election Commission SO","hpo":"Sansad Marg HPO"},{"id":16,"name":"Gandhi Smarak Nidhi SO","hpo":"Indraprastha HPO"},{"id":17,"name":"Guru Gobind Singh Marg SO","hpo":"New Delhi HO"},{"id":18,"name":"IARI SO","hpo":"New Delhi HO"},{"id":19,"name":"Inderpuri SO","hpo":"New Delhi HO"},{"id":20,"name":"Indraprastha HO","hpo":"Indraprastha HPO"},{"id":21,"name":"IPEstate SO","hpo":"Indraprastha HPO"},{"id":22,"name":"Jama Masjid SO","hpo":"Indraprastha HPO"},{"id":23,"name":"Karol Bagh SO","hpo":"New Delhi HO"},{"id":24,"name":"Krishi Bhawan SO","hpo":"Sansad Marg HPO"},{"id":25,"name":"Lady Harding Medical College SO","hpo":"Sansad Marg HPO"},{"id":26,"name":"Minto Road SO","hpo":"Indraprastha HPO"},{"id":27,"name":"Multani Dhanda SO","hpo":"New Delhi HO"},{"id":28,"name":"National Physical Laboratory SO","hpo":"New Delhi HO"},{"id":29,"name":"NGT EXTENSION COUNTER","hpo":"Indraprastha HPO"},{"id":30,"name":"Nirman Bhawan SO","hpo":"Sansad Marg HPO"},{"id":31,"name":"North Avenue SO","hpo":"Sansad Marg HPO"},{"id":32,"name":"Pahar Ganj SO","hpo":"New Delhi HO"},{"id":33,"name":"Pandara Road SO","hpo":"Indraprastha HPO"},{"id":34,"name":"Parliament House SO","hpo":"Sansad Marg HPO"},{"id":35,"name":"Patel Nagar East SO","hpo":"New Delhi HO"},{"id":36,"name":"Patel Nagar SO Central Delhi","hpo":"New Delhi HO"},{"id":37,"name":"Patel Nagar South SO","hpo":"New Delhi HO"},{"id":38,"name":"Patel Nagar West SO","hpo":"New Delhi HO"},{"id":39,"name":"Patiala House SO","hpo":"Indraprastha HPO"},{"id":40,"name":"Pragati Maidan SO","hpo":"Indraprastha HPO"},{"id":41,"name":"Rail Bhawan SO","hpo":"Sansad Marg HPO"},{"id":42,"name":"Rajender Nagar SO","hpo":"New Delhi HO"},{"id":43,"name":"Rashtrapati Bhawan SO","hpo":"Sansad Marg HPO"},{"id":44,"name":"Rouse Avenue Extension Counter SO","hpo":"Indraprastha HPO"},{"id":45,"name":"Sansad Marg HO","hpo":"Sansad Marg HPO"},{"id":46,"name":"Sansadiya Soudh SO","hpo":"Sansad Marg HPO"},{"id":47,"name":"Sat Nagar SO","hpo":"New Delhi HO"},{"id":48,"name":"Secretariat North SO","hpo":"Sansad Marg HPO"},{"id":49,"name":"Shastri Bhawan SO","hpo":"Sansad Marg HPO"},{"id":50,"name":"South Avenue SO","hpo":"Sansad Marg HPO"},{"id":51,"name":"SRT NAGAR EXTENSION COUNTER","hpo":"New Delhi HO"},{"id":52,"name":"Supreme Court SO","hpo":"Indraprastha HPO"},{"id":53,"name":"Swami Ram Tirth Nagar SO","hpo":"New Delhi HO"},{"id":54,"name":"Udyog Bhawan SO","hpo":"Sansad Marg HPO"},{"id":55,"name":"Union Public Service Commission SO","hpo":"Sansad Marg HPO"}];

const PRODUCTS = [{"id":1,"code":"SB","name":"Savings Bank Account (SB)","short":"SB","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":2,"code":"RD","name":"Recurring Deposit (RD)","short":"RD","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":3,"code":"TD","name":"Time Deposit (TD)","short":"TD","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":4,"code":"MIS","name":"Monthly Income Scheme (MIS)","short":"MIS","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":5,"code":"PPF","name":"Public Provident Fund (PPF)","short":"PPF","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":6,"code":"NSC","name":"National Savings Certificate (NSC)","short":"NSC","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":7,"code":"KVP","name":"Kisan Vikas Patra (KVP)","short":"KVP","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":8,"code":"SCSS","name":"Senior Citizens Savings Scheme (SCSS)","short":"SCSS","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":9,"code":"SSA","name":"Sukanya Samriddhi Account (SSA)","short":"SSA","sec":"SAVINGS","mode":"OPENED_AND_CLOSED"},{"id":10,"code":"NSC_VIII","name":"NSC VIII Issue (Discontinued)","short":"NSC VIII","sec":"SAVINGS","mode":"CLOSED_ONLY"},{"id":11,"code":"IVP","name":"Indira Vikas Patra (IVP)","short":"IVP","sec":"SAVINGS","mode":"CLOSED_ONLY"},{"id":12,"code":"IPPB_REG","name":"IPPB Regular Savings Account","short":"Regular A/C","sec":"IPPB","mode":"OPENED_AND_CLOSED"},{"id":13,"code":"IPPB_PREM","name":"IPPB Premium Savings Account","short":"Premium A/C","sec":"IPPB","mode":"OPENED_AND_CLOSED"},{"id":14,"code":"IPPB_UPGRADE","name":"Account Upgradation","short":"A/C Upgrade","sec":"IPPB","mode":"ACHIEVEMENT_COUNT"},{"id":15,"code":"IPPB_AADHAAR","name":"Aadhaar Seeding","short":"Aadhaar Seed","sec":"IPPB","mode":"ACHIEVEMENT_COUNT"},{"id":16,"code":"IPPB_CELC","name":"CELC (Child Enrolment Lite Client)","short":"CELC","sec":"IPPB","mode":"ACHIEVEMENT_COUNT"},{"id":17,"code":"IPPB_LINKING","name":"POSB–IPPB Linking","short":"POSB-IPPB Link","sec":"IPPB","mode":"ACHIEVEMENT_COUNT"},{"id":18,"code":"IPPB_LI","name":"Life Insurance (LI)","short":"Life Ins.","sec":"IPPB","mode":"ACHIEVEMENT_COUNT"},{"id":19,"code":"IPPB_GI","name":"General Insurance (GI)","short":"Gen. Ins.","sec":"IPPB","mode":"ACHIEVEMENT_COUNT"},{"id":20,"code":"IPPB_PAI","name":"Personal Accident Insurance (PAI)","short":"PAI","sec":"IPPB","mode":"ACHIEVEMENT_COUNT"},{"id":21,"code":"IPPB_HI","name":"Health Insurance (HI)","short":"Health Ins.","sec":"IPPB","mode":"ACHIEVEMENT_COUNT"}];

async function ensureTables(env) {
  if (!env.DB) return;
  try {
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS daily_submissions (id INTEGER PRIMARY KEY AUTOINCREMENT, office_id INT NOT NULL, office_name TEXT NOT NULL, hpo_group TEXT NOT NULL, report_date TEXT NOT NULL, submitted_by TEXT, submitted_at TEXT, updated_at TEXT, is_modified_by_admin INT DEFAULT 0, admin_notes TEXT, UNIQUE(office_id, report_date))"
    ).run();
    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS submission_items (id INTEGER PRIMARY KEY AUTOINCREMENT, submission_id INT NOT NULL, product_code TEXT NOT NULL, opened_count INT DEFAULT 0, closed_count INT DEFAULT 0, achievement_count INT DEFAULT 0, UNIQUE(submission_id, product_code))"
    ).run();
  } catch (e) {
    console.error("Table init error:", e);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });

    const html = (content) =>
      new Response(content, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });

    if (pathname.startsWith("/api/")) {
      await ensureTables(env);
    }

    // 1. API: Offices
    if (pathname === "/api/offices") {
      return json({ offices: OFFICES });
    }

    // 2. API: Products
    if (pathname === "/api/products") {
      return json({ products: PRODUCTS });
    }

    // 3. API: Existing Submission Check
    if (pathname === "/api/submission") {
      const officeId = searchParams.get("office_id");
      const date = searchParams.get("date");
      if (!officeId || !date) return json({ error: "Missing parameters" }, 400);

      try {
        const sub = await env.DB.prepare(
          "SELECT * FROM daily_submissions WHERE office_id = ? AND report_date = ?"
        ).bind(officeId, date).first();

        if (!sub) return json({ exists: false });

        const items = await env.DB.prepare(
          "SELECT product_code as code, opened_count, closed_count, achievement_count FROM submission_items WHERE submission_id = ?"
        ).bind(sub.id).all();

        const itemsMap = {};
        for (const it of items.results) itemsMap[it.code] = it;
        sub.items = itemsMap;
        return json({ exists: true, submission: sub });
      } catch (e) {
        return json({ exists: false, error: e.message });
      }
    }

    // 4. API: Submit / Update Performance Data (No PIN Required)
    if (pathname === "/api/submit" && request.method === "POST") {
      try {
        const body = await request.json();
        const { office_id, report_date, submitted_by, items, is_admin, admin_notes } = body;

        if (!office_id || !report_date) return json({ detail: "Office and Date required" }, 400);

        const targetOffice = OFFICES.find((o) => o.id === parseInt(office_id, 10));
        if (!targetOffice) return json({ detail: "Invalid office selected" }, 400);

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
            "INSERT INTO daily_submissions (office_id, office_name, hpo_group, report_date, submitted_by, submitted_at, updated_at, is_modified_by_admin, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(office_id, targetOffice.name, targetOffice.hpo, report_date, submitted_by || "Staff", now, now, is_admin ? 1 : 0, admin_notes || null).run();
          subId = res.meta.last_row_id;
        }

        for (const p of PRODUCTS) {
          const pData = (items && items[p.code]) || {};
          let opened = parseInt(pData.opened || 0);
          let closed = parseInt(pData.closed || 0);
          let achieve = parseInt(pData.achievement || 0);

          if (p.mode === "CLOSED_ONLY") { opened = 0; achieve = 0; }
          if (p.mode === "OPENED_ONLY") { closed = 0; achieve = 0; }
          if (p.mode === "ACHIEVEMENT_COUNT") { opened = 0; closed = 0; }
          if (p.mode === "OPENED_AND_CLOSED") { achieve = 0; }

          await env.DB.prepare(`
            INSERT INTO submission_items (submission_id, product_code, opened_count, closed_count, achievement_count)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(submission_id, product_code) DO UPDATE SET
              opened_count = excluded.opened_count,
              closed_count = excluded.closed_count,
              achievement_count = excluded.achievement_count
          `).bind(subId, p.code, opened, closed, achieve).run();
        }

        return json({ status: "success", submission_id: subId, action });
      } catch (e) {
        return json({ detail: e.message }, 500);
      }
    }

    // 5. API: Dashboard
    if (pathname === "/api/dashboard") {
      try {
        const date = searchParams.get("date") || new Date().toISOString().substring(0, 10);
        const submissions = await env.DB.prepare(
          "SELECT * FROM daily_submissions WHERE report_date = ?"
        ).bind(date).all();

        const submittedIds = new Set(submissions.results.map((s) => s.office_id));
        const pendingOffices = OFFICES.filter((o) => !submittedIds.has(o.id));

        const items = await env.DB.prepare(`
          SELECT si.product_code,
                 SUM(si.opened_count) as total_opened,
                 SUM(si.closed_count) as total_closed,
                 SUM(si.achievement_count) as total_achievement
          FROM submission_items si
          JOIN daily_submissions s ON si.submission_id = s.id
          WHERE s.report_date = ?
          GROUP BY si.product_code
        `).bind(date).all();

        const itemsMap = {};
        for (const it of items.results) itemsMap[it.product_code] = it;

        let totalSavingsO = 0, totalSavingsC = 0, totalIppbO = 0, totalIppbC = 0, totalIppbAch = 0;
        const consolidated = PRODUCTS.map((p) => {
          const it = itemsMap[p.code] || { total_opened: 0, total_closed: 0, total_achievement: 0 };
          const row = {
            ...p,
            total_opened: it.total_opened || 0,
            total_closed: it.total_closed || 0,
            total_achievement: it.total_achievement || 0
          };
          if (p.sec === "SAVINGS") {
            totalSavingsO += row.total_opened;
            totalSavingsC += row.total_closed;
          } else if (p.sec === "IPPB") {
            if (p.mode === "OPENED_AND_CLOSED") {
              totalIppbO += row.total_opened;
              totalIppbC += row.total_closed;
            } else {
              totalIppbAch += row.total_achievement;
            }
          }
          return row;
        });

        const matrix = [];
        for (const off of OFFICES) {
          const sub = submissions.results.find((s) => s.office_id === off.id);
          const row = {
            office_id: off.id,
            office_name: off.name,
            hpo_group: off.hpo,
            status: sub ? "SUBMITTED" : "PENDING",
            submitted_at: sub ? sub.submitted_at : null,
            updated_at: sub ? sub.updated_at : null,
            is_modified_by_admin: sub ? Boolean(sub.is_modified_by_admin) : false,
            submitted_by: sub ? sub.submitted_by : "",
            counts: {}
          };
          if (sub) {
            const sItems = await env.DB.prepare(
              "SELECT product_code, opened_count, closed_count, achievement_count FROM submission_items WHERE submission_id = ?"
            ).bind(sub.id).all();
            for (const item of sItems.results) {
              row.counts[item.product_code] = {
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
            total_offices: OFFICES.length,
            submitted_count: submissions.results.length,
            pending_count: pendingOffices.length,
            completion_pct: Math.round((submissions.results.length / OFFICES.length) * 1000) / 10,
            total_savings_opened: totalSavingsO,
            total_savings_closed: totalSavingsC,
            total_ippb_opened: totalIppbO,
            total_ippb_closed: totalIppbC,
            total_ippb_achievements: totalIppbAch,
          },
          consolidated_products: consolidated,
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
        `📊 *Reporting Status:* ${m.submitted_count} / ${m.total_offices} Offices`,
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
        if (p.sec === "SAVINGS") {
          const sname = (p.short + "      ").substring(0, 6);
          if (p.mode === "CLOSED_ONLY") {
            lines.push(`│ ${sname} │   --   │  ${String(p.total_closed).padStart(5, " ")} │`);
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
        if (p.sec === "IPPB" && p.mode === "ACHIEVEMENT_COUNT") {
          lines.push(`• ${p.name}: *${p.total_achievement}*`);
        }
      }

      lines.push("", "━━━━━━━━━━━━━━━━━━━━━━", "Generated via Divisional Reporting Portal");
      return json({ text: lines.join("\\n") });
    }

    // 7. API: CSV Export
    if (pathname === "/api/export/csv") {
      const date = searchParams.get("date") || new Date().toISOString().substring(0, 10);
      const dashReq = new Request(`${url.origin}/api/dashboard?date=${date}`);
      const dashRes = await this.fetch(dashReq, env, ctx);
      const dash = await dashRes.json();

      const headers = ["Office Name", "HPO Group", "Status", "Submitted By", "Submission Time", "Last Updated"];
      for (const p of PRODUCTS) {
        if (p.mode === "OPENED_AND_CLOSED") {
          headers.push(`${p.short} Opened`, `${p.short} Closed`);
        } else if (p.mode === "CLOSED_ONLY") {
          headers.push(`${p.short} Closed`);
        } else {
          headers.push(`${p.short} Count`);
        }
      }

      const rows = [headers.map((h) => `"${h}"`).join(",")];
      for (const r of dash.office_matrix) {
        const line = [r.office_name, r.hpo_group, r.status, r.submitted_by || "", r.submitted_at || "", r.updated_at || ""];
        for (const p of PRODUCTS) {
          const v = (r.counts && r.counts[p.code]) || { opened: 0, closed: 0, achievement: 0 };
          if (p.mode === "OPENED_AND_CLOSED") line.push(v.opened, v.closed);
          else if (p.mode === "CLOSED_ONLY") line.push(v.closed);
          else line.push(v.achievement);
        }
        rows.push(line.map((val) => `"${val}"`).join(","));
      }

      return new Response(rows.join("\\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=Savings_Performance_${date}.csv`
        }
      });
    }

    if (pathname === "/admin") return html(renderAdminPage());
    if (pathname === "/report") return html(renderReportPage());
    return html(renderIndexPage());
  }
};

const PAGE_CSS = `
:root { --primary:#C8102E; --primary-dark:#9E0C24; --secondary:#F8B133; --bg:#F8FAFC; --card:#FFF; --text:#0F172A; --muted:#64748B; --border:#E2E8F0; --green:#10B981; --red:#EF4444; --amber:#F59E0B; --blue:#3B82F6; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
* { box-sizing:border-box; margin:0; padding:0; }
body { background:var(--bg); color:var(--text); line-height:1.5; padding-bottom:50px; }
.header-bar { background:linear-gradient(135deg,var(--primary) 0%,var(--primary-dark) 100%); color:#FFF; padding:14px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; }
.brand { display:flex; align-items:center; gap:10px; }
.brand-icon { background:var(--secondary); color:#1E293B; font-weight:800; padding:6px 10px; border-radius:6px; font-size:1.1rem; }
.brand-title { font-size:1.1rem; font-weight:700; }
.brand-sub { font-size:0.8rem; opacity:0.9; }
.nav-btn { background:rgba(255,255,255,0.15); color:#FFF; border:1px solid rgba(255,255,255,0.3); padding:5px 12px; border-radius:6px; text-decoration:none; font-size:0.85rem; font-weight:600; cursor:pointer; }
.container { max-width:1050px; margin:20px auto; padding:0 14px; }
.card { background:var(--card); border-radius:10px; border:1px solid var(--border); padding:20px; margin-bottom:18px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
.card-title { font-size:1.1rem; font-weight:700; color:var(--primary); margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid var(--border); padding-bottom:6px; }
.stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(190px,1fr)); gap:14px; margin-bottom:18px; }
.stat-card { background:#FFF; padding:16px; border-radius:8px; border:1px solid var(--border); border-top:4px solid var(--primary); }
.stat-val { font-size:1.8rem; font-weight:800; color:var(--text); margin-top:2px; }
.stat-label { font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--muted); }
.grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
@media (max-width:640px) { .grid-2, .grid-3 { grid-template-columns:1fr; } }
.form-group { margin-bottom:14px; }
label { display:block; font-size:0.85rem; font-weight:600; margin-bottom:5px; }
.form-control { width:100%; padding:9px 12px; border-radius:6px; border:1.5px solid var(--border); font-size:0.92rem; background:#FFF; font-family:inherit; }
.form-control:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 2px rgba(200,16,46,0.15); }
.entry-table { width:100%; border-collapse:collapse; margin-top:6px; }
.entry-table th { background:#F1F5F9; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--muted); padding:8px 10px; text-align:left; border-bottom:2px solid var(--border); }
.entry-table td { padding:8px 10px; border-bottom:1px solid var(--border); vertical-align:middle; }
.num-input { width:85px; padding:7px 8px; font-size:0.95rem; font-weight:600; text-align:center; border-radius:6px; border:1.5px solid var(--border); background:#FAFAFA; }
.num-input:focus { background:#FFF; border-color:var(--primary); outline:none; }
.btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:9px 18px; border-radius:6px; font-size:0.9rem; font-weight:600; cursor:pointer; border:none; text-decoration:none; }
.btn-primary { background:var(--primary); color:#FFF; }
.btn-warning { background:var(--amber); color:#78350F; }
.btn-outline { background:transparent; border:1.5px solid var(--border); color:var(--text); }
.badge { display:inline-block; padding:3px 7px; border-radius:99px; font-size:0.72rem; font-weight:700; text-transform:uppercase; }
.badge-success { background:#ECFDF5; color:#065F46; }
.badge-danger { background:#FEF2F2; color:#991B1B; }
.badge-warning { background:#FFFBEB; color:#92400E; }
.alert { padding:12px 16px; border-radius:6px; margin-bottom:16px; font-size:0.88rem; }
.alert-warning { background:#FFFBEB; border:1px solid #FDE68A; color:#B45309; }
.alert-success { background:#ECFDF5; border:1px solid #A7F3D0; color:#065F46; }
.alert-danger { background:#FEF2F2; border:1px solid #FECACA; color:#991B1B; }
.progress-bar-container { background:#E2E8F0; height:10px; border-radius:5px; overflow:hidden; margin:8px 0; }
.progress-bar-fill { background:linear-gradient(90deg,var(--secondary) 0%,var(--primary) 100%); height:100%; border-radius:5px; transition:width 0.4s; }
.modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(15,23,42,0.6); display:none; align-items:center; justify-content:center; z-index:999; padding:16px; }
.modal-content { background:#FFF; border-radius:10px; max-width:480px; width:100%; padding:20px; }
`;

function renderIndexPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>India Post - Daily Savings Performance Entry</title>
  <style>` + PAGE_CSS + `</style>
</head>
<body>
  <header class="header-bar">
    <div class="brand">
      <div class="brand-icon">IP</div>
      <div>
        <div class="brand-title">Department of Posts – India Post</div>
        <div class="brand-sub">New Delhi Central Division | Daily Performance Entry Portal</div>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <a href="/admin" class="nav-btn">📊 Admin Dashboard</a>
      <a href="/report" class="nav-btn">📱 WhatsApp Card</a>
    </div>
  </header>

  <main class="container">
    <div id="updateBanner" class="alert alert-warning" style="display:none;">
      ⚠️ <strong>Existing Submission Found:</strong> <span id="updateBannerText"></span>
      <div style="font-size:0.8rem; margin-top:3px;">You are currently in <strong>Update Mode</strong>. Submitting will update your office figures.</div>
    </div>
    <div id="statusAlert" class="alert" style="display:none;"></div>

    <form id="submissionForm" onsubmit="handleFormSubmit(event)">
      <div class="card">
        <div class="card-title"><span>🏢 1. Office Identification</span><span style="font-size:0.75rem; color:var(--muted);">Mandatory</span></div>
        <div class="grid-3">
          <div class="form-group">
            <label for="officeSelect">Select Office Name *</label>
            <select id="officeSelect" class="form-control" required onchange="handleOfficeChange()">
              <option value="">-- Choose Post Office (55 Operational) --</option>
            </select>
          </div>
          <div class="form-group">
            <label for="reportDate">Reporting Date *</label>
            <input type="date" id="reportDate" class="form-control" required onchange="handleDateChange()">
          </div>
          <div class="form-group">
            <label for="submittedBy">Submitted By (Official Name / Designation)</label>
            <input type="text" id="submittedBy" class="form-control" placeholder="e.g. SPM / Postal Assistant">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span>💰 2. Savings Bank (POSB) Performance</span><span class="badge badge-success">Section 1</span></div>
        <h4 style="font-size:0.9rem; margin-bottom:6px;">A. Active Savings Schemes (Opening & Closing)</h4>
        <div style="overflow-x:auto;">
          <table class="entry-table">
            <thead><tr><th style="width:50%;">Scheme Name</th><th style="width:25%; text-align:center;">Opened</th><th style="width:25%; text-align:center;">Closed</th></tr></thead>
            <tbody id="savingsActiveBody"></tbody>
          </table>
        </div>
        <h4 style="font-size:0.9rem; margin-top:18px; margin-bottom:6px;">B. Discontinued Savings Schemes (Closing Only)</h4>
        <div style="overflow-x:auto;">
          <table class="entry-table">
            <thead><tr><th style="width:50%;">Scheme Name</th><th style="width:25%; text-align:center;">Opened</th><th style="width:25%; text-align:center;">Closed</th></tr></thead>
            <tbody id="savingsDiscontinuedBody"></tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-title"><span>📱 3. IPPB (India Post Payments Bank) Performance</span><span class="badge badge-warning">Section 2</span></div>
        <h4 style="font-size:0.9rem; margin-bottom:6px;">A. IPPB Accounts (Opening & Closing)</h4>
        <div style="overflow-x:auto;">
          <table class="entry-table">
            <thead><tr><th style="width:50%;">Account Type</th><th style="width:25%; text-align:center;">Opened</th><th style="width:25%; text-align:center;">Closed</th></tr></thead>
            <tbody id="ippbAccountsBody"></tbody>
          </table>
        </div>
        <h4 style="font-size:0.9rem; margin-top:18px; margin-bottom:6px;">B. IPPB Services & Activities (Achievement Count)</h4>
        <div style="overflow-x:auto;">
          <table class="entry-table">
            <thead><tr><th style="width:70%;">Activity / Service</th><th style="width:30%; text-align:center;">Today's Count</th></tr></thead>
            <tbody id="ippbServicesBody"></tbody>
          </table>
        </div>
      </div>

      <div style="display:flex; gap:12px; justify-content:flex-end; align-items:center;">
        <button type="button" class="btn btn-outline" onclick="resetFormToZeroes()">Clear All Fields to 0</button>
        <button type="submit" id="submitBtn" class="btn btn-primary" style="padding:11px 28px; font-size:1rem;">📤 Submit Daily Performance</button>
      </div>
    </form>
  </main>

  <div id="zeroModal" class="modal-overlay">
    <div class="modal-content">
      <h3 style="color:#B45309; margin-bottom:10px;">⚠️ Zero Performance Confirmation</h3>
      <p style="font-size:0.9rem; color:#475569; margin-bottom:18px;">You have entered <strong>0</strong> for all products.<br><br>Are you sure your office had <strong>zero transactions</strong> today?</p>
      <div style="display:flex; justify-content:flex-end; gap:10px;">
        <button type="button" class="btn btn-outline" onclick="closeZeroModal()">Cancel & Review</button>
        <button type="button" class="btn btn-warning" onclick="executeSubmission(true)">Yes, Submit Zero Figures</button>
      </div>
    </div>
  </div>

  <script>
    const OFFICES = ` + JSON.stringify(OFFICES) + `;
    const PRODUCTS = ` + JSON.stringify(PRODUCTS) + `;

    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('reportDate').value = new Date().toISOString().substring(0, 10);
      const sel = document.getElementById('officeSelect');
      OFFICES.forEach(o => {
        const opt = document.createElement('option');
        opt.value = o.id; opt.text = o.name + ' (' + o.hpo + ')';
        sel.appendChild(opt);
      });

      const sActive = document.getElementById('savingsActiveBody');
      const sDisc = document.getElementById('savingsDiscontinuedBody');
      const iAcc = document.getElementById('ippbAccountsBody');
      const iServ = document.getElementById('ippbServicesBody');

      PRODUCTS.forEach(p => {
        if (p.sec === 'SAVINGS' && p.mode === 'OPENED_AND_CLOSED') {
          sActive.innerHTML += '<tr><td><strong>' + p.name + '</strong> <span style="font-size:0.75rem; background:#E2E8F0; padding:1px 5px; border-radius:4px;">' + p.short + '</span></td><td style="text-align:center;"><input type="number" min="0" id="prod_' + p.code + '_opened" class="num-input count-field" value="0"></td><td style="text-align:center;"><input type="number" min="0" id="prod_' + p.code + '_closed" class="num-input count-field" value="0"></td></tr>';
        } else if (p.sec === 'SAVINGS' && p.mode === 'CLOSED_ONLY') {
          sDisc.innerHTML += '<tr><td><strong>' + p.name + '</strong></td><td style="text-align:center; color:var(--muted); font-size:0.8rem; font-style:italic;">Discontinued</td><td style="text-align:center;"><input type="number" min="0" id="prod_' + p.code + '_closed" class="num-input count-field" value="0"></td></tr>';
        } else if (p.sec === 'IPPB' && p.mode === 'OPENED_AND_CLOSED') {
          iAcc.innerHTML += '<tr><td><strong>' + p.name + '</strong></td><td style="text-align:center;"><input type="number" min="0" id="prod_' + p.code + '_opened" class="num-input count-field" value="0"></td><td style="text-align:center;"><input type="number" min="0" id="prod_' + p.code + '_closed" class="num-input count-field" value="0"></td></tr>';
        } else if (p.sec === 'IPPB' && p.mode === 'ACHIEVEMENT_COUNT') {
          iServ.innerHTML += '<tr><td><strong>' + p.name + '</strong></td><td style="text-align:center;"><input type="number" min="0" id="prod_' + p.code + '_achievement" class="num-input count-field" value="0"></td></tr>';
        }
      });

      const savedOfficeId = localStorage.getItem('ip_office_id');
      if (savedOfficeId) {
        sel.value = savedOfficeId;
        checkExistingSubmission();
      }
    });

    function handleOfficeChange() {
      const officeId = document.getElementById('officeSelect').value;
      if (officeId) {
        localStorage.setItem('ip_office_id', officeId);
      }
      checkExistingSubmission();
    }
    function handleDateChange() { checkExistingSubmission(); }

    async function checkExistingSubmission() {
      const officeId = document.getElementById('officeSelect').value;
      const reportDate = document.getElementById('reportDate').value;
      const updateBanner = document.getElementById('updateBanner');
      const submitBtn = document.getElementById('submitBtn');
      if (!officeId || !reportDate) return;

      try {
        const res = await fetch('/api/submission?office_id=' + officeId + '&date=' + reportDate);
        const data = await res.json();
        if (data.exists) {
          const sub = data.submission;
          document.getElementById('updateBannerText').innerHTML = 'Recorded by <strong>' + (sub.submitted_by || 'Staff') + '</strong> at <strong>' + sub.submitted_at + '</strong>';
          updateBanner.style.display = 'block';
          submitBtn.innerText = '✏️ Update Daily Performance';
          submitBtn.className = 'btn btn-warning';
          if (sub.items) {
            for (const [code, item] of Object.entries(sub.items)) {
              const oInp = document.getElementById('prod_' + code + '_opened');
              const cInp = document.getElementById('prod_' + code + '_closed');
              const aInp = document.getElementById('prod_' + code + '_achievement');
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
      } catch (err) { console.error(err); }
    }

    function resetFormToZeroes() {
      document.querySelectorAll('.count-field').forEach(f => f.value = '0');
    }

    function handleFormSubmit(event) {
      event.preventDefault();
      const fields = document.querySelectorAll('.count-field');
      let sum = 0;
      for (const f of fields) {
        const val = parseInt(f.value || 0, 10);
        if (isNaN(val) || val < 0) {
          showAlert('Negative numbers not allowed.', 'danger');
          f.focus(); return;
        }
        sum += val;
      }
      if (sum === 0) {
        document.getElementById('zeroModal').style.display = 'flex';
        return;
      }
      executeSubmission(false);
    }
    function closeZeroModal() { document.getElementById('zeroModal').style.display = 'none'; }

    async function executeSubmission(isZero) {
      closeZeroModal();
      const officeSelect = document.getElementById('officeSelect');
      const officeId = officeSelect.value;
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

      const payload = { office_id: parseInt(officeId, 10), report_date: reportDate, submitted_by: submittedBy, items };
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
          localStorage.setItem('ip_office_id', officeId);
          showAlert('✅ Success! Daily Performance ' + (data.action === 'UPDATE' ? 'Updated' : 'Submitted') + ' successfully for ' + officeSelect.options[officeSelect.selectedIndex].text + '.', 'success');
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
      const el = document.getElementById('statusAlert');
      el.className = 'alert alert-' + type;
      el.innerHTML = msg; el.style.display = 'block';
    }
  </script>
</body>
</html>`;
}

function renderAdminPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - New Delhi Central Division</title>
  <style>` + PAGE_CSS + `</style>
</head>
<body>
  <header class="header-bar">
    <div class="brand">
      <div class="brand-icon">ADMIN</div>
      <div>
        <div class="brand-title">New Delhi Central Division – Executive Dashboard</div>
        <div class="brand-sub">Daily Savings & IPPB Performance Live Monitoring</div>
      </div>
    </div>
    <div style="display:flex; gap:10px;">
      <a href="/" class="nav-btn">📝 Office Portal</a>
      <a href="/report" class="nav-btn">📱 WhatsApp Card</a>
      <button onclick="downloadCSV()" class="nav-btn">📥 Export CSV</button>
    </div>
  </header>

  <main class="container">
    <div class="card" style="padding:14px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <label style="margin:0; font-weight:700;">Date:</label>
        <input type="date" id="adminDateSelect" class="form-control" style="width:auto; padding:5px 10px;" onchange="loadDashboard()">
        <button class="btn btn-outline" style="padding:5px 12px;" onclick="loadDashboard()">🔄 Refresh</button>
      </div>
      <div style="font-size:0.85rem; color:var(--muted);">Operational Units: <strong>55 Offices</strong></div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Total Offices</div><div class="stat-val">55</div></div>
      <div class="stat-card" style="border-top-color:var(--green);"><div class="stat-label">Submitted</div><div class="stat-val" style="color:var(--green);" id="kpiSub">0</div><div style="font-size:0.8rem; color:var(--muted);" id="kpiPct">0%</div></div>
      <div class="stat-card" style="border-top-color:var(--red);"><div class="stat-label">Pending</div><div class="stat-val" style="color:var(--red);" id="kpiPend">55</div></div>
      <div class="stat-card" style="border-top-color:var(--amber);"><div class="stat-label">Savings Accounts (O / C)</div><div class="stat-val"><span id="kpiSO">0</span> / <span id="kpiSC" style="font-size:1.1rem; color:var(--muted);">0</span></div></div>
      <div class="stat-card" style="border-top-color:var(--blue);"><div class="stat-label">IPPB (Accounts / Services)</div><div class="stat-val"><span id="kpiIO">0</span> / <span id="kpiIA" style="font-size:1.1rem; color:var(--muted);">0</span></div></div>
    </div>

    <div class="card" style="border-left:5px solid var(--red);">
      <div class="card-title"><span style="color:var(--red);">⏳ Pending Offices (<span id="pendingCount">0</span>)</span>
        <button class="btn btn-outline" style="font-size:0.8rem; padding:4px 10px; border-color:var(--red); color:var(--red);" onclick="copyPending()">📋 Copy Pending for WhatsApp</button>
      </div>
      <div id="pendingList" style="display:flex; flex-wrap:wrap; gap:6px;"></div>
    </div>

    <div class="card">
      <div class="card-title"><span>📊 Consolidated Performance</span><a href="/report" id="repLink" class="btn btn-primary" style="font-size:0.8rem; padding:5px 12px;">📱 WhatsApp Card</a></div>
      <div style="overflow-x:auto;">
        <table class="entry-table">
          <thead><tr><th>Product Name</th><th>Section</th><th style="text-align:center;">Opened</th><th style="text-align:center;">Closed</th><th style="text-align:center;">Net / Count</th></tr></thead>
          <tbody id="summaryBody"></tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-title"><span>📑 Office-wise Matrix (55 Offices)</span></div>
      <div style="overflow-x:auto; max-height:480px;">
        <table class="entry-table">
          <thead style="position:sticky; top:0; z-index:5;"><tr><th>Office Name</th><th>HPO</th><th style="text-align:center;">Status</th><th>Time</th><th style="text-align:center;">Savings (O/C)</th><th style="text-align:center;">IPPB (O/C)</th></tr></thead>
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
      document.getElementById('repLink').href = '/report?date=' + dt;
      try {
        const res = await fetch('/api/dashboard?date=' + dt);
        currentData = await res.json();
        renderDash(currentData);
      } catch (e) { console.error(e); }
    }

    function renderDash(d) {
      const m = d.metrics;
      document.getElementById('kpiSub').innerText = m.submitted_count;
      document.getElementById('kpiPct').innerText = m.completion_pct + '% Completion';
      document.getElementById('kpiPend').innerText = m.pending_count;
      document.getElementById('kpiSO').innerText = m.total_savings_opened;
      document.getElementById('kpiSC').innerText = m.total_savings_closed;
      document.getElementById('kpiIO').innerText = m.total_ippb_opened;
      document.getElementById('kpiIA').innerText = m.total_ippb_achievements;

      document.getElementById('pendingCount').innerText = d.pending_offices.length;
      const pl = document.getElementById('pendingList');
      if (d.pending_offices.length === 0) {
        pl.innerHTML = '<span class="badge badge-success" style="font-size:0.85rem;">🎉 All 55 offices submitted!</span>';
      } else {
        pl.innerHTML = d.pending_offices.map(o => '<span class="badge badge-danger" style="font-size:0.75rem; padding:4px 8px;">❌ ' + o.name + ' (' + o.hpo + ')</span>').join('');
      }

      const sb = document.getElementById('summaryBody');
      let html = '<tr style="background:#FFF1F2; font-weight:700;"><td colspan="5" style="color:var(--primary);">SAVINGS BANK (POSB)</td></tr>';
      d.consolidated_products.filter(p => p.sec === 'SAVINGS').forEach(p => {
        html += '<tr><td><strong>' + p.name + '</strong></td><td><span class="badge badge-success">POSB</span></td><td style="text-align:center;">' + (p.mode === 'CLOSED_ONLY' ? '--' : p.total_opened) + '</td><td style="text-align:center;">' + p.total_closed + '</td><td style="text-align:center; font-weight:700;">' + (p.mode === 'CLOSED_ONLY' ? -p.total_closed : (p.total_opened - p.total_closed)) + '</td></tr>';
      });
      html += '<tr style="background:#FFE4E6; font-weight:800;"><td>TOTAL SAVINGS</td><td>TOTAL</td><td style="text-align:center; color:var(--primary);">' + m.total_savings_opened + '</td><td style="text-align:center; color:#991B1B;">' + m.total_savings_closed + '</td><td style="text-align:center;">' + (m.total_savings_opened - m.total_savings_closed) + '</td></tr>';

      html += '<tr style="background:#FEF3C7; font-weight:700;"><td colspan="5" style="color:#92400E;">IPPB</td></tr>';
      d.consolidated_products.filter(p => p.sec === 'IPPB').forEach(p => {
        if (p.mode === 'OPENED_AND_CLOSED') {
          html += '<tr><td><strong>' + p.name + '</strong></td><td><span class="badge badge-warning">Account</span></td><td style="text-align:center;">' + p.total_opened + '</td><td style="text-align:center;">' + p.total_closed + '</td><td style="text-align:center; font-weight:700;">' + (p.total_opened - p.total_closed) + '</td></tr>';
        } else {
          html += '<tr><td><strong>' + p.name + '</strong></td><td><span class="badge badge-info">Service</span></td><td style="text-align:center;">--</td><td style="text-align:center;">--</td><td style="text-align:center; font-weight:800; color:var(--blue);">' + p.total_achievement + '</td></tr>';
        }
      });
      sb.innerHTML = html;

      const mb = document.getElementById('matrixBody');
      mb.innerHTML = d.office_matrix.map(r => {
        let so = 0, sc = 0;
        if (r.counts) {
          for (const v of Object.values(r.counts)) { so += (v.opened||0); sc += (v.closed||0); }
        }
        return '<tr><td><strong>' + r.office_name + '</strong></td><td><small>' + r.hpo_group + '</small></td><td style="text-align:center;">' + (r.status === 'SUBMITTED' ? '<span class="badge badge-success">Submitted</span>' : '<span class="badge badge-danger">Pending</span>') + '</td><td style="font-size:0.75rem; color:var(--muted);">' + (r.submitted_at || '--') + '</td><td style="text-align:center; font-weight:600;">' + (r.status === 'SUBMITTED' ? so + ' / ' + sc : '--') + '</td><td style="text-align:center; font-weight:600;">' + (r.status === 'SUBMITTED' ? ((r.counts?.IPPB_REG?.opened||0) + (r.counts?.IPPB_PREM?.opened||0)) + ' / ' + ((r.counts?.IPPB_REG?.closed||0) + (r.counts?.IPPB_PREM?.closed||0)) : '--') + '</td></tr>';
      }).join('');
    }

    async function copyPending() {
      if (!currentData || currentData.pending_offices.length === 0) { alert('All offices submitted!'); return; }
      const dt = document.getElementById('adminDateSelect').value;
      const list = currentData.pending_offices.map((o, i) => (i+1) + '. *' + o.name + '* (' + o.hpo + ')').join('\\n');
      const text = '⚠️ *PENDING DAILY SAVINGS REPORT ALERT*\\nNew Delhi Central Division\\n📅 *Date: ' + dt + '*\\n\\n' + list + '\\n\\nKindly submit immediately.';
      await navigator.clipboard.writeText(text);
      alert('📋 Copied ' + currentData.pending_offices.length + ' pending offices to clipboard!');
    }

    function downloadCSV() {
      const dt = document.getElementById('adminDateSelect').value;
      window.location.href = '/api/export/csv?date=' + dt;
    }
  </script>
</body>
</html>`;
}

function renderReportPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily Performance Report Card</title>
  <style>` + PAGE_CSS + `</style>
</head>
<body>
  <header class="header-bar">
    <div class="brand">
      <div class="brand-icon">WHATSAPP</div>
      <div><div class="brand-title">Daily Performance Report Card</div><div class="brand-sub">WhatsApp Formats</div></div>
    </div>
    <div style="display:flex; gap:10px;">
      <a href="/admin" class="nav-btn">📊 Admin Dashboard</a>
      <a href="/" class="nav-btn">📝 Office Portal</a>
    </div>
  </header>

  <main class="container">
    <div class="card" style="padding:14px 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
      <div style="display:flex; align-items:center; gap:8px;">
        <label style="margin:0; font-weight:700;">Date:</label>
        <input type="date" id="repDate" class="form-control" style="width:auto; padding:5px 10px;" onchange="loadRep()">
      </div>
      <button class="btn btn-primary" onclick="copyWAText()">📋 Copy WhatsApp Text</button>
    </div>

    <div class="card" style="max-width:650px; margin:0 auto;">
      <div class="card-title"><span>💬 Formatted WhatsApp Text</span><button class="btn btn-outline" style="padding:3px 8px; font-size:0.8rem;" onclick="copyWAText()">Copy</button></div>
      <textarea id="waPreview" class="form-control" rows="18" readonly style="font-family:monospace; font-size:0.85rem; background:#F8FAFC;"></textarea>
    </div>
  </main>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('repDate').value = new Date().toISOString().substring(0, 10);
      loadRep();
    });
    async function loadRep() {
      const dt = document.getElementById('repDate').value;
      const res = await fetch('/api/whatsapp-text?date=' + dt);
      const d = await res.json();
      document.getElementById('waPreview').value = d.text;
    }
    async function copyWAText() {
      await navigator.clipboard.writeText(document.getElementById('waPreview').value);
      alert('📋 Formatted WhatsApp text copied to clipboard!');
    }
  </script>
</body>
</html>`;
}
