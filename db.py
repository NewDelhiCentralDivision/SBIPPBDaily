import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.environ.get('DB_PATH', '/home/spark/savings_monitor.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_operational_offices():
    conn = get_db_connection()
    offices = conn.execute("""
        SELECT id, office_name, hpo_group, pin_code, is_operational, is_active
        FROM offices
        WHERE is_active = 1 AND is_operational = 1
        ORDER BY office_name ASC
    """).fetchall()
    conn.close()
    return [dict(o) for o in offices]

def get_all_offices():
    conn = get_db_connection()
    offices = conn.execute("""
        SELECT id, office_name, hpo_group, pin_code, is_operational, is_active
        FROM offices
        ORDER BY office_name ASC
    """).fetchall()
    conn.close()
    return [dict(o) for o in offices]

def verify_office_pin(office_id: int, pin: str):
    conn = get_db_connection()
    row = conn.execute("SELECT id, office_name, pin_code FROM offices WHERE id = ? AND is_active = 1", (office_id,)).fetchone()
    conn.close()
    if not row:
        return False, "Office not found or inactive"
    if row['pin_code'] == pin.strip():
        return True, row['office_name']
    return False, "Invalid Verification PIN for this office"

def get_active_products():
    conn = get_db_connection()
    products = conn.execute("""
        SELECT id, code, name, short_name, section, entry_mode, display_order, is_active
        FROM products
        WHERE is_active = 1
        ORDER BY display_order ASC, id ASC
    """).fetchall()
    conn.close()
    return [dict(p) for p in products]

def get_all_products():
    conn = get_db_connection()
    products = conn.execute("""
        SELECT id, code, name, short_name, section, entry_mode, display_order, is_active
        FROM products
        ORDER BY display_order ASC, id ASC
    """).fetchall()
    conn.close()
    return [dict(p) for p in products]

def get_office_submission(office_id: int, report_date: str):
    conn = get_db_connection()
    sub = conn.execute("""
        SELECT s.id, s.office_id, s.report_date, s.submitted_by, s.submitted_at, s.updated_at, s.is_modified_by_admin, s.admin_notes,
               o.office_name, o.hpo_group
        FROM daily_submissions s
        JOIN offices o ON s.office_id = o.id
        WHERE s.office_id = ? AND s.report_date = ?
    """, (office_id, report_date)).fetchone()
    
    if not sub:
        conn.close()
        return None
        
    sub_dict = dict(sub)
    items = conn.execute("""
        SELECT si.product_id, p.code, p.name, p.short_name, p.section, p.entry_mode,
               si.opened_count, si.closed_count, si.achievement_count
        FROM submission_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.submission_id = ?
    """, (sub_dict['id'],)).fetchall()
    conn.close()
    
    sub_dict['items'] = {item['code']: dict(item) for item in items}
    return sub_dict

def save_submission(office_id: int, report_date: str, submitted_by: str, items_data: dict, is_admin: bool = False, admin_notes: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    existing = cursor.execute("""
        SELECT id FROM daily_submissions WHERE office_id = ? AND report_date = ?
    """, (office_id, report_date)).fetchone()
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if existing:
        sub_id = existing['id']
        cursor.execute("""
            UPDATE daily_submissions 
            SET submitted_by = ?, updated_at = ?, is_modified_by_admin = ?, admin_notes = ?
            WHERE id = ?
        """, (submitted_by, now_str, 1 if is_admin else 0, admin_notes, sub_id))
        action = "ADMIN_EDIT" if is_admin else "UPDATE"
    else:
        cursor.execute("""
            INSERT INTO daily_submissions (office_id, report_date, submitted_by, submitted_at, updated_at, is_modified_by_admin, admin_notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (office_id, report_date, submitted_by, now_str, now_str, 1 if is_admin else 0, admin_notes))
        sub_id = cursor.lastrowid
        action = "SUBMIT"
        
    products = cursor.execute("SELECT id, code, entry_mode FROM products WHERE is_active = 1").fetchall()
    
    for p in products:
        p_id = p['id']
        p_code = p['code']
        p_mode = p['entry_mode']
        
        p_data = items_data.get(p_code, {})
        opened = int(p_data.get('opened', 0) or 0)
        closed = int(p_data.get('closed', 0) or 0)
        achieve = int(p_data.get('achievement', 0) or 0)
        
        if p_mode == 'OPENED_ONLY':
            closed = 0
            achieve = 0
        elif p_mode == 'CLOSED_ONLY':
            opened = 0
            achieve = 0
        elif p_mode == 'ACHIEVEMENT_COUNT':
            opened = 0
            closed = 0
        elif p_mode == 'OPENED_AND_CLOSED':
            achieve = 0
            
        cursor.execute("""
            INSERT INTO submission_items (submission_id, product_id, opened_count, closed_count, achievement_count)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(submission_id, product_id) DO UPDATE SET
                opened_count = excluded.opened_count,
                closed_count = excluded.closed_count,
                achievement_count = excluded.achievement_count
        """, (sub_id, p_id, opened, closed, achieve))
        
    off_name = cursor.execute("SELECT office_name FROM offices WHERE id = ?", (office_id,)).fetchone()['office_name']
    
    cursor.execute("""
        INSERT INTO audit_logs (submission_id, office_name, report_date, action, performed_by, payload_json)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (sub_id, off_name, report_date, action, "ADMIN" if is_admin else "OFFICE", json.dumps(items_data)))
    
    conn.commit()
    conn.close()
    return {"status": "success", "submission_id": sub_id, "action": action}

def get_daily_dashboard(report_date: str):
    conn = get_db_connection()
    operational_offices = conn.execute("""
        SELECT id, office_name, hpo_group, pin_code 
        FROM offices 
        WHERE is_active = 1 AND is_operational = 1 
        ORDER BY office_name ASC
    """).fetchall()
    
    total_offices = len(operational_offices)
    
    submissions = conn.execute("""
        SELECT s.id, s.office_id, s.report_date, s.submitted_by, s.submitted_at, s.updated_at, s.is_modified_by_admin,
               o.office_name, o.hpo_group
        FROM daily_submissions s
        JOIN offices o ON s.office_id = o.id
        WHERE s.report_date = ? AND o.is_operational = 1 AND o.is_active = 1
        ORDER BY s.updated_at DESC
    """, (report_date,)).fetchall()
    
    submitted_office_ids = {s['office_id'] for s in submissions}
    submitted_count = len(submitted_office_ids)
    pending_count = total_offices - submitted_count
    completion_pct = round((submitted_count / total_offices * 100), 1) if total_offices > 0 else 0.0
    
    pending_offices = [dict(o) for o in operational_offices if o['id'] not in submitted_office_ids]
    
    products = conn.execute("""
        SELECT id, code, name, short_name, section, entry_mode, display_order
        FROM products
        WHERE is_active = 1
        ORDER BY display_order ASC, id ASC
    """).fetchall()
    products_list = [dict(p) for p in products]
    
    totals_query = conn.execute("""
        SELECT p.code, p.name, p.short_name, p.section, p.entry_mode,
               SUM(si.opened_count) as total_opened,
               SUM(si.closed_count) as total_closed,
               SUM(si.achievement_count) as total_achievement
        FROM submission_items si
        JOIN daily_submissions s ON si.submission_id = s.id
        JOIN products p ON si.product_id = p.id
        JOIN offices o ON s.office_id = o.id
        WHERE s.report_date = ? AND o.is_operational = 1 AND o.is_active = 1 AND p.is_active = 1
        GROUP BY p.id
        ORDER BY p.display_order ASC
    """, (report_date,)).fetchall()
    
    totals_map = {t['code']: dict(t) for t in totals_query}
    
    consolidated_products = []
    total_savings_opened = 0
    total_savings_closed = 0
    total_ippb_opened = 0
    total_ippb_closed = 0
    total_ippb_achievements = 0
    
    for p in products_list:
        code = p['code']
        item_total = totals_map.get(code, {
            "code": code,
            "name": p['name'],
            "short_name": p['short_name'],
            "section": p['section'],
            "entry_mode": p['entry_mode'],
            "total_opened": 0,
            "total_closed": 0,
            "total_achievement": 0
        })
        item_total['total_opened'] = item_total.get('total_opened') or 0
        item_total['total_closed'] = item_total.get('total_closed') or 0
        item_total['total_achievement'] = item_total.get('total_achievement') or 0
        
        if p['section'] == 'SAVINGS':
            total_savings_opened += item_total['total_opened']
            total_savings_closed += item_total['total_closed']
        elif p['section'] == 'IPPB':
            if p['entry_mode'] == 'OPENED_AND_CLOSED':
                total_ippb_opened += item_total['total_opened']
                total_ippb_closed += item_total['total_closed']
            elif p['entry_mode'] == 'ACHIEVEMENT_COUNT':
                total_ippb_achievements += item_total['total_achievement']
                
        consolidated_products.append(item_total)
        
    office_matrix = []
    for o in operational_offices:
        sub = next((s for s in submissions if s['office_id'] == o['id']), None)
        row = {
            "office_id": o['id'],
            "office_name": o['office_name'],
            "hpo_group": o['hpo_group'],
            "status": "SUBMITTED" if sub else "PENDING",
            "submission_id": sub['id'] if sub else None,
            "submitted_at": sub['submitted_at'] if sub else None,
            "updated_at": sub['updated_at'] if sub else None,
            "is_modified_by_admin": bool(sub['is_modified_by_admin']) if sub else False,
            "submitted_by": sub['submitted_by'] if sub else "",
            "counts": {}
        }
        if sub:
            sub_items = conn.execute("""
                SELECT p.code, si.opened_count, si.closed_count, si.achievement_count
                FROM submission_items si
                JOIN products p ON si.product_id = p.id
                WHERE si.submission_id = ?
            """, (sub['id'],)).fetchall()
            for si in sub_items:
                row["counts"][si['code']] = {
                    "opened": si['opened_count'],
                    "closed": si['closed_count'],
                    "achievement": si['achievement_count']
                }
        office_matrix.append(row)
        
    conn.close()
    
    return {
        "report_date": report_date,
        "metrics": {
            "total_offices": total_offices,
            "submitted_count": submitted_count,
            "pending_count": pending_count,
            "completion_pct": completion_pct,
            "total_savings_opened": total_savings_opened,
            "total_savings_closed": total_savings_closed,
            "total_ippb_opened": total_ippb_opened,
            "total_ippb_closed": total_ippb_closed,
            "total_ippb_achievements": total_ippb_achievements
        },
        "consolidated_products": consolidated_products,
        "submitted_offices": [dict(s) for s in submissions],
        "pending_offices": pending_offices,
        "office_matrix": office_matrix,
        "products": products_list
    }

def update_product_config(prod_id: int, name: str, short_name: str, section: str, entry_mode: str, display_order: int, is_active: int):
    conn = get_db_connection()
    conn.execute("""
        UPDATE products
        SET name = ?, short_name = ?, section = ?, entry_mode = ?, display_order = ?, is_active = ?
        WHERE id = ?
    """, (name, short_name, section, entry_mode, display_order, is_active, prod_id))
    conn.commit()
    conn.close()
    return {"status": "success"}

def add_product_config(code: str, name: str, short_name: str, section: str, entry_mode: str, display_order: int):
    conn = get_db_connection()
    try:
        conn.execute("""
            INSERT INTO products (code, name, short_name, section, entry_mode, display_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        """, (code.strip().upper(), name.strip(), short_name.strip(), section.strip().upper(), entry_mode.strip(), display_order))
        conn.commit()
        res = {"status": "success"}
    except sqlite3.IntegrityError:
        res = {"status": "error", "message": "Product code already exists"}
    conn.close()
    return res

def update_office_config(office_id: int, office_name: str, hpo_group: str, pin_code: str, is_operational: int, is_active: int):
    conn = get_db_connection()
    conn.execute("""
        UPDATE offices
        SET office_name = ?, hpo_group = ?, pin_code = ?, is_operational = ?, is_active = ?
        WHERE id = ?
    """, (office_name, hpo_group, pin_code, is_operational, is_active, office_id))
    conn.commit()
    conn.close()
    return {"status": "success"}
