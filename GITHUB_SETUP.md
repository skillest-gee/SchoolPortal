# 🚀 GitHub & Vercel Deployment Guide

## Step 1: Create GitHub Repository

### Option A: Using GitHub CLI (if installed)
```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: SchoolPortal - University Management System"

# Create repository on GitHub
gh repo create schoolportal --public --description "A comprehensive university portal system built with Next.js, TypeScript, and PostgreSQL"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/schoolportal.git
git branch -M main
git push -u origin main
```

### Option B: Using GitHub Web Interface
1. Go to [GitHub.com](https://github.com) and sign in
2. Click "New repository"
3. Repository name: `schoolportal`
4. Description: `A comprehensive university portal system built with Next.js, TypeScript, and PostgreSQL`
5. Set to Public
6. Don't initialize with README (we already have one)
7. Click "Create repository"

## Step 2: Push Your Code to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: SchoolPortal - University Management System"

# Add remote origin (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/schoolportal.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (your account)
# - Link to existing project? N
# - Project name: schoolportal
# - Directory: ./
# - Override settings? N
```

### Option B: Using Vercel Web Interface
1. Go to [Vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## Step 4: Set Up Environment Variables in Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

### Required Variables:
```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

### Optional Variables:
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com
```

## Step 5: Set Up Database

### Option A: Vercel Postgres (Recommended)
1. In Vercel dashboard, go to Storage
2. Create a new Postgres database
3. Copy the connection string to `DATABASE_URL`
4. Run migrations: `npx prisma migrate deploy`

### Option B: External Database
- Use Railway, Supabase, or PlanetScale
- Get connection string and add to `DATABASE_URL`

## Step 6: Run Database Migrations

After deployment, run:
```bash
# In Vercel dashboard terminal or locally
npx prisma migrate deploy
npx prisma generate
```

## Step 7: Test Your Deployment

1. Visit your Vercel URL
2. Test the health endpoint: `https://your-app.vercel.app/api/health/database`
3. Test authentication
4. Test core features

## 🎉 Success!

Your SchoolPortal is now live! You can continue development by:
- Pushing changes to GitHub (auto-deploys to Vercel)
- Using Vercel's preview deployments for testing
- Monitoring performance in Vercel dashboard
