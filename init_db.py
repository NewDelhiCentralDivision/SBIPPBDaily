import sqlite3
import json
import os

DB_PATH = os.environ.get('DB_PATH', '/home/spark/savings_monitor.db')

OFFICE_DATA = [
  {"name": "AGCR SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1101"},
  {"name": "Ajmeri Gate Extn SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1102"},
  {"name": "Anand Parbat Indl Area SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1103"},
  {"name": "Anand Parbat SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1104"},
  {"name": "Baroda House SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1105"},
  {"name": "Bengali Market SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1106"},
  {"name": "BPC IPHO", "hpo": "Indraprastha HPO", "is_operational": 0, "pin": "1107"},
  {"name": "CAT EXTENSION COUNTER", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1108"},
  {"name": "Civic Centre PO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1109"},
  {"name": "Connaught Place SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1110"},
  {"name": "Dada Ghosh Bhawan SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1111"},
  {"name": "Darya Ganj SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1112"},
  {"name": "Delhi High Court Extension Counter SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1113"},
  {"name": "Delhi High Court SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1114"},
  {"name": "Desh Bandhu Gupta Road SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1115"},
  {"name": "Election Commission SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1116"},
  {"name": "Gandhi Smarak Nidhi SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1117"},
  {"name": "Guru Gobind Singh Marg SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1118"},
  {"name": "IARI SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1119"},
  {"name": "IDC Patel Nagar", "hpo": "New Delhi HO", "is_operational": 0, "pin": "1120"},
  {"name": "IDC SRT NAGAR PO", "hpo": "New Delhi HO", "is_operational": 0, "pin": "1121"},
  {"name": "Inderpuri SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1122"},
  {"name": "Indraprastha DC", "hpo": "Indraprastha HPO", "is_operational": 0, "pin": "1123"},
  {"name": "Indraprastha HO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1124"},
  {"name": "IPEstate SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1125"},
  {"name": "Jama Masjid SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1126"},
  {"name": "Karol Bagh SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1127"},
  {"name": "Krishi Bhawan SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1128"},
  {"name": "Lady Harding Medical College SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1129"},
  {"name": "Minto Road SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1130"},
  {"name": "Multani Dhanda SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1131"},
  {"name": "National Physical Laboratory SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1132"},
  {"name": "NDC NDHO", "hpo": "New Delhi HO", "is_operational": 0, "pin": "1133"},
  {"name": "NGT EXTENSION COUNTER", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1134"},
  {"name": "Nirman Bhawan SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1135"},
  {"name": "North Avenue SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1136"},
  {"name": "Pahar Ganj SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1137"},
  {"name": "Pandara Road SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1138"},
  {"name": "Parliament House SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1139"},
  {"name": "Patel Nagar East SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1140"},
  {"name": "Patel Nagar SO Central Delhi", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1141"},
  {"name": "Patel Nagar South SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1142"},
  {"name": "Patel Nagar West SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1143"},
  {"name": "Patiala House SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1144"},
  {"name": "Pragati Maidan SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1145"},
  {"name": "Rail Bhawan SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1146"},
  {"name": "Rajender Nagar SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1147"},
  {"name": "Rashtrapati Bhawan DC", "hpo": "Sansad Marg HPO", "is_operational": 0, "pin": "1148"},
  {"name": "Rashtrapati Bhawan SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1149"},
  {"name": "Rouse Avenue Extension Counter SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1150"},
  {"name": "Sansad Marg HO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1151"},
  {"name": "Sansadiya Soudh SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1152"},
  {"name": "Sat Nagar SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1153"},
  {"name": "Secretariat North SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1154"},
  {"name": "Shastri Bhawan SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1155"},
  {"name": "South Avenue SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1156"},
  {"name": "SRT NAGAR EXTENSION COUNTER", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1157"},
  {"name": "Supreme Court SO", "hpo": "Indraprastha HPO", "is_operational": 1, "pin": "1158"},
  {"name": "Swami Ram Tirth Nagar SO", "hpo": "New Delhi HO", "is_operational": 1, "pin": "1159"},
  {"name": "Udyog Bhawan SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1160"},
  {"name": "Union Public Service Commission DC", "hpo": "Sansad Marg HPO", "is_operational": 0, "pin": "1161"},
  {"name": "Union Public Service Commission SO", "hpo": "Sansad Marg HPO", "is_operational": 1, "pin": "1162"}
]

DEFAULT_PRODUCTS = [
    # Section 1: Savings / POSB - Active (Opened + Closed)
    {"code": "SB", "name": "Savings Bank Account (SB)", "short_name": "SB", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 1},
    {"code": "RD", "name": "Recurring Deposit (RD)", "short_name": "RD", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 2},
    {"code": "TD", "name": "Time Deposit (TD)", "short_name": "TD", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 3},
    {"code": "MIS", "name": "Monthly Income Scheme (MIS)", "short_name": "MIS", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 4},
    {"code": "PPF", "name": "Public Provident Fund (PPF)", "short_name": "PPF", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 5},
    {"code": "NSC", "name": "National Savings Certificate (NSC)", "short_name": "NSC", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 6},
    {"code": "KVP", "name": "Kisan Vikas Patra (KVP)", "short_name": "KVP", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 7},
    {"code": "SCSS", "name": "Senior Citizens Savings Scheme (SCSS)", "short_name": "SCSS", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 8},
    {"code": "SSA", "name": "Sukanya Samriddhi Account (SSA)", "short_name": "SSA", "section": "SAVINGS", "entry_mode": "OPENED_AND_CLOSED", "display_order": 9},

    # Section 1: Savings / POSB - Discontinued (Closed only)
    {"code": "NSC_VIII", "name": "NSC VIII Issue (Discontinued)", "short_name": "NSC VIII", "section": "SAVINGS", "entry_mode": "CLOSED_ONLY", "display_order": 10},
    {"code": "IVP", "name": "Indira Vikas Patra (IVP)", "short_name": "IVP", "section": "SAVINGS", "entry_mode": "CLOSED_ONLY", "display_order": 11},

    # Section 2: IPPB - Accounts (Opened + Closed)
    {"code": "IPPB_REG", "name": "IPPB Regular Savings Account", "short_name": "Regular A/C", "section": "IPPB", "entry_mode": "OPENED_AND_CLOSED", "display_order": 12},
    {"code": "IPPB_PREM", "name": "IPPB Premium Savings Account", "short_name": "Premium A/C", "section": "IPPB", "entry_mode": "OPENED_AND_CLOSED", "display_order": 13},

    # Section 2: IPPB - Services/Activities (Achievement count only)
    {"code": "IPPB_UPGRADE", "name": "Account Upgradation", "short_name": "A/C Upgrade", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 14},
    {"code": "IPPB_AADHAAR", "name": "Aadhaar Seeding", "short_name": "Aadhaar Seed", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 15},
    {"code": "IPPB_CELC", "name": "CELC (Child Enrolment Lite Client)", "short_name": "CELC", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 16},
    {"code": "IPPB_LINKING", "name": "POSB–IPPB Linking", "short_name": "POSB-IPPB Link", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 17},
    {"code": "IPPB_LI", "name": "Life Insurance (LI)", "short_name": "Life Ins.", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 18},
    {"code": "IPPB_GI", "name": "General Insurance (GI)", "short_name": "Gen. Ins.", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 19},
    {"code": "IPPB_PAI", "name": "Personal Accident Insurance (PAI)", "short_name": "PAI", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 20},
    {"code": "IPPB_HI", "name": "Health Insurance (HI)", "short_name": "Health Ins.", "section": "IPPB", "entry_mode": "ACHIEVEMENT_COUNT", "display_order": 21}
]

def init_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS offices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        office_name TEXT UNIQUE NOT NULL,
        hpo_group TEXT NOT NULL,
        pin_code TEXT NOT NULL,
        is_operational INTEGER NOT NULL DEFAULT 1,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        short_name TEXT NOT NULL,
        section TEXT NOT NULL,
        entry_mode TEXT NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        office_id INTEGER NOT NULL,
        report_date TEXT NOT NULL,
        submitted_by TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_modified_by_admin INTEGER NOT NULL DEFAULT 0,
        admin_notes TEXT,
        FOREIGN KEY(office_id) REFERENCES offices(id),
        UNIQUE(office_id, report_date)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submission_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        opened_count INTEGER NOT NULL DEFAULT 0,
        closed_count INTEGER NOT NULL DEFAULT 0,
        achievement_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(submission_id) REFERENCES daily_submissions(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id),
        UNIQUE(submission_id, product_id)
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        submission_id INTEGER,
        office_name TEXT,
        report_date TEXT,
        action TEXT NOT NULL,
        performed_by TEXT NOT NULL,
        payload_json TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Populate offices
    for o in OFFICE_DATA:
        cursor.execute("""
        INSERT OR IGNORE INTO offices (office_name, hpo_group, pin_code, is_operational, is_active)
        VALUES (?, ?, ?, ?, 1)
        """, (o["name"], o["hpo"], o["pin"], o["is_operational"]))

    # Populate products
    for p in DEFAULT_PRODUCTS:
        cursor.execute("""
        INSERT OR IGNORE INTO products (code, name, short_name, section, entry_mode, display_order, is_active)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        """, (p["code"], p["name"], p["short_name"], p["section"], p["entry_mode"], p["display_order"]))

    conn.commit()
    conn.close()
    print("Database successfully initialized at:", DB_PATH)

if __name__ == "__main__":
    init_database()
