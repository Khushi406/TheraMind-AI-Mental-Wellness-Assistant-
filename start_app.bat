@echo off
REM TheraMind Development Server Launcher
REM Created by Khushi

echo Starting TheraMind Wellness Application...
echo ==========================================

cd /d "C:\Users\khush\Downloads\TheraMind\TheraMindWellness"

echo Current directory: %CD%
echo.

echo Installing cross-env if needed...
call npm install cross-env --save-dev

echo.
echo Starting Node.js server...
echo Your app will be available at: http://localhost:5000
echo.

call npm run dev

pause