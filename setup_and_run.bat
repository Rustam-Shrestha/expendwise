@echo off
setlocal EnableExtensions
set "ROOT=%~dp0"
cd /d "%ROOT%"

where python >nul 2>&1 || (echo Python 3 is required. Install Python and try again. & exit /b 1)
where node >nul 2>&1 || (echo Node.js is required. Install Node.js and try again. & exit /b 1)
where npm >nul 2>&1 || (echo npm is required. Install Node.js and try again. & exit /b 1)

if not exist "%ROOT%.venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  python -m venv "%ROOT%.venv"
  if errorlevel 1 exit /b 1
)

echo Installing ML dependencies...
call "%ROOT%.venv\Scripts\activate.bat"
python -m pip install --upgrade pip
if errorlevel 1 exit /b 1
python -m pip install -r "%ROOT%ml\requirements.txt"
if errorlevel 1 exit /b 1

echo Installing root Node dependencies...
call npm install --legacy-peer-deps
if errorlevel 1 exit /b 1

echo Installing frontend dependencies...
cd /d "%ROOT%frontend"
call npm install
if errorlevel 1 exit /b 1

cd /d "%ROOT%"
echo Generating ML dataset and training risk model...
call "%ROOT%.venv\Scripts\activate.bat"
python "%ROOT%ml\app\training\generate_synthetic.py"
if errorlevel 1 exit /b 1
python "%ROOT%ml\app\training\train_risk.py"
if errorlevel 1 exit /b 1

echo Starting backend on http://localhost:5000...
start "YBC Backend" /D "%ROOT%backend" cmd /k node index.js

echo Starting ML service on http://localhost:5001...
start "YBC ML Service" /D "%ROOT%ml" cmd /k call "%ROOT%.venv\Scripts\activate.bat" ^&^& python -m uvicorn app.main:app --host 127.0.0.1 --port 5001

echo Starting frontend on http://localhost:3000...
start "YBC Frontend" /D "%ROOT%frontend" cmd /k npm run dev

echo.
echo All services started. Close the three service windows to stop them.
start "" http://localhost:3000
endlocal
