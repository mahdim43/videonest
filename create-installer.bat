@echo off
echo ========================================
echo    VideoNest - Creating Installer
echo ========================================
echo.

where makensis >nul 2>nul
if %errorlevel% neq 0 (
    echo NSIS not found!
    echo.
    echo Please install NSIS from: https://nsis.sourceforge.io/Download
    echo Make sure makensis.exe is in your PATH.
    echo.
    pause
    exit /b 1
)

echo Building installer...
makensis installer.nsi
if %errorlevel% neq 0 (
    echo Installer build failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Installer created successfully!
echo ========================================
echo.
echo Output: VideoNest-Setup.exe
echo.
pause
