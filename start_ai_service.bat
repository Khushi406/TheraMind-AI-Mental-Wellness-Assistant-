@echo off
REM TheraMind AI Flask Service Launcher  
REM Created by Khushi

echo Starting TheraMind AI Service...
echo ==================================

cd /d "C:\Users\khush\Downloads\TheraMind\TheraMindWellness"

echo Current directory: %CD%
echo.

echo Starting Python Flask AI service...
echo AI service will be available at: http://localhost:8000
echo.

"C:\Users\khush\AppData\Local\Programs\Python\Python313\python.exe" server/flask_app.py

pause