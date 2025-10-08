# Migration Guide: Railway to DigitalOcean

## 🎯 Why DigitalOcean?
- **$200 credit for 1 year** (vs Railway's limited free tier)
- Same GitHub integration
- PostgreSQL database included
- Better long-term sustainability

## 🚀 Quick Migration Steps:

### 1. **Claim GitHub Student Pack Benefits**
1. Go to [GitHub Student Developer Pack](https://education.github.com/pack)
2. Verify your student status
3. Claim DigitalOcean $200 credit

### 2. **Export Data from Railway**
```bash
# Export your current database
pg_dump $RAILWAY_DATABASE_URL > theramind_backup.sql
```

### 3. **Set up DigitalOcean App Platform**
1. Login to DigitalOcean
2. Go to App Platform
3. Create app from GitHub repo
4. Use the `.do/app.yaml` configuration

### 4. **Environment Variables**
Copy these from Railway to DigitalOcean:
- `GEMINI_API_KEY`: AIzaSyD3Cm9n5FRdj9Pt1kG5gwvqw2CIN_5Dyn8
- `NODE_ENV`: production
- Database will be auto-created

### 5. **Import Database**
```bash
# After DigitalOcean database is created
psql $DO_DATABASE_URL < theramind_backup.sql
```

## 💰 **Cost Comparison**
- **Railway**: Free tier ending in 18 days
- **DigitalOcean**: $200 credit = ~16 months of hosting
- **Backup Option**: Heroku ($13/month × 24 months)

## 🔄 **Alternative: Azure Setup**
If you prefer Azure:
1. Claim $100 Azure credit
2. Use Azure App Service + PostgreSQL
3. Better AI integration possibilities

## ⚡ **Emergency Backup Plan**
If you need immediate migration:
1. Export database NOW
2. Set up Heroku (fastest migration)
3. Deploy in <30 minutes

## 📊 **Timeline**
- **Today**: Claim student benefits
- **This week**: Set up DigitalOcean
- **Next week**: Migrate database
- **Before Day 18**: Switch DNS/domains

Need help with any of these steps?