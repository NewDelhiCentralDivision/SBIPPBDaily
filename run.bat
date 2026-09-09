@echo off
echo ==========================================================
echo  India Post - New Delhi Central Division Savings Monitor 
echo ==========================================================

python --version
pip install -r requirements.txt
python init_db.py
echo Starting server...
echo Office Portal:  http://localhost:8000/
echo Admin Console:  http://localhost:8000/admin
echo WhatsApp Card:  http://localhost:8000/report
python app.py
pause
