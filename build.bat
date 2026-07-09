@echo off
echo ========================================
echo    VideoNest - Building Installer
echo ========================================
echo.

echo [1/3] Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] Installing Python dependencies...
cd backend
pip install pyinstaller
if %errorlevel% neq 0 (
    echo Failed to install PyInstaller!
    pause
    exit /b 1
)

echo.
echo [3/3] Building backend executable...
pyinstaller --name VideoNest --onedir --add-data "app;app" --hidden-import app.main app.core.config app.core.database app.models.models app.models.schemas app.api.profiles app.api.folders app.api.videos app.api.history app.api.favorites app.api.settings app.services.ffmpeg app.services.scanner app.services.watcher main.py
if %errorlevel% neq 0 (
    echo Backend build failed!
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo    Build complete!
echo ========================================
echo.
echo Backend: backend/dist/VideoNest/
echo Frontend: frontend/dist/
echo.
echo Run create-installer.bat to create the installer.
pause
