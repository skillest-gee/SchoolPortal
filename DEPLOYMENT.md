# SchoolPortal Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Connect to GitHub:**
   - Push your code to GitHub
   - Connect your GitHub repo to Vercel
   - Vercel will auto-deploy

2. **Environment Variables in Vercel:**
   ```
   DATABASE_URL=postgresql://username:password@host:port/database
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-secret-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

3. **Database Setup:**
   - Use Vercel Postgres or external PostgreSQL
   - Run migrations: `npx prisma migrate deploy`

### Option 2: Railway

1. **Deploy to Railway:**
   - Connect GitHub repo to Railway
   - Add PostgreSQL service
   - Deploy automatically

2. **Environment Variables:**
   - Railway will provide DATABASE_URL automatically
   - Add other required environment variables

### Option 3: Docker Deployment

1. **Local Development:**
   ```bash
   docker-compose up -d
   ```

2. **Production:**
   ```bash
   docker build -t schoolportal .
   docker run -p 3000:3000 schoolportal
   ```

## 📋 Pre-Deployment Checklist

### ✅ Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Authentication
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Optional)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.com
```

### ✅ Database Setup

1. **Create PostgreSQL Database:**
   ```sql
   CREATE DATABASE schoolportal;
   ```

2. **Run Migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Seed Database (Optional):**
   ```bash
   npm run db:seed
   ```

### ✅ Security Checklist

- [ ] Change default passwords
- [ ] Set strong NEXTAUTH_SECRET
- [ ] Configure CORS properly
- [ ] Set up SSL/HTTPS
- [ ] Configure rate limiting
- [ ] Set up monitoring

## 🔧 Production Optimizations

### Performance
- Enable Next.js Image Optimization
- Configure CDN for static assets
- Set up Redis for caching
- Enable compression

### Monitoring
- Set up error tracking (Sentry)
- Configure logging
- Set up health checks
- Monitor database performance

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection:**
   - Check DATABASE_URL format
   - Ensure database is accessible
   - Run migrations

2. **Authentication Issues:**
   - Verify NEXTAUTH_SECRET
   - Check NEXTAUTH_URL
   - Test OAuth providers

3. **File Uploads:**
   - Check file permissions
   - Configure upload limits
   - Set up cloud storage

### Health Checks

- Database: `/api/health/database`
- Application: `/api/health`

## 📞 Support

For deployment issues:
1. Check logs in deployment platform
2. Verify environment variables
3. Test database connectivity
4. Check Next.js build logs
