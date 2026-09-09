#!/usr/bin/env bash
set -e

echo "=========================================================="
echo " India Post - New Delhi Central Division Savings Monitor "
echo "=========================================================="

# 1. Check Python version
python3 --version

# 2. Install requirements if not installed
if ! python3 -c "import fastapi, uvicorn, jinja2" &>/dev/null; then
    echo "Installing required Python packages..."
    pip install -r requirements.txt
fi

# 3. Initialize database if not exists
if [ ! -f "data/savings_monitor.db" ]; then
    echo "Initializing database..."
    python3 init_db.py
fi

# 4. Start the application server
echo "Starting application on http://localhost:8000"
echo "Office Submission Portal: http://localhost:8000/"
echo "Admin Dashboard:          http://localhost:8000/admin"
echo "WhatsApp Report Card:     http://localhost:8000/report"
echo "Press Ctrl+C to stop."
python3 app.py
