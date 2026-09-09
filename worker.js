// Cloudflare Worker: India Post New Delhi Central Division Savings Monitor
// Zero-configuration, self-initializing, resilient architecture

const DEFAULT_OFFICES = [
  { "id": 1, "office_name": "AGCR SO", "hpo_group": "Indraprastha HPO", "pin_code": "1101" },
  { "id": 2, "office_name": "Ajmeri Gate Extn SO", "hpo_group": "Indraprastha HPO", "pin_code": "1102" },
  { "id": 3, "office_name": "Anand Parbat Indl Area SO", "hpo_group": "New Delhi HO", "pin_code": "1103" },
  { "id": 4, "office_name": "Anand Parbat SO", "hpo_group": "New Delhi HO", "pin_code": "1104" },
  { "id": 5, "office_name": "Baroda House SO", "hpo_group": "Indraprastha HPO", "pin_code": "1105" },
  { "id": 6, "office_name": "Bengali Market SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1106" },
  { "id": 7, "office_name": "CAT EXTENSION COUNTER", "hpo_group": "Indraprastha HPO", "pin_code": "1108" },
  { "id": 8, "office_name": "Civic Centre PO", "hpo_group": "Indraprastha HPO", "pin_code": "1109" },
  { "id": 9, "office_name": "Connaught Place SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1110" },
  { "id": 10, "office_name": "Dada Ghosh Bhawan SO", "hpo_group": "New Delhi HO", "pin_code": "1111" },
  { "id": 11, "office_name": "Darya Ganj SO", "hpo_group": "Indraprastha HPO", "pin_code": "1112" },
  { "id": 12, "office_name": "Delhi High Court Extension Counter SO", "hpo_group": "Indraprastha HPO", "pin_code": "1113" },
  { "id": 13, "office_name": "Delhi High Court SO", "hpo_group": "Indraprastha HPO", "pin_code": "1114" },
  { "id": 14, "office_name": "Desh Bandhu Gupta Road SO", "hpo_group": "New Delhi HO", "pin_code": "1115" },
  { "id": 15, "office_name": "Election Commission SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1116" },
  { "id": 16, "office_name": "Gandhi Smarak Nidhi SO", "hpo_group": "Indraprastha HPO", "pin_code": "1117" },
  { "id": 17, "office_name": "Guru Gobind Singh Marg SO", "hpo_group": "New Delhi HO", "pin_code": "1118" },
  { "id": 18, "office_name": "IARI SO", "hpo_group": "New Delhi HO", "pin_code": "1119" },
  { "id": 19, "office_name": "Inderpuri SO", "hpo_group": "New Delhi HO", "pin_code": "1122" },
  { "id": 20, "office_name": "Indraprastha HO", "hpo_group": "Indraprastha HPO", "pin_code": "1124" },
  { "id": 21, "office_name": "IPEstate SO", "hpo_group": "Indraprastha HPO", "pin_code": "1125" },
  { "id": 22, "office_name": "Jama Masjid SO", "hpo_group": "Indraprastha HPO", "pin_code": "1126" },
  { "id": 23, "office_name": "Karol Bagh SO", "hpo_group": "New Delhi HO", "pin_code": "1127" },
  { "id": 24, "office_name": "Krishi Bhawan SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1128" },
  { "id": 25, "office_name": "Lady Harding Medical College SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1129" },
  { "id": 26, "office_name": "Minto Road SO", "hpo_group": "Indraprastha HPO", "pin_code": "1130" },
  { "id": 27, "office_name": "Multani Dhanda SO", "hpo_group": "New Delhi HO", "pin_code": "1131" },
  { "id": 28, "office_name": "National Physical Laboratory SO", "hpo_group": "New Delhi HO", "pin_code": "1132" },
  { "id": 29, "office_name": "NGT EXTENSION COUNTER", "hpo_group": "Indraprastha HPO", "pin_code": "1134" },
  { "id": 30, "office_name": "Nirman Bhawan SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1135" },
  { "id": 31, "office_name": "North Avenue SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1136" },
  { "id": 32, "office_name": "Pahar Ganj SO", "hpo_group": "New Delhi HO", "pin_code": "1137" },
  { "id": 33, "office_name": "Pandara Road SO", "hpo_group": "Indraprastha HPO", "pin_code": "1138" },
  { "id": 34, "office_name": "Parliament House SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1139" },
  { "id": 35, "office_name": "Patel Nagar East SO", "hpo_group": "New Delhi HO", "pin_code": "1140" },
  { "id": 36, "office_name": "Patel Nagar SO Central Delhi", "hpo_group": "New Delhi HO", "pin_code": "1141" },
  { "id": 37, "office_name": "Patel Nagar South SO", "hpo_group": "New Delhi HO", "pin_code": "1142" },
  { "id": 38, "office_name": "Patel Nagar West SO", "hpo_group": "New Delhi HO", "pin_code": "1143" },
  { "id": 39, "office_name": "Patiala House SO", "hpo_group": "Indraprastha HPO", "pin_code": "1144" },
  { "id": 40, "office_name": "Pragati Maidan SO", "hpo_group": "Indraprastha HPO", "pin_code": "1145" },
  { "id": 41, "office_name": "Rail Bhawan SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1146" },
  { "id": 42, "office_name": "Rajender Nagar SO", "hpo_group": "New Delhi HO", "pin_code": "1147" },
  { "id": 43, "office_name": "Rashtrapati Bhawan SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1149" },
  { "id": 44, "office_name": "Rouse Avenue Extension Counter SO", "hpo_group": "Indraprastha HPO", "pin_code": "1150" },
  { "id": 45, "office_name": "Sansad Marg HO", "hpo_group": "Sansad Marg HPO", "pin_code": "1151" },
  { "id": 46, "office_name": "Sansadiya Soudh SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1152" },
  { "id": 47, "office_name": "Sat Nagar SO", "hpo_group": "New Delhi HO", "pin_code": "1153" },
  { "id": 48, "office_name": "Secretariat North SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1154" },
  { "id": 49, "office_name": "Shastri Bhawan SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1155" },
  { "id": 50, "office_name": "South Avenue SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1156" },
  { "id": 51, "office_name": "SRT NAGAR EXTENSION COUNTER", "hpo_group": "New Delhi HO", "pin_code": "1157" },
  { "id": 52, "office_name": "Supreme Court SO", "hpo_group": "Indraprastha HPO", "pin_code": "1158" },
  { "id": 53, "office_name": "Swami Ram Tirth Nagar SO", "hpo_group": "New Delhi HO", "pin_code": "1159" },
  { "id": 54, "office_name": "Udyog Bhawan SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1160" },
  { "id": 55, "office_name": "Union Public Service Commission SO", "hpo_group": "Sansad Marg HPO", "pin_code": "1162" }
];

const DEFAULT_PRODUCTS = [
  { "id": 1, "code": "SB", "name": "Savings Bank Account (SB)", "short_name": "SB", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 1 },
  { "id": 2, "code": "RD", "name": "Recurring Deposit (RD)", "short_name": "RD", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 2 },
  { "id": 3, "code": "TD", "name": "Time Deposit (TD)", "short_name": "TD", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 3 },
  { "id": 4, "code": "MIS", "name": "Monthly Income Scheme (MIS)", "short_name": "MIS", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 4 },
  { "id": 5, "code": "PPF", "name": "Public Provident Fund (PPF)", "short_name": "PPF", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 5 },
  { "id": 6, "code": "NSC", "name": "National Savings Certificate (NSC)", "short_name": "NSC", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 6 },
  { "id": 7, "code": "KVP", "name": "Kisan Vikas Patra (KVP)", "short_name": "KVP", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 7 },
  { "id": 8, "code": "SCSS", "name": "Senior Citizens Savings Scheme (SCSS)", "short_name": "SCSS", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 8 },
  { "id": 9, "code": "SSA", "name": "Sukanya Samriddhi Account (SSA)", "short_name": "SSA", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 9 },
  { "id": 10, "code": "NSC_VIII", "name": "NSC VIII Issue (Discontinued)", "short_name": "NSC VIII", "section": "SAVINGS", "entry_mode": "CLOSED_ONLY", "display_order": 10 },
  { "id": 11, "code": "IVP", "name": "Indira Vikas Patra (IVP)", "short_name": "IVP", "section": "SAVINGS", "entry_mode": "CLOSED_ONLY", "display_order": 11 },
  { "id": 12, "code": "IPPB_REG", "name": "IPPB Regular Savings Account", "short_name": "Regular A/C", "section": "IPPB", "entry_mode": "OPENED_AND_CLOSED", "display_order": 12 },
  { "id": 13, "code": "IPPB_PREM", "name": "IPPB Premium Savings Account", "short_name": "Premium A/C", "section": "IPPB", "entry_mode": "OPENED_AND_CLOSED", "display_order": 13 },
  { "id": 14, "code": "IPPB_UPGRADE", "name": "Account Upgradation", "short_name": "A/C Upgrade", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 14 },
  { "id": 15, "code": "IPPB_AADHAAR", "name": "Aadhaar Seeding", "short_name": "Aadhaar Seed", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 15 },
  { "id": 16, "code": "IPPB_CELC", "name": "CELC (Child Enrolment Lite Client)", "short_name": "CELC", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 16 },
  { "id": 17, "code": "IPPB_LINKING", "name": "POSB–IPPB Linking", "short_name": "POSB-IPPB Link", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 17 },
  { "id": 18, "code": "IPPB_LI", "name": "Life Insurance (LI)", "short_name": "Life Ins.", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 18 },
  { "id": 19, "code": "IPPB_GI", "name": "General Insurance (GI)", "short_name": "Gen. Ins.", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 19 },
  { "id": 20, "code": "IPPB_PAI", "name": "Personal Accident Insurance (PAI)", "short_name": "PAI", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 20 },
  { "id": 21, "code": "IPPB_HI", "name": "Health Insurance (HI)", "short_name": "Health Ins.", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 21 }
];

async function ensureTables(env) {
  if (!env.DB) return;
  try {
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS daily_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        office_id INTEGER NOT NULL,
        office_name TEXT NOT NULL,
        hpo_group TEXT NOT NULL,
        report_date TEXT NOT NULL,
        submitted_by TEXT,
        submitted_at TEXT,
        updated_at TEXT,
        is_modified_by_admin INTEGER NOT NULL DEFAULT 0,
        admin_notes TEXT,
        UNIQUE(office_id, report_date)
      );
      CREATE TABLE IF NOT EXISTS submission_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        product_code TEXT NOT NULL,
        opened_count INTEGER NOT NULL DEFAULT 0,
        closed_count INTEGER NOT NULL DEFAULT 0,
        achievement_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(submission_id) REFERENCES daily_submissions(id) ON DELETE CASCADE,
        UNIQUE(submission_id, product_code)
      );
    `);
  } catch (e) {
    console.error("Table initialization error:", e);
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

    const html = (content, status = 200) =>
      new Response(content, {
        status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });

    if (pathname.startsWith("/api/")) {
      await ensureTables(env);
    }

    if (pathname === "/api/offices") return json({ offices: DEFAULT_OFFICES });
    if (pathname === "/api/products") return json({ products: DEFAULT_PRODUCTS });

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

    if (pathname === "/api/submit" && request.method === "POST") {
      try {
        const body = await request.json();
        const { office_id, pin, report_date, submitted_by, items, is_admin, admin_notes } = body;

        if (!office_id || !report_date) return json({ detail: "Office and Date required" }, 400);

        const targetOffice = DEFAULT_OFFICES.find((o) => o.id === parseInt(office_id, 10));
        if (!targetOffice) return json({ detail: "Invalid office selected" }, 400);

        if (!is_admin) {
          if (String(targetOffice.pin_code).trim() !== String(pin).trim()) {
            return json({ detail: "Invalid 4-digit Office Verification PIN for " + targetOffice.office_name }, 403);
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
            "INSERT INTO daily_submissions (office_id, office_name, hpo_group, report_date, submitted_by, submitted_at, updated_at, is_modified_by_admin, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
          ).bind(office_id, targetOffice.office_name, targetOffice.hpo_group, report_date, submitted_by || "Staff", now, now, is_admin ? 1 : 0, admin_notes || null).run();
          subId = res.meta.last_row_id;
        }

        for (const p of DEFAULT_PRODUCTS) {
          const pData = (items && items[p.code]) || {};
          let opened = parseInt(pData.opened || 0);
          let closed = parseInt(pData.closed || 0);
          let achieve = parseInt(pData.achievement || 0);

          if (p.entry_mode === "CLOSED_ONLY") { opened = 0; achieve = 0; }
          if (p.entry_mode === "OPENED_ONLY") { closed = 0; achieve = 0; }
          if (p.entry_mode === "ACHIEVEMENT_COUNT") { opened = 0; closed = 0; }
          if (p.entry_mode === "OPENED_AND_CLOSED") { achieve = 0; }

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

    if (pathname === "/api/dashboard") {
      try {
        const date = searchParams.get("date") || new Date().toISOString().substring(0, 10);
        const submissions = await env.DB.prepare(
          "SELECT * FROM daily_submissions WHERE report_date = ?"
        ).bind(date).all();

        const submittedIds = new Set(submissions.results.map((s) => s.office_id));
        const pendingOffices = DEFAULT_OFFICES.filter((o) => !submittedIds.has(o.id));

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
        const consolidated = DEFAULT_PRODUCTS.map((p) => {
          const it = itemsMap[p.code] || { total_opened: 0, total_closed: 0, total_achievement: 0 };
          const row = {
            ...p,
            total_opened: it.total_opened || 0,
            total_closed: it.total_closed || 0,
            total_achievement: it.total_achievement || 0
          };
          if (p.section === "SAVINGS") {
            totalSavingsO += row.total_opened;
            totalSavingsC += row.total_closed;
          } else if (p.section === "IPPB") {
            if (p.entry_mode === "OPENED_AND_CLOSED") {
              totalIppbO += row.total_opened;
              totalIppbC += row.total_closed;
            } else {
              totalIppbAch += row.total_achievement;
            }
          }
          return row;
        });

        const matrix = [];
        for (const off of DEFAULT_OFFICES) {
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
            total_offices: DEFAULT_OFFICES.length,
            submitted_count: submissions.results.length,
            pending_count: pendingOffices.length,
            completion_pct: Math.round((submissions.results.length / DEFAULT_OFFICES.length) * 1000) / 10,
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

    if (pathname === "/api/export/csv") {
      const date = searchParams.get("date") || new Date().toISOString().substring(0, 10);
      const dashReq = new Request(`${url.origin}/api/dashboard?date=${date}`);
      const dashRes = await this.fetch(dashReq, env, ctx);
      const dash = await dashRes.json();

      const headers = ["Office Name", "HPO Group", "Status", "Submitted By", "Submission Time", "Last Updated"];
      for (const p of DEFAULT_PRODUCTS) {
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
        for (const p of DEFAULT_PRODUCTS) {
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
.alert { padding: 14px 18px; border-radius: 8px; }
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
              <option value="">-- Choose Post Office (55 Operational) --</option>
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
            <input type="date"
