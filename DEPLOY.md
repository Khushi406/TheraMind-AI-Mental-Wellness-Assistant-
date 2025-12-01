# TheraMind Wellness - Render Deployment Guide

## Prerequisites
- GitHub account
- Render account (free): https://render.com

## Deployment Steps

### 1. Push Code to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize Render to access your repositories

### 3. Create PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Name: `theramind-db`
3. Database: `theramind_db`
4. User: `theramind_user`
5. Region: Choose closest to you
6. Plan: **Free**
7. Click "Create Database"
8. **Copy the External Database URL** (you'll need this)

### 4. Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `theramind-wellness`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **Free**

### 5. Add Environment Variables
In the "Environment" section, add:

```
DATABASE_URL=<paste-external-database-url-here>
GEMINI_API_KEY=AIzaSyD3Cm9n5FRdj9Pt1kG5gwvqw2CIN_5Dyn8
JWT_SECRET=theramind-wellness-jwt-secret-key-2024-secure-token-generation
SESSION_SECRET=26mbu5aMqLrGj+QTS+m/IvRLVMvchZKzzdHygRkT4kVKcxLLHBFSyNx48d6wJwkNG8qQkyKpx5HwSuq7JjwmYQ==
NODE_ENV=production
```

### 6. Deploy
1. Click "Create Web Service"
2. Wait 5-10 minutes for deployment
3. Your app will be live at: `https://theramind-wellness.onrender.com`

### 7. Run Database Migrations
After first deployment:
1. Go to your web service dashboard
2. Click "Shell" tab
3. Run: `npm run migrate`

## Important Notes
- ⚠️ Free tier databases expire after 90 days (backup your data!)
- 🌐 Your app URL: Will be provided after deployment
- 🔄 Auto-deploys on every git push to main branch
- 💤 Free tier apps sleep after 15 min of inactivity (first request takes ~30s)

## Troubleshooting
- If build fails, check logs in Render dashboard
- Make sure all environment variables are set correctly
- Database URL should start with `postgresql://`
