@echo off
REM TheraMind Database Backup Script for Windows
REM Run this ASAP to backup your Railway data

echo 🔄 Starting TheraMind database backup...

REM Set your Railway database URL (get from Railway dashboard)
REM Replace this with your actual Railway database URL
set RAILWAY_DB_URL=postgresql://username:password@hostname:port/database

REM Create backup directory
if not exist "backups" mkdir backups

REM Generate timestamp for backup file
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "TIMESTAMP=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
set "BACKUP_FILE=backups\theramind_backup_%TIMESTAMP%.sql"

echo 📊 Exporting database to: %BACKUP_FILE%

REM Export database (you'll need PostgreSQL client tools installed)
pg_dump "%RAILWAY_DB_URL%" > "%BACKUP_FILE%"

if %errorlevel% equ 0 (
    echo ✅ Database backup successful!
    echo 📁 Backup saved to: %BACKUP_FILE%
) else (
    echo ❌ Database backup failed!
    echo Make sure PostgreSQL client tools are installed
    pause
    exit /b 1
)

REM Create environment variables template
echo 📄 Creating additional data exports...
(
echo # Environment Variables for Migration
echo GEMINI_API_KEY=AIzaSyD3Cm9n5FRdj9Pt1kG5gwvqw2CIN_5Dyn8
echo NODE_ENV=production
echo # Add any other custom environment variables here
) > "backups\env_variables_%TIMESTAMP%.txt"

echo ✅ Backup process complete!
echo 📦 Files created:
echo    - %BACKUP_FILE% (database)
echo    - backups\env_variables_%TIMESTAMP%.txt (environment variables)
echo.
echo 🚀 Next steps:
echo    1. Claim GitHub Student Developer Pack
echo    2. Set up DigitalOcean account  
echo    3. Create new app using the .do\app.yaml config
echo    4. Import this backup to your new database
echo.
pause