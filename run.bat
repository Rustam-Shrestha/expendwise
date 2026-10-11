@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
cd /d "%ROOT%"

if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo [ERROR] Python venv missing at .venv\. Run setup first.
  exit /b 1
)
if not exist "%ROOT%node_modules" (
  echo [ERROR] Root node_modules missing. Run setup first.
  exit /b 1
)
if not exist "%ROOT%frontend\node_modules" (
  echo [ERROR] frontend\node_modules missing. Run setup first.
  exit /b 1
)

echo Starting backend on http://localhost:5000...
start "YBC Backend" /D "%ROOT%backend" cmd /k node index.js

echo Starting ML service on http://localhost:5001...
start "YBC ML Service" /D "%ROOT%ml" cmd /k call "%ROOT%.venv\Scripts\activate.bat" ^&^& python -m uvicorn app.main:app --host 127.0.0.1 --port 5001

echo Starting frontend on http://localhost:3000...
start "YBC Frontend" /D "%ROOT%frontend" cmd /k npm run dev

echo.
echo All services started. Close the three service windows to stop them.
timeout /t 2 >nul
start "" http://localhost:3000
endlocal