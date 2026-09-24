@echo off
echo ============================================
echo   LAND STACK - Digital Land Governance
echo ============================================
echo Starting servers...
echo.

echo [1/3] Starting Backend API (port 8000)...
start "LAND STACK Backend" cmd /c "cd /d C:\Users\MEGA\Desktop\SIH\LAND_STACK\backend && venv\Scripts\activate && venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 5 /nobreak >nul

echo [2/3] Starting Frontend (port 5173)...
start "LAND STACK Frontend" cmd /c "cd /d C:\Users\MEGA\Desktop\SIH\LAND_STACK\frontend && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Opening browser...
start http://localhost:5173

echo.
echo ============================================
echo   READY! Open http://localhost:5173
echo   Login: citizen1@landstack.gov.in
echo   Pass: password123
echo ============================================
echo.
pause
