# 🔐 Security Setup Guide - IMMEDIATE ACTION REQUIRED

**Date**: October 25, 2025  
**Priority**: CRITICAL 🔴

---

## ⚠️ IMPORTANT: You Need to Do This Now

GitHub sent you security alerts because **credentials were exposed** in the repository.

---

## 🚨 IMMEDIATE STEPS

### **Step 1: Create Your .env File**

```bash
# Copy the example file
cp env.example .env

# Edit with your actual credentials
# Use a code editor, NEVER commit this file
```

---

### **Step 2: Fill In Your .env File**

**Edit `.env` file and replace placeholders**:

```env
# Database - Use your actual PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/school_portal?schema=public"

# Generate a secure secret (run this command):
# openssl rand -base64 32
NEXTAUTH_SECRET="paste_generated_secret_here"

# Your application URL
NEXTAUTH_URL="http://localhost:3000"

# Resend email API key
RESEND_API_KEY="your_resend_api_key_from_resend.com"

# Email from address
FROM_EMAIL="noreply@yourdomain.com"

# University name
UNIVERSITY_NAME="Your University Name"

# AWS credentials (if using S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID="your_aws_access_key"
AWS_SECRET_ACCESS_KEY="your_aws_secret_key"
AWS_S3_BUCKET_NAME="your_bucket_name"
```

---

### **Step 3: Generate Secure Secrets**

**Open terminal and run**:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Copy the output and paste into .env file
```

---

### **Step 4: Change All Exposed Credentials** 🔴

**If these were exposed in GitHub, CHANGE THEM NOW**:

1. ✅ **Database password** - Change in database
2. ✅ **NEXTAUTH_SECRET** - Generate new one
3. ✅ **AWS keys** - Rotate in AWS console
4. ✅ **Resend API key** - Generate new one in Resend dashboard

---

### **Step 5: Verify .env is Ignored**

```bash
# Check git status
git status

# Should NOT show .env file
# If it shows, it's already too late (credentials exposed)
```

---

### **Step 6: Update docker-compose.yml Usage**

**To run with docker-compose now**:

```bash
# docker-compose will read from .env file
docker-compose up -d

# Make sure .env file exists first!
```

---

## 📝 What I Fixed

### **1. docker-compose.yml** ✅
- ❌ **Before**: Hardcoded passwords
- ✅ **After**: Uses environment variables

### **2. .gitignore** ✅
- ✅ Enhanced to ignore all .env files
- ✅ Added security patterns

### **3. env.example** ✅
- ✅ Complete example with instructions
- ✅ Safe to commit (no real credentials)

---

## 🔴 CRITICAL: If Credentials Were Exposed

**If secrets were in commit history**:

### **You MUST**:

1. 🔴 **Change database password**
   ```sql
   ALTER USER schoolportal WITH PASSWORD 'new_strong_password';
   ```

2. 🔴 **Rotate AWS keys**
   - Go to AWS IAM Console
   - Delete old access keys
   - Create new ones

3. 🔴 **Rotate Resend API key**
   - Go to Resend dashboard
   - Revoke old key
   - Generate new key

4. 🔴 **Generate new NEXTAUTH_SECRET**
   ```bash
   openssl rand -base的说 32
   ```

5. 🔴 **Update .env file** with new values

---

## ✅ Verification Checklist

- [ ] Created .env file from env.example
- [ ] Generated secure NEXTAUTH_SECRET
- [ ] Added real database URL
- [ ] Added Resend API key
- [ ] Changed exposed database password
- [ ] Rotated AWS keys (if exposed)
- [ ] Rotated Resend API key
- [ ] Verified .env is NOT in git
- [ ] Updated docker-compose.yml
- [ ] Tested application runs

---

## 🚨 Preventing Future Exposure

### **DO** ✅:
- ✅ Always use environment variables
- ✅ Keep .env in .gitignore
- ✅ Use env.example for documentation
- ✅ Never hardcode passwords
- ✅ Use secrets management in production

### **DON'T** ❌:
- ❌ Never commit .env file
- ❌ Never hardcode credentials
- ❌ Never share API keys in code
- ❌ Never commit docker-compose with passwords
- ❌ Never push secrets to GitHub

---

## 📧 About GitHub Security Alerts

**GitHub detects**:
- API keys
- Database passwords
- Secret tokens
- AWS keys
- Other credentials

**What you need to do**:
1. ✅ Change all exposed credentials
2. ✅ Remove from git history (if needed)
3. ✅ Set up proper .env file
4. ✅ Follow this guide

---

## 🎯 Summary

**I Fixed**:
- ✅ Removed hardcoded passwords from docker-compose.yml
- ✅ Enhanced .gitignore
- ✅ Created comprehensive env.example

**You Need To**:
- 🔴 Create .env file with real credentials
- 🔴 Change any exposed passwords
- 🔴 Rotate exposed API keys
- 🔴 Never commit .env file

---

**Status**: 🔴 **Action Required - Follow Steps Above**  
**Date**: October 25, 2025

