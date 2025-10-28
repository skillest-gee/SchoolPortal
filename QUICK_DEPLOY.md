# 🚀 Quick Deploy to Vercel

**Your app is already pushed to GitHub** ✅

---

## 📋 Deploy via Vercel Dashboard (Easiest)

### **Steps**:

1. **Go to**: https://vercel.com/dashboard

2. **Import Project**:
   - Click "Add New..." → "Project"
   - Select repository: `skillest-gee/SchoolPortal`
   - Click "Import"

3. **Configure** (auto-detected):
   ```
   Framework: Next.js ✅
   Build Command: npm run build ✅
   Output Directory: .next ✅
   ```

4. **Environment Variables** (Click "Environment Variables"):
   ```env
   DATABASE_URL = postgresql://postgres:DZFmOovrwvzIebylbQjpJOlropqNGVfd@turntable.proxy.rlwy.net:46628/railway?sslmode=require
   
   NEXTAUTH_URL = (will be auto-generated - update after first deploy)
   
   NEXTAUTH_SECRET = 6e08a64096fc9a134b62f02e25255a81
   
   RESEND_API_KEY = (your resend key)
   
   FROM_EMAIL = noreply@school.edu
   ```

5. **Deploy**:
   - Click "Deploy" button
   - Wait ~3-5 minutes for build

6. **After Deployment**:
   - Copy your URL (e.g., `https://school-portal-xxxxx.vercel.app`)
   - Go to Settings → Environment Variables
   - Update `NEXTAUTH_URL` with your actual URL
   - Redeploy

---

## ✅ That's It!

Your app will be live at: `https://your-app.vercel.app`

**Login Credentials**:
- Admin: `admin@school.edu` / `admin123`
- Lecturer: `lecturer@school.edu` / `lecturer123`
- Student: `STU2024001` / `student123`

---

## 🎯 Ready to Test Application Process?

See: `APP_PROCESS_STEPS.md`

