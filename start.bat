@echo off
title VideoNest
color 0C
cls

echo.
echo  ==========================================
echo     VideoNest - Personal Streaming
echo  ==========================================
echo.

:: Check Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python not found! Install Python 3.11+
    pause
    exit /b 1
)

:: Check Node
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found! Install Node.js 20+
    pause
    exit /b 1
)

:: Check FFmpeg
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [WARNING] FFmpeg not found! Video scanning may not work.
    echo  Install from: https://ffmpeg.org/download.html
    echo.
)

echo  [1/4] Installing backend dependencies...
cd /d "%~dp0backend"
pip install -r requirements.txt --quiet 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo  [2/4] Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install --silent 2>nul
if %errorlevel% neq 0 (
    echo  [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo  [3/4] Starting backend server...
cd /d "%~dp0backend"
start "VideoNest Backend" /min cmd /c "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Wait for backend to be ready
echo  [4/4] Waiting for backend...
set /a count=0
:waitloop
timeout /t 1 /nobreak >nul
set /a count+=1
if %count% gtr 15 (
    echo  [WARNING] Backend may not be ready, trying anyway...
    goto startfrontend
)
curl -s http://localhost:8000/api/health >nul 2>&1
if %errorlevel% neq 0 goto waitloop

:startfrontend
echo.
echo  ==========================================
echo     Starting VideoNest...
echo  ==========================================
echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo.
echo  Browser will open automatically.
echo  Press Ctrl+C to stop.
echo.

cd /d "%~dp0frontend"
start "" http://localhost:5173
call npm run dev
