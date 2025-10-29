# 🎬 Demo Video - Login Credentials

**Date**: October 29, 2025  
**Status**: ✅ **READY FOR DEMO**

---

## 🔐 Login Credentials

**⚠️ IMPORTANT**: If login fails, verify accounts exist in Railway database.

**📊 To Check Credentials in Railway:**
1. Go to your Railway project → Postgres service → Database tab
2. Click on "Data" tab (if not already selected)
3. Click on the "+ Query" or "Query" button (or use Railway's SQL editor)
4. Copy and paste the SQL queries from `check-railway-credentials.sql`
5. Run the queries to see all users and their status
6. If accounts are missing, run `npm run db:seed` locally (if you can connect) or use Railway's console

### **Admin Account**
- **Email**: `admin@school.edu`
- **Password**: `admin123`
- **Role**: Administrator
- **Login Method**: Email only
- **Access**: Full system access, user management, application approval, system settings

---

### **Lecturer Account**
- **Email**: `lecturer@school.edu`
- **Password**: `lecturer123`
- **Staff ID**: `LEC001`
- **Role**: Lecturer
- **Login Method**: Email only
- **Access**: Course management, grade entry, assignment creation, attendance tracking

---

### **Student Account**
- **Email**: `student@school.edu`
- **OR Student ID**: `STU2024001`
- **Password**: `student123`
- **Role**: Student
- **Login Method**: Email OR Student ID (both work)
- **Note**: Students can login with either email or student ID in the email field
- **Access**: Course registration, view grades, submit assignments, view attendance

---

## 📱 Live Application URL

**Production**: https://school-portal-c2rdketih-clementarthur753-1864s-projects.vercel.app

---

## 🎥 Demo Video Script Outline

### **Introduction (30 seconds)**
- Welcome to SchoolPortal
- Overview of the university management system
- Three main user roles: Admin, Lecturer, Student

---

### **Section 1: Admin Features (5-7 minutes)**

1. **Login** (30s)
   - Login with admin credentials
   - Dashboard overview

2. **Application Management** (2 min)
   - View pending applications
   - Review application details (all fields)
   - Approve application → Generate student ID
   - Send acceptance letter
   - Send login credentials

3. **User Management** (1.5 min)
   - View all users (mobile-responsive table)
   - Create new user
   - Edit user details
   - Activate/Deactivate users
   - Bulk operations
   - Export to CSV

4. **Fee Management** (1 min)
   - Create fees for students
   - View payment records (mobile-responsive)
   - Financial summary

5. **Course Management** (1 min)
   - Create courses
   - Assign lecturers
   - View all courses

6. **Analytics Dashboard** (1 min)
   - View statistics
   - Export reports

7. **Settings** (30s)
   - System settings
   - Toggle registration open/closed
   - Maintenance mode

---

### **Section 2: Lecturer Features (3-4 minutes)**

1. **Login** (30s)
   - Login with lecturer credentials
   - Dashboard overview

2. **Course Management** (1 min)
   - View assigned courses
   - View enrolled students

3. **Grade Management** (1 min)
   - Enter grades
   - View grade history
   - Mobile-responsive interface

4. **Assignment Management** (1 min)
   - Create assignments
   - View submissions
   - Grade assignments

5. **Attendance Tracking** (30s)
   - Mark attendance
   - View attendance reports

---

### **Section 3: Student Features (3-4 minutes)**

1. **Login** (30s)
   - Login with student credentials
   - Dashboard overview

2. **Course Registration** (1 min)
   - Register for courses
   - View registered courses

3. **Academic Records** (1 min)
   - View grades
   - View transcript
   - Download transcript PDF

4. **Assignments** (1 min)
   - View assignments
   - Submit assignments
   - View submission status

5. **Attendance** (30s)
   - View attendance records

6. **Finances** (30s)
   - View fee status
   - View payment history
   - Download receipts

---

### **Section 4: Application Process (2-3 minutes)**

1. **New Student Application** (1.5 min)
   - Navigate to application page
   - Fill out application form
   - Upload documents
   - Submit application
   - Receive confirmation email

2. **Track Application Status** (1 min)
   - Check application status
   - View application number
   - View admin notes

---

### **Section 5: Mobile Responsiveness (1 minute)**
- Show mobile view of admin users table
- Show mobile view of finances table
- Demonstrate touch interactions
- Show responsive navigation

---

### **Conclusion (30 seconds)**
- Summary of features
- Thank you

---

## 🎯 Key Features to Highlight

✅ **Mobile-First Design**: Fully responsive, works on all devices  
✅ **Real-Time Updates**: Toast notifications for all actions  
✅ **Data Export**: CSV export for all admin pages  
✅ **PDF Generation**: Transcripts, receipts, reports  
✅ **Email Integration**: Automated emails for applications, approvals, credentials  
✅ **Role-Based Access**: Secure, role-based permissions  
✅ **Comprehensive Analytics**: Dashboard with charts and statistics  
✅ **File Management**: Document upload and storage  

---

## 📝 Notes for Recording

1. **Use Chrome/Safari** for best recording quality
2. **Window Size**: Use 1920x1080 for video
3. **Show Mobile View**: Resize browser to mobile width (375px) for responsive demo
4. **Highlight Toast Notifications**: Pause to show toast messages
5. **Show Loading States**: Let pages load fully before proceeding
6. **Demonstrate CSV Export**: Show downloaded file
7. **Show PDF Downloads**: Open downloaded PDFs
8. **Test All Roles**: Show complete workflow for each role

---

## 🔒 Security Note

These are demo credentials. **DO NOT** use these credentials in production without:
- Changing all passwords
- Setting up proper authentication
- Configuring environment variables
- Setting up AWS S3 for file storage
- Configuring email service (Resend)

---

**Ready for Demo Recording!** 🚀

