# Daily Savings Performance Reporting & Monitoring System
### Department of Posts – India Post | New Delhi Central Division

A lightweight, reliable, web-based daily savings and IPPB performance monitoring system designed for the **Administrative Office of New Delhi Central Division, Department of Posts**.

---

## 📌 Problem Solved
Official MIS Portal figures in the Department of Posts are only available on the following day ($T+1$). Previously, Divisional Administrators had to manually phone or message 55 operational offices every evening, collect figures across 16–17 Savings & IPPB products, manually identify non-reporting offices, compile Excel sheets, and prepare WhatsApp screenshots. 

This system automates that entire loop:
$$\text{Permanent URL} \longrightarrow \text{55 Offices Submit in 60s} \longrightarrow \text{Live Division Consolidation} \longrightarrow \text{1-Click WhatsApp PNG / Text}$$

---

## 🏛️ Divisional Structure & Office Map
- **Total Post Offices in Division:** 62
- **Operational Public-Facing Offices:** **55 Offices**
- **Internal / Sorting / Delivery Hubs:** 7 Units (BPC IPHO, IDC Patel Nagar, IDC SRT Nagar, Indraprastha DC, NDC NDHO, Rashtrapati Bhawan DC, UPSC DC)
- **Head Post Office (HPO) Groups:**
  1. **Indraprastha HPO**
  2. **Sansad Marg HPO**
  3. **New Delhi HO**

---

## 💼 Product Architecture & Taxonomy
Configurable across two main departmental operational sections:

### Section 1: Savings Bank (POSB)
1. **Active Savings Schemes (Opened & Closed):**
   - Savings Bank Account (`SB`)
   - Recurring Deposit (`RD`)
   - Time Deposit (`TD`)
   - Monthly Income Scheme (`MIS`)
   - Public Provident Fund (`PPF`)
   - National Savings Certificate (`NSC`)
   - Kisan Vikas Patra (`KVP`)
   - Senior Citizens Savings Scheme (`SCSS`)
   - Sukanya Samriddhi Account (`SSA`)
2. **Discontinued Savings Schemes (Closing Only):**
   - `NSC VIII Issue` (Discontinued)
   - `Indira Vikas Patra (IVP)` (Discontinued)

### Section 2: IPPB (India Post Payments Bank)
1. **IPPB Accounts (Opened & Closed):**
   - Regular Savings Account (`IPPB_REG`)
   - Premium Savings Account (`IPPB_PREM`)
2. **IPPB Business Activities / Services (Daily Achievement Count):**
   - Account Upgradation
   - Aadhaar Seeding
   - CELC (Child Enrolment Lite Client)
   - POSB–IPPB Linking
   - Life Insurance (LI)
   - General Insurance (GI)
   - Personal Accident Insurance (PAI)
   - Health Insurance (HI)

---

## 🚀 Key Features

1. **Permanent Single Link for 55 Offices (`/`):**
   - Extremely lightweight, responsive mobile and desktop layout.
   - Clean office dropdown with 4-digit verification PIN to prevent accidental cross-office entry.
   - Remembers PIN locally (`localStorage`) on office devices.
   - Intelligent zero handling: numerical inputs default to `0`. If a user attempts to submit an all-zero report, a confirmation modal verifies that the office actually had zero performance.
   - Existing submission detection: warns staff when an entry already exists for the day, pre-fills previous figures, and enables **Correction/Update Mode**.

2. **Executive Admin Dashboard (`/admin`):**
   - Real-time KPI cards: Total Offices (55), Submitted (XX), Pending (XX), Completion Rate (XX%).
   - Division Reporting Progress bar.
   - **"Copy Pending Offices for WhatsApp"** button: Formats an alert list of non-reporting offices into clipboard with one click for WhatsApp group follow-up.
   - Consolidated summary table showing scheme-wise Opened, Closed, and Net counts, plus section totals.
   - Full matrix table (Office × Products) with live keyword search, HPO filter, and Submitted/Pending status filter.
   - Admin override / correction modal: allows Divisional Office to review and correct any office submission with an audit note.
   - Historical date picker: view performance reports for any previous date.
   - 1-click **Export to CSV**.

3. **WhatsApp-Ready Report Card (`/report`):**
   - Designed specifically to match India Post corporate branding (Postal Red, Post Office Gold, Slate, Crisp White).
   - Shows Division title, date, reporting status ($XX/55$, pending count, completion %).
   - Side-by-side Savings table and IPPB account/activity breakdown.
   - **"Download as PNG Image"**: Uses HTML5 Canvas to generate a 2x retina high-resolution graphic directly in the browser—no manual screenshots needed!
   - **"Copy Formatted WhatsApp Text"**: Copies clean monospace/bolded ASCII table and bullet points ready to paste directly into the WhatsApp group.

---

## 🛠️ Quickstart (Running Locally)

```bash
# 1. Clone repository or navigate to directory
cd postal_savings_monitor

# 2. Initialize database
python3 init_db.py

# 3. Start the application
python3 app.py
# Server runs at: http://localhost:8000
```

### URLs:
- **Office Entry Portal:** `http://localhost:8000/`
- **Admin Dashboard:** `http://localhost:8000/admin`
- **WhatsApp Report Card:** `http://localhost:8000/report`

---

## 🧪 Running Automated Test Suite
```bash
python3 test_system.py
```
Validates:
- All 55 operational offices seeded with HPO groupings.
- PIN authentication and negative value rejection.
- Single office submission and pending office metric calculation.
- Duplicate submission update flow (correction without duplicate rows).
- All 55 offices submitting (100% completion verification).
- Historical date segregation.
- Dynamic product addition.
