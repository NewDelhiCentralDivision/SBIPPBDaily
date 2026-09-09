import os
import sys
from datetime import datetime
import json

from fastapi import FastAPI, Request, HTTPException, Query, Body
from fastapi.responses import HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Add current directory to path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

import db

app = FastAPI(title="India Post - New Delhi Central Division Savings Monitor")

# Static and templates
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

@app.get("/", response_class=HTMLResponse)
async def index_page(request: Request):
    """Office Submission Portal"""
    offices = db.get_operational_offices()
    products = db.get_active_products()
    today_str = datetime.now().strftime("%Y-%m-%d")
    return templates.TemplateResponse("index.html", {
        "request": request,
        "offices": offices,
        "products": products,
        "today_str": today_str
    })

@app.get("/admin", response_class=HTMLResponse)
async def admin_page(request: Request, date: str = None):
    """Divisional Office Executive Dashboard"""
    report_date = date or datetime.now().strftime("%Y-%m-%d")
    data = db.get_daily_dashboard(report_date)
    return templates.TemplateResponse("admin.html", {
        "request": request,
        "data": data,
        "report_date": report_date
    })

@app.get("/report", response_class=HTMLResponse)
async def report_card_page(request: Request, date: str = None):
    """WhatsApp-Ready Performance Report Card"""
    report_date = date or datetime.now().strftime("%Y-%m-%d")
    data = db.get_daily_dashboard(report_date)
    return templates.TemplateResponse("report_card.html", {
        "request": request,
        "data": data,
        "report_date": report_date
    })

# REST APIs

@app.get("/api/offices")
async def api_get_offices():
    return {"offices": db.get_operational_offices()}

@app.get("/api/products")
async def api_get_products():
    return {"products": db.get_active_products()}

@app.get("/api/submission")
async def api_get_submission(office_id: int = Query(...), date: str = Query(...)):
    sub = db.get_office_submission(office_id, date)
    if sub:
        return {"exists": True, "submission": sub}
    return {"exists": False}

@app.post("/api/verify-pin")
async def api_verify_pin(payload: dict = Body(...)):
    office_id = payload.get("office_id")
    pin = payload.get("pin", "")
    if not office_id:
        raise HTTPException(status_code=400, detail="Missing office_id")
    valid, message = db.verify_office_pin(int(office_id), pin)
    return {"valid": valid, "message": message}

@app.post("/api/submit")
async def api_submit(payload: dict = Body(...)):
    office_id = payload.get("office_id")
    pin = payload.get("pin", "")
    report_date = payload.get("report_date")
    submitted_by = payload.get("submitted_by", "Postal Staff")
    items_data = payload.get("items", {})
    is_admin = bool(payload.get("is_admin", False))
    admin_notes = payload.get("admin_notes")

    if not office_id or not report_date:
        raise HTTPException(status_code=400, detail="Office and Date are required")

    # Verify PIN unless admin
    if not is_admin:
        valid, msg = db.verify_office_pin(int(office_id), pin)
        if not valid:
            raise HTTPException(status_code=403, detail=msg)

    # Validate numbers
    for code, vals in items_data.items():
        for field in ["opened", "closed", "achievement"]:
            v = vals.get(field, 0)
            try:
                iv = int(v or 0)
                if iv < 0:
                    raise HTTPException(status_code=400, detail=f"Negative values not allowed: {code} {field}")
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid number for {code} {field}")

    res = db.save_submission(int(office_id), report_date, submitted_by, items_data, is_admin, admin_notes)
    return res

@app.get("/api/dashboard")
async def api_dashboard(date: str = None):
    report_date = date or datetime.now().strftime("%Y-%m-%d")
    return db.get_daily_dashboard(report_date)

@app.get("/api/whatsapp-text")
async def api_whatsapp_text(date: str = None):
    report_date = date or datetime.now().strftime("%Y-%m-%d")
    dash = db.get_daily_dashboard(report_date)
    
    # Format date DD.MM.YYYY
    try:
        dt_obj = datetime.strptime(report_date, "%Y-%m-%d")
        display_date = dt_obj.strftime("%d.%m.%Y")
    except Exception:
        display_date = report_date
        
    m = dash["metrics"]
    
    lines = [
        "📮 *DEPARTMENT OF POSTS – INDIA POST*",
        "*NEW DELHI CENTRAL DIVISION*",
        "*DAILY SAVINGS & IPPB PERFORMANCE REPORT*",
        f"📅 *Date: {display_date}*",
        "━━━━━━━━━━━━━━━━━━━━━━",
        f"📊 *Reporting Status:* {m['submitted_count']} / {m['total_offices']} Offices",
        f"⏳ *Pending Offices:* {m['pending_count']}",
        f"📈 *Completion Rate:* {m['completion_pct']}%",
        "━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "💰 *SAVINGS / POSB PERFORMANCE*",
        "┌────────┬────────┬────────┐",
        "│ *Scheme* │ *Opened* │ *Closed* │",
        "├────────┼────────┼────────┤"
    ]
    
    for p in dash["consolidated_products"]:
        if p["section"] == "SAVINGS":
            sname = p["short_name"].ljust(6)[:6]
            if p["entry_mode"] == "CLOSED_ONLY":
                lines.append(f"│ {sname} │   --   │  {str(p['total_closed']).rjust(5)} │")
            else:
                lines.append(f"│ {sname} │  {str(p['total_opened']).rjust(5)} │  {str(p['total_closed']).rjust(5)} │")
                
    lines.extend([
        "├────────┼────────┼────────┤",
        f"│ *TOTAL*  │ *{str(m['total_savings_opened']).rjust(5)}* │ *{str(m['total_savings_closed']).rjust(5)}* │",
        "└────────┴────────┴────────┘",
        "",
        "📱 *IPPB PERFORMANCE*",
        "• *Accounts Opened:* " + str(m['total_ippb_opened']),
        "• *Accounts Closed:* " + str(m['total_ippb_closed']),
        "--- Activities / Services ---"
    ])
    
    for p in dash["consolidated_products"]:
        if p["section"] == "IPPB" and p["entry_mode"] == "ACHIEVEMENT_COUNT":
            lines.append(f"• {p['name']}: *{p['total_achievement']}*")
            
    lines.extend([
        "",
        "━━━━━━━━━━━━━━━━━━━━━━",
        "Generated via Divisional Reporting Portal"
    ])
    
    return {"text": "\n".join(lines)}

@app.get("/api/export/csv")
async def api_export_csv(date: str = None):
    report_date = date or datetime.now().strftime("%Y-%m-%d")
    dash = db.get_daily_dashboard(report_date)
    
    products = dash["products"]
    headers = ["Office Name", "HPO Group", "Status", "Submitted By", "Submission Time", "Last Updated"]
    
    for p in products:
        if p["entry_mode"] == "OPENED_AND_CLOSED":
            headers.extend([f"{p['short_name']} Opened", f"{p['short_name']} Closed"])
        elif p["entry_mode"] == "CLOSED_ONLY":
            headers.append(f"{p['short_name']} Closed")
        elif p["entry_mode"] == "OPENED_ONLY":
            headers.append(f"{p['short_name']} Opened")
        else:
            headers.append(f"{p['short_name']} Count")
            
    csv_rows = [",".join([f'"{h}"' for h in headers])]
    
    for row in dash["office_matrix"]:
        r_data = [
            row["office_name"],
            row["hpo_group"],
            row["status"],
            row["submitted_by"],
            row["submitted_at"] or "",
            row["updated_at"] or ""
        ]
        v = row["counts"]
        for p in products:
            code = p["code"]
            vals = v.get(code, {"opened": 0, "closed": 0, "achievement": 0})
            if p["entry_mode"] == "OPENED_AND_CLOSED":
                r_data.extend([str(vals["opened"]), str(vals["closed"])])
            elif p["entry_mode"] == "CLOSED_ONLY":
                r_data.append(str(vals["closed"]))
            elif p["entry_mode"] == "OPENED_ONLY":
                r_data.append(str(vals["opened"]))
            else:
                r_data.append(str(vals["achievement"]))
                
        csv_rows.append(",".join([f'"{d}"' for d in r_data]))
        
    csv_content = "\n".join(csv_rows)
    return Response(content=csv_content, media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=Savings_Performance_{report_date}.csv"
    })

@app.post("/api/admin/products")
async def api_admin_save_product(payload: dict = Body(...)):
    action = payload.get("action")
    if action == "add":
        res = db.add_product_config(
            payload["code"],
            payload["name"],
            payload["short_name"],
            payload["section"],
            payload["entry_mode"],
            int(payload.get("display_order", 99))
        )
        return res
    elif action == "edit":
        res = db.update_product_config(
            int(payload["id"]),
            payload["name"],
            payload["short_name"],
            payload["section"],
            payload["entry_mode"],
            int(payload.get("display_order", 0)),
            int(payload.get("is_active", 1))
        )
        return res
    raise HTTPException(status_code=400, detail="Invalid action")

@app.post("/api/admin/offices")
async def api_admin_save_office(payload: dict = Body(...)):
    res = db.update_office_config(
        int(payload["id"]),
        payload["office_name"],
        payload["hpo_group"],
        payload["pin_code"],
        int(payload.get("is_operational", 1)),
        int(payload.get("is_active", 1))
    )
    return res

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
