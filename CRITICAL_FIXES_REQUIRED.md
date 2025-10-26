# 🚨 Critical Fixes Required Before Production

This document outlines the **most urgent fixes** needed to make the School Portal production-ready.

---

## 🔴 CRITICAL (Do Not Launch Without These)

### 1. Payment System - Real Gateway Integration
**Current**: Auto-approves all payments (MAJOR SECURITY RISK)  
**Required**: Integrate Paystack/Stripe/Flutterwave  
**Priority**: 🔴 CRITICAL  
**Est. Time**: 2-3 days

**Files to Modify**:
- `src/app/api/payments/route.ts`
- `src/app/(dashboard)/student/finances/page.tsx`
- `src/app/(dashboard)/student/finances/pay/[feeId]/page.tsx`

**Implementation**:
```typescript
// Install: npm install paystack-node
import Paystack from 'paystack-node'

// In payment API
const paystack = new Paystack(process.env.PAYSTACK_SECRET_KEY)

// Initialize payment
const result = await paystack.transaction.initialize({
  email: user.email,
  amount: amount * 100, // kobo
  reference: reference
})

// Create payment record with status PENDING
// Verify via webhook when payment succeeds
```

**Webhook Handler**:
- Create `/api/payments/webhook`
- Verify Paystack webhook signature
- Update payment status based on callback

---

### 2. Email Service - Mandatory for Notifications
**Current**: No email functionality  
**Required**: SendGrid or AWS SES integration  
**Priority**: 🔴 CRITICAL  
**Est. Time**: 1-2 days

**Install**:
```bash
npm install @sendgrid/mail
```

**Environment Variables**:
```env
SENDGRID_API_KEY=your_key
FROM_EMAIL=noreply@university.edu
```

**Files to Create**:
- `src/lib/email.ts` - Email service wrapper
- `src/templates/emails/` - Email templates

**Critical Emails to Implement**:
1. Application confirmation
2. Payment receipts
3. Grade announcements
4. Password reset links
5. Account activation

---

### 3. Security - Password Reset
**Current**: No forgot password functionality  
**Required**: Complete password reset flow  
**Priority**: 🔴 CRITICAL  
**Est. Time**: 1 day

**Implementation**:
1. Create forgot password page
2. Generate secure reset token (expires 1 hour)
3. Send reset email
4. Create reset password page
5. Update password in database

**Files**:
- `src/app/auth/forgot-password/page.tsx`
- `src/app/auth/reset-password/[token]/page.tsx`
- `src/app/api/auth/forgot-password/route.ts`
- `src/app/api/auth/reset-password/route.ts`

---

### 4. S3 Storage - Remove Base64
**Current**: Still using base64 in database  
**Required**: Complete S3 migration  
**Priority**: 🔴 CRITICAL  
**Est. Time**: 1-2 days

**Tasks**:
1. Test S3 upload functionality
2. Migrate existing base64 files to S3
3. Remove `fileData` field from UploadedFile model
4. Update file retrieval to use S3 only
5. Set up S3 bucket lifecycle policies

**Database Migration**:
```prisma
model UploadedFile {
  // Remove: fileData String?
  // Keep: s3Key, s3Bucket
}
```

---

## 🟡 HIGH PRIORITY (Should Fix Soon)

### 5. Session Security - Reduce Timeout
**Current**: 30-day sessions  
**Required**: 2-4 hour sessions with refresh  
**Priority**: 🟡 HIGH  
**Est. Time**: 4 hours

**Change in `src/lib/auth.ts`**:
```typescript
session: {
  strategy: 'jwt',
  maxAge: 2 * 60 * 60, // 2 hours (instead of 30 days)
},
jwt: {
  maxAge: 2 * 60 * 60,
},
```

---

### 6. Password Policy Enforcement
**Current**: No password requirements  
**Required**: Enforce strong passwords  
**Priority**: 🟡 HIGH  
**Est. Time**: 2 hours

**Update `src/lib/security.ts`**:
```typescript
export function validatePassword(password: string) {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain a special character')
  }
  
  return { isValid: errors.length === 0, errors }
}
```

---

### 7. Database Indexes - Fix Performance
**Current**: Indexes commented out  
**Required**: Enable all indexes  
**Priority**: 🟡 HIGH  
**Est. Time**: 2 hours

**Update `prisma/schema.prisma`**:
```prisma
model User {
  @@index([email])
  @@index([role])
  @@index([isActive])
}

model Course {
  @@index([isActive])
  @@index([department])
  @@index([level])
}

model Enrollment {
  @@index([studentId])
  @@index([courseId])
  @@index([status])
}

// Add all other commented indexes
```

**Run Migration**:
```bash
npx prisma migrate dev --name add-indexes
```

---

### 8. API Pagination - Prevent Crashes
**Current**: No pagination on most APIs  
**Required**: Add pagination everywhere  
**Priority**: 🟡 HIGH  
**Est. Time**: 1 day

**Implementation Pattern**:
```typescript
// GET /api/students?page=1&limit=50
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = (page - 1) * limit
  
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      // ...
    }),
    prisma.user.count()
  ])
  
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}
```

**APIs Needing Pagination**:
- `/api/applications` - Student applications
- `/api/students` - User lists
- `/api/messages` - Message history
- `/api/notifications` - Notification list
- `/api/fees` - Fee lists

---

## 🟢 MEDIUM PRIORITY (Can Wait but Should Do)

### 9. Audit Logging
**Priority**: 🟢 MEDIUM  
**Est. Time**: 1 day

**Create `prisma/schema.prisma`**:
```prisma
model ActivityLog {
  id        String   @id @default(cuid())
  userId    String
  action    String
  entity    String
  entityId  String?
  details   String?  // JSON
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([entity, entityId])
  @@index([createdAt])
  @@map("activity_logs")
}
```

**Create middleware to log actions**

---

### 10. Multi-Factor Authentication
**Priority**: 🟢 MEDIUM  
**Est. Time**: 2-3 days

**Files Already Created** (need integration):
- `src/app/api/auth/mfa/setup/route.ts`
- `src/app/api/auth/mfa/verify/route.ts`
- `src/lib/mfa.ts`

**Integration Needed**:
- Add MFA setup in user profile
- Require MFA for admin/lecturer login
- Implement QR code generation for authenticator apps

---

### 11. Database Backups
**Priority**: 🟢 MEDIUM  
**Est. Time**: 4 hours

**Options**:
1. **Vercel**: Use Supabase with built-in backups
2. **AWS RDS**: Automatic daily backups
3. **Manual**: Cron job to pg_dump database

**Recommended**:
```bash
# Create backup script
#!/bin/bash
pg_dump DATABASE_URL > backup_$(date +%Y%m%d).sql
# Upload to S3 or cloud storage
```

---

### 12. Error Monitoring
**Priority**: 🟢 MEDIUM  
**Est. Time**: 2 hours

**Install Sentry**:
```bash
npm install @sentry/nextjs
```

**Setup**:
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})
```

---

## 📋 Quick Wins (Can Do Anytime)

### Fix TypeScript Errors
```bash
npx tsc --noEmit
# Fix all errors
```

### Update Environment Variables
- Add all required env vars to `.env.example`
- Document in README
- Set in Vercel dashboard

### Add Loading States
- Add skeleton loaders to all pages
- Show loading indicators during API calls

### Improve Error Messages
- Replace generic errors with user-friendly messages
- Add error context

### Mobile Responsiveness
- Test all pages on mobile devices
- Fix responsive issues
- Optimize touch interactions

---

## 🎯 Recommended Implementation Order

**Week 1**:
1. Day 1-2: Payment gateway integration
2. Day 3: Email service implementation
3. Day 4: Password reset functionality
4. Day 5: S3 migration completion

**Week 2**:
1. Day 1: Security improvements (sessions, password policy)
2. Day 2: Database indexes
3. Day 3-4: API pagination
4. Day 5: Testing and bug fixes

**Week 3**:
1. Day 1-2: Audit logging
2. Day 3: Database backups
3. Day 4: Error monitoring
4. Day 5: Documentation and training

---

## 📞 Support

If you need help implementing any of these fixes, refer to:
- `PORTAL_REVIEW_REPORT.md` - Full analysis
- Official documentation for libraries
- Code examples in `/src/app/api` for patterns

---

**Last Updated**: October 25, 2025

