# 🎓 School Portal - Complete University Management System

A comprehensive, production-ready university portal built with modern web technologies for managing students, lecturers, and administrative tasks.

---

## 🚀 Live Application

**Production URL**: https://school-portal-ivemnwmi2-clementarthur753-1864роек.vercel.app

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: [Next.js 14](https://nextjs.org/) - React framework with SSR
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **UI Library**: [React](https://react.dev/) - Component-based UI
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **UI Components**: [Radix UI](https://www.radix-ui.com/) - Accessible primitives
- **Icons**: [Lucide React](https://lucide.dev/) - Modern icon library
- **Forms**: [React Hook Form](https://react-hook-form.com/) - Form validation
- **State Management**: [TanStack Query](https://tanstack.com/query) - Server state
- **Animations**: [Tailwind Animate](https://www.tailwindcss-animate.com/) - Smooth animations

### **Backend**
- **API Routes**: [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Serverless functions
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) - Secure authentication
- **Session Management**: JWT-based sessions
- **Validation**: [Zod](https://zod.dev/) - Schema validation
- **Password Hashing**: [Bcryptjs](https://www.npmjs.com/package/bcryptjs) - Secure password storage

### **Database**
- **ORM**: [Prisma](https://www.prisma.io/) - Type-safe database client
- **Database**: [PostgreSQL](https://www.postgresql.org/) - Relational database
- **Hosting**: [Railway](https://railway.app/) - Database hosting
- **Migrations**: Prisma Migrate - Version control for database

### **File Storage**
- **Cloud Storage**: [AWS S3](https://aws.amazon.com/s3/) - Scalable file storage
- **SDK**: AWS SDK v3 - Official AWS SDK

### **Email Service**
- **Provider**: [Resend](https://resend.com/) - Modern email API
- **Templates**: HTML email templates
- **Delivery**: Transactional emails

### **Deployment**
- **Hosting**: [Vercel](https://vercel.com/) - Serverless hosting
- **CI/CD**: Automatic deployments from GitHub
- **Environment**: Production-ready configuration

### **Development Tools**
- **Package Manager**: npm
- **Build Tool**: Next.js built-in bundler
- **Code Quality**: ESLint
- **Type Checking**: TypeScript

---

## 📦 Key Features

### **🔐 Authentication & Authorization**
- Role-based access control (Admin, Lecturer, Student)
- Secure JWT-based sessions
- Email/Password login
- Student ID login
- Password reset functionality
- Session management with 4-hour timeout

### **👨‍🎓 Student Portal**
- **Dashboard**: Statistics, announcements, quick actions
- **Courses**: View enrolled courses and details
- **Assignments**: Submit assignments with file uploads
- **Grades**: View grades and GPA
- **Transcript**: Download official academic transcript
- **Attendance**: Track attendance records
- **Calendar**: Academic calendar with events
- **Finances**: View fees and payment history
- **Profile**: Manage personal information
- **Messages**: Communication with lecturers
- **Course Registration**: Enroll in courses

### **👨‍🏫 Lecturer Portal**
- **Dashboard**: Teaching statistics and overview
- **Courses**: Create and manage courses
- **Assignments**: Create assignments with deadlines
- **Grading**: Grade submissions with feedback
- **Grades**: Manage student grades
- **Students**: View enrolled students
- **Attendance**: Mark and track attendance
- **Profile**: Update professional information
- **Messages**: Communication with students

### **👨‍💼 Admin Portal**
- **Dashboard**: System overview and statistics
- **Applications**: Review and approve student applications
- **Users**: Manage users and permissions
- **Fees**: Configure and manage fees
- **Settings**: System configuration
- **Academic Calendar**: Manage academic events
- **Credentials**: Send login credentials
- **Announcements**: Create university-wide announcements

### **📧 Email Notifications**
- Application confirmation
- Acceptance letters with student ID
- Rejection notifications
- Payment confirmations
- Grade updates
- Assignment deadlines

### **💰 Financial Management**
- Automatic fee generation on approval
- Payment tracking
- Fee history
- Outstanding balance display
- Manual payment recording

### **📝 Application System**
- Complete online application form
- Document upload
- Status tracking
- Admin review workflow
- Automatic student creation
- Email notifications

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ installed
- npm or yarn
- PostgreSQL database
- AWS account (for S3)
- Resend account (for emails)

### **Installation**

1. **Clone the repository**:
```bash
git clone https://github.com/skillest-gee/SchoolPortal.git
cd SchoolPortal
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp env.example .env
```

4. **Configure `.env` file**:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/school_portal"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Email (Resend)
RESEND_API_KEY="your_resend_api_key"
FROM_EMAIL="noreply@yourdomain.com"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your_access_key"
AWS_SECRET_ACCESS_KEY="your_secret_key"
AWS_S3_BUCKET_NAME="your_bucket_name"
```

5. **Set up the database**:
```bash
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

6. **Run the development server**:
```bash
npm run dev
```

7. **Open your browser**:
```
http://localhost:3000
```

---

## 🔐 Test Credentials

### **Admin**
- Email: `admin@school.edu`
- Password: `admin123`

### **Lecturer**
- Email: `lecturer@school.edu`
- Password: `lecturer123`

### **Student**
- Student ID: `STU2024001` OR Email: `student@school.edu`
- Password: `student123`

---

## 📁 Project Structure

```
SchoolPortal/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   │   ├── admin/          # Admin portal
│   │   │   ├── lecturer/       # Lecturer portal
│   │   │   └── student/        # Student portal
│   │   ├── api/                # API routes
│   │   │   ├── applications/   # Application APIs
│   │   │   ├── auth/           # Authentication APIs
│   │   │   ├── students/       # Student APIs
│   │   │   ├── lecturer/       # Lecturer APIs
│   │   │   └── admin/          # Admin APIs
│   │   └── application-status/ # Public status page
│   ├── components/             # React components
│   │   └── ui/                 # UI components
│   ├── lib/                    # Utility functions
│   │   ├── auth.ts             # Authentication config
│   │   ├── prisma.ts           # Database client
│   │   ├── email-service.ts    # Email functions
│   │   └── validation.ts       # Schema validation
│   └── types/                  # TypeScript types
├── prisma/                     # Database
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed script
├── public/                     # Static assets
└── package.json                # Dependencies
```

---

## 🔧 Available Scripts

### **Development**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### **Database**
```bash
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio
```

---

## 📊 Database Schema

### **Core Models**
- **User**: Authentication and user data
- **StudentProfile**: Student-specific information
- **Course**: Course catalog
- **Enrollment**: Student-course relationships
- **Assignment**: Course assignments
- **Submission**: Student submissions
- **AcademicRecord**: Grades and records
- **Fee**: Fee management
- **Payment**: Payment tracking
- **Attendance**: Attendance records
- **Application**: Student applications
- **Message**: Messaging system
- **Notification**: System notifications

---

## 🔒 Security Features

- ✅ Secure password hashing (bcrypt)
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Session timeout (4 hours)
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Environment variable security
- ✅ Protected API routes
- ✅ Secure file uploads

---

## 📧 Email Integration

### **Email Types**
- Application confirmations
- Acceptance letters
- Rejection notifications
- Payment receipts
- Grade notifications
- Password reset emails

### **Email Service**: Resend
- Modern email API
- HTML templates
- Professional design
- Delivery tracking

---

## 💾 File Storage

### **Storage Provider**: AWS S3
- Scalable cloud storage
- Secure file access
- Signed URLs for downloads
- File type validation
- Size limits enforced

### **File Types Supported**
- Documents: PDF, DOC, DOCX, TXT
- Images: JPG, PNG, GIF
- Application documents

---

## 🌐 Deployment

### **Vercel Deployment**
1. Push code to GitHub
2. Connect to Vercel
3. Configure environment variables
4. Deploy automatically

### **Database on Railway**
1. Create PostgreSQL database
2. Get connection string
3. Add to environment variables
4. Run migrations

---

## 📱 Features by Role

### **Students Can**:
- ✅ Apply for admission
- ✅ Track application status
- ✅ View courses and enroll
- ✅ Submit assignments
- ✅ View grades and GPA
- ✅ Download transcripts
- ✅ Track attendance
- ✅ View fees and pay
- ✅ Message lecturers
- ✅ Update profile

### **Lecturers Can**:
- ✅ Create and manage courses
- ✅ Create assignments
- ✅ Grade submissions
- ✅ Track attendance
- ✅ View student profiles
- ✅ Send messages
- ✅ Update profile

### **Admins Can**:
- ✅ Review applications
- ✅ Approve/reject students
- ✅ Manage all users
- ✅ Configure system
- ✅ Manage fees
- ✅ Track payments
- ✅ Send credentials
- ✅ Create announcements

---

## 🎯 Key Workflows

### **Student Application Flow**
1. Student submits application → 2. Receives confirmation email → 3. Admin reviews → 4. Admin approves → 5. Fees generated → 6. Acceptance email sent → 7. Student logs in → 8. Student pays fees

### **Assignment Flow**
1. Lecturer creates assignment → 2. Students notified → 3. Students submit → 4. Lecturer grades → 5. Students see grades

### **Grading Flow**
1. Lecturer enters grades → 2. Grades saved → 3. GPA calculated → 4. Students view → 5. Transcript updated

---

## 🛡️ Security Measures

1. **Authentication**: Secure JWT tokens
2. **Authorization**: Role-based access control
3. **Input Validation**: Zod schemas
4. **Password Security**: Bcrypt hashing
5. **Session Security**: Timeout and refresh
6. **API Security**: Protected routes
7. **File Security**: Secure uploads
8. **Environment Security**: Protected secrets

---

## 📊 System Requirements

### **Minimum Requirements**
- Node.js: 18+
- PostgreSQL: 15+
- Storage: AWS S3 bucket
- Email: Resend account

### **Recommended**
- Vercel hosting
- Railway database
- 512MB RAM
- CDN for assets

---

## 🐛 Troubleshooting

### **Database Connection Issues**
```bash
# Check database connection
npm run db:studio

# Verify migrations
npx prisma migrate status
```

### **Build Errors**
```bash
# Clean build
rm -rf .next
npm run build
```

### **Environment Variables**
```bash
# Check if .env exists
ls -la .env

# Verify variables are loaded
npm run dev
```

---

## 📝 Documentation

- [Application Process Guide](./APPLICATION_PROCESS_COMPLETE.md)
- [Student Payment Workflow](./STUDENT_PAYMENT_WORKFLOW.md)
- [Login Credentials](./LOGIN_CREDENTIALS.md)
- [Security Setup](./SECURITY_SETUP_GUIDE.md)
- [S3 Setup](./S3_SETUP.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is proprietary and confidential.

---

## 👨‍💻 Author

**Clement Arthur**  
GitHub: [skillest-gee](https://github.com/skillest-gee)

---

## 🎉 Features Summary

### **Complete Features**
- ✅ Authentication & Authorization
- ✅ User Management (Admin, Lecturer, Student)
- ✅ Application System
- ✅ Course Management
- ✅ Assignment System
- ✅ Grading System
- ✅ Attendance Tracking
- ✅ Financial Management
- ✅ Messaging System
- ✅ Email Notifications
- ✅ File Upload System
- ✅ Transcript Generation
- ✅ System Settings
- ✅ Academic Calendar

### **38+ Functional Pages**
- ✅ 14 Student pages
- ✅ 12 Lecturer pages
- ✅ 12+ Admin pages

### **Production Ready**
- ✅ Deployed on Vercel
- ✅ Database on Railway
- ✅ S3 file storage
- ✅ Email integration
- ✅ Security implemented
- ✅ Error handling
- ✅ Logging
- ✅ Responsive design

---

## 🚀 Quick Links

- **Live App**: https://school-portal-ivemnwmi2-clementarthur753-1864s-projects.vercel.app
- **GitHub**: https://github.com/skillest-gee/SchoolPortal
- **Login**: Use test credentials above

---

## ✅ Status

**Production Ready**: ✅ YES  
**All Features Working**: ✅ YES  
**Security**: ✅ IMPLEMENTED  
**Deployment**: ✅ LIVE

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**
