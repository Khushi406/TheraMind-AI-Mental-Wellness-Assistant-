#!/bin/bash

# TheraMind Database Backup Script
# Run this ASAP to backup your Railway data

echo "🔄 Starting TheraMind database backup..."

# Set your Railway database URL (get from Railway dashboard)
# Replace this with your actual Railway database URL
RAILWAY_DB_URL="postgresql://username:password@hostname:port/database"

# Create backup directory
mkdir -p backups

# Generate timestamp for backup file
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backups/theramind_backup_${TIMESTAMP}.sql"

echo "📊 Exporting database to: $BACKUP_FILE"

# Export database
pg_dump "$RAILWAY_DB_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database backup successful!"
    echo "📁 Backup saved to: $BACKUP_FILE"
    echo "📏 Backup size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "❌ Database backup failed!"
    exit 1
fi

# Also create a JSON export of any file-based data
echo "📄 Creating additional data exports..."

# Export environment variables template
cat > backups/env_variables_${TIMESTAMP}.txt << EOF
# Environment Variables for Migration
GEMINI_API_KEY=AIzaSyD3Cm9n5FRdj9Pt1kG5gwvqw2CIN_5Dyn8
NODE_ENV=production
# Add any other custom environment variables here
EOF

echo "✅ Backup process complete!"
echo "📦 Files created:"
echo "   - $BACKUP_FILE (database)"
echo "   - backups/env_variables_${TIMESTAMP}.txt (environment variables)"
echo ""
echo "🚀 Next steps:"
echo "   1. Claim GitHub Student Developer Pack"
echo "   2. Set up DigitalOcean account"
echo "   3. Create new app using the .do/app.yaml config"
echo "   4. Import this backup to your new database"