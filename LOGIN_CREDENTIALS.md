# 🔐 Login Credentials

**Date**: October 25, 2025  
**For**: School Portal Testing

---

## 👥 Default Test Accounts

### **Admin Account** 👨‍💼
```
Email: admin@school.edu
Password: admin123
Role: ADMIN
```

**Access**:
- ✅ Full system administration
- ✅ User management
- ✅ Application review
- ✅ System settings
- ✅ All features

---

### **Lecturer Account** 👨‍🏫
```
Email: lecturer@school.edu
Password: lecturer123
Role: LECTURER
Name: Dr. John Smith
```

**Access**:
- ✅ Dashboard
- ✅ Course management
- ✅ Create assignments
- ✅ Grade students
- ✅ View submissions
- ✅ Track attendance
- ✅ Messaging

---

### **Student Account** 👨‍🎓
```
Student ID: STU2024001
OR
Email: student@school.edu
Password: student123
Role: STUDENT
```

**Access**:
- ✅ Dashboard
- ✅ View courses
- ✅ Submit assignments
- ✅ View grades
- ✅ Check attendance
- ✅ Financial records
- ✅ Transcript
- ✅ Messaging

---

## 📋 How to Login

### **Option 1: Using Email**
1. Go to login page
2. Enter email address
3. Enter password
4. Click "Sign in"

### **Option 2: Using Student ID** (Students only)
1. Go to login page
2. Enter Student ID (e.g., STU2024001)
3. Enter password
4. Click "Sign in"

---

## 🌐 Application URL

**Production**: https://school-portal-ivemnwmi2-clementarthur753-1864s-projects.vercel.app

**Local**: http://localhost:3000

---

## 🔑 Creating New Users

### **Admin Creates Users**:
1. Login as admin
2. Go to "Users" in sidebar
3. Click "Add User"
4. Fill in user details
5. Set role (ADMIN/LECTURER/STUDENT)
6. System generates password
7. Send credentials via email

### **Students Apply**:
1. Go to `/auth/apply`
2. Fill application form
3. Submit documents
4. Wait for admin approval
5. Receive acceptance email with credentials

---

## ⚠️ Security Note

**These are test credentials!**

**For Production**:
- ✅ Change all default passwords
- ✅ Use strong passwords
- ✅ Enable MFA (if implemented)
- ✅ Regular password rotation
- ✅ Never share credentials

---

## 🚀 Quick Start

1. **Login as Admin**:
   ```
   Email: admin@school.edu
   Password: admin123
   ```

2. **Login as Lecturer**:
   ```
   Email: lecturer@school.edu
   Password: lecturer123
   ```

3. **Login as Student**:
   ```
   Student ID: STU2024001
   OR
   Email: student@school.edu
   Password: student123
   ```

---

## 📝 Note

After running database seed, these accounts will be available.

To seed database:
```bash
npx prisma db seed
```

---

**Status**: ✅ Ready to Use  
**Last Updated**: October 25, 2025

