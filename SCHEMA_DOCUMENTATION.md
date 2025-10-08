# Database Schema Documentation

## Overview

This document provides comprehensive documentation for the School Portal database schema. The schema is designed to support a tertiary institution management system with three main user types: Students, Lecturers, and Administrators.

## Database Models

### 🔐 Authentication Models

#### Account
- **Purpose**: Stores OAuth provider account information
- **Key Fields**: `provider`, `providerAccountId`, `access_token`, `refresh_token`
- **Relationships**: Belongs to User (1:many)

#### Session
- **Purpose**: Manages user sessions for NextAuth.js
- **Key Fields**: `sessionToken`, `userId`, `expires`
- **Relationships**: Belongs to User (1:many)

#### VerificationToken
- **Purpose**: Handles email verification tokens
- **Key Fields**: `identifier`, `token`, `expires`
- **Constraints**: Unique combination of identifier and token

### 👤 Core User Model

#### User
- **Purpose**: Central user model with role-based access control
- **Key Fields**:
  - `email` (unique): User's email address
  - `passwordHash`: Hashed password for authentication
  - `name`: User's display name
  - `role`: UserRole enum (STUDENT, LECTURER, ADMIN)
  - `isActive`: Account status flag
  - `lastLoginAt`: Timestamp of last login
- **Relationships**:
  - Has one StudentProfile (1:1)
  - Has one LecturerProfile (1:1)
  - Has many Courses (as lecturer)
  - Has many Enrollments (as student)
  - Has many AcademicRecords (as student)
  - Has many Submissions (as student)
  - Has many Fees (as student)
  - Has many Announcements (as author)

### 🎓 Profile Models

#### StudentProfile
- **Purpose**: Extended information for student users
- **Key Fields**:
  - `studentId` (unique): Institution-assigned student ID
  - `dateOfBirth`: Student's birth date
  - `address`: Student's address
  - `phone`: Contact phone number
  - `program`: Academic program (e.g., "Computer Science")
  - `yearOfStudy`: Current year (1-4)
  - `gpa`: Current GPA
  - `status`: StudentStatus enum
  - `enrollmentDate`: When student enrolled
  - `graduationDate`: Expected/actual graduation date
- **Relationships**:
  - Belongs to User (1:1)
  - Has many Enrollments (1:many)
  - Has many AcademicRecords (1:many)
  - Has many Submissions (1:many)
  - Has many Fees (1:many)

#### LecturerProfile
- **Purpose**: Extended information for lecturer users
- **Key Fields**:
  - `staffId` (unique): Institution-assigned staff ID
  - `department`: Academic department
  - `office`: Office location
  - `specialization`: Area of expertise
  - `hireDate`: Employment start date
  - `status`: LecturerStatus enum
- **Relationships**:
  - Belongs to User (1:1)
  - Has many Courses (1:many)

### 📚 Academic Models

#### Course
- **Purpose**: Represents academic courses
- **Key Fields**:
  - `code` (unique): Course code (e.g., "CS101")
  - `title`: Course title
  - `description`: Course description
  - `credits`: Credit hours
  - `semester`: Academic semester
  - `academicYear`: Academic year
  - `status`: CourseStatus enum
- **Relationships**:
  - Belongs to User (lecturer) (many:1)
  - Has many Enrollments (1:many)
  - Has many AcademicRecords (1:many)
  - Has many Assignments (1:many)

### 📝 Enrollment & Academic Records

#### Enrollment
- **Purpose**: Student-course enrollment relationship
- **Key Fields**:
  - `enrollmentDate`: When student enrolled
  - `status`: EnrollmentStatus enum
- **Relationships**:
  - Belongs to User (student) (many:1)
  - Belongs to Course (many:1)
- **Constraints**: Unique combination of studentId and courseId

#### AcademicRecord
- **Purpose**: Academic transcript records
- **Key Fields**:
  - `semester`: Academic semester
  - `academicYear`: Academic year
  - `grade`: Letter grade (A, B, C, etc.)
  - `points`: Grade points
  - `gpa`: GPA for the record
  - `status`: AcademicRecordStatus enum
- **Relationships**:
  - Belongs to User (student) (many:1)
  - Belongs to Course (many:1)
- **Constraints**: Unique combination of studentId, courseId, semester, and academicYear

### 📋 Assignment & Submission Models

#### Assignment
- **Purpose**: Course assignments
- **Key Fields**:
  - `title`: Assignment title
  - `description`: Assignment description
  - `dueDate`: Submission deadline
  - `maxPoints`: Maximum possible points
  - `fileUrl`: Optional file attachment
- **Relationships**:
  - Belongs to Course (many:1)
  - Has many Submissions (1:many)

#### Submission
- **Purpose**: Student assignment submissions
- **Key Fields**:
  - `fileUrl`: Submitted file URL
  - `content`: Text content submission
  - `submittedAt`: Submission timestamp
  - `mark`: Assigned grade/mark
  - `feedback`: Instructor feedback
  - `status`: SubmissionStatus enum
- **Relationships**:
  - Belongs to Assignment (many:1)
  - Belongs to User (student) (many:1)
- **Constraints**: Unique combination of assignmentId and studentId

### 💰 Financial Models

#### Fee
- **Purpose**: Student fee management
- **Key Fields**:
  - `amount`: Fee amount (Decimal with 2 decimal places)
  - `description`: Fee description
  - `dueDate`: Payment due date
  - `isPaid`: Payment status
  - `paymentDate`: When payment was made
  - `paymentMethod`: How payment was made
  - `reference`: Payment reference number
- **Relationships**:
  - Belongs to User (student) (many:1)

### 📢 Communication Models

#### Announcement
- **Purpose**: System announcements and notifications
- **Key Fields**:
  - `title`: Announcement title
  - `content`: Announcement content
  - `targetAudience`: TargetAudience enum (ALL, STUDENT, LECTURER, ADMIN)
  - `isPublished`: Publication status
  - `publishedAt`: Publication timestamp
  - `expiresAt`: Expiration timestamp
- **Relationships**:
  - Belongs to User (author) (many:1)

## Enums

### UserRole
- `STUDENT`: Student user
- `LECTURER`: Lecturer/Instructor user
- `ADMIN`: Administrator user

### StudentStatus
- `ACTIVE`: Currently enrolled
- `INACTIVE`: Not currently enrolled
- `GRADUATED`: Has graduated
- `SUSPENDED`: Temporarily suspended
- `ON_LEAVE`: On academic leave

### LecturerStatus
- `ACTIVE`: Currently employed
- `INACTIVE`: Not currently employed
- `ON_LEAVE`: On leave
- `RETIRED`: Retired

### CourseStatus
- `ACTIVE`: Currently offered
- `INACTIVE`: Not currently offered
- `COMPLETED`: Course completed
- `CANCELLED`: Course cancelled

### EnrollmentStatus
- `ENROLLED`: Currently enrolled
- `DROPPED`: Dropped the course
- `COMPLETED`: Successfully completed
- `FAILED`: Failed the course
- `WITHDRAWN`: Withdrew from course

### AcademicRecordStatus
- `IN_PROGRESS`: Currently in progress
- `COMPLETED`: Successfully completed
- `FAILED`: Failed
- `INCOMPLETE`: Incomplete

### SubmissionStatus
- `SUBMITTED`: Submitted on time
- `GRADED`: Graded by instructor
- `LATE`: Submitted late
- `MISSING`: Not submitted

### TargetAudience
- `ALL`: All users
- `STUDENT`: Students only
- `LECTURER`: Lecturers only
- `ADMIN`: Administrators only

## Key Relationships

### 1:1 Relationships
- User ↔ StudentProfile
- User ↔ LecturerProfile

### 1:Many Relationships
- User → Account (authentication)
- User → Session (authentication)
- User → Course (as lecturer)
- User → Enrollment (as student)
- User → AcademicRecord (as student)
- User → Submission (as student)
- User → Fee (as student)
- User → Announcement (as author)
- Course → Assignment
- Assignment → Submission

### Many:Many Relationships
- User ↔ Course (through Enrollment)
- User ↔ Course (through AcademicRecord)

## Database Constraints

### Unique Constraints
- User.email
- StudentProfile.studentId
- LecturerProfile.staffId
- Course.code
- Enrollment(studentId, courseId)
- AcademicRecord(studentId, courseId, semester, academicYear)
- Submission(assignmentId, studentId)
- Account(provider, providerAccountId)
- Session.sessionToken
- VerificationToken(identifier, token)

### Foreign Key Constraints
- All foreign key relationships use `onDelete: Cascade` where appropriate
- User deletion cascades to all related profile and academic data

## Indexing Strategy

### Recommended Indexes
1. `User.email` - Primary lookup field
2. `StudentProfile.studentId` - Institution ID lookup
3. `LecturerProfile.staffId` - Institution ID lookup
4. `Course.code` - Course lookup
5. `Enrollment.studentId` - Student enrollment queries
6. `Enrollment.courseId` - Course enrollment queries
7. `AcademicRecord.studentId` - Student transcript queries
8. `Assignment.courseId` - Course assignment queries
9. `Submission.studentId` - Student submission queries
10. `Fee.studentId` - Student fee queries
11. `Announcement.targetAudience` - Filtered announcement queries

## Data Types

### String Fields
- IDs: `cuid()` for unique identifiers
- Email: Standard email format
- Names: Human-readable text
- Codes: Institution-specific formats

### DateTime Fields
- All timestamps use `DateTime` type
- `@default(now())` for creation timestamps
- `@updatedAt` for automatic update tracking

### Decimal Fields
- Fee amounts: `Decimal(10, 2)` for precise financial calculations

### Enum Fields
- All status and type fields use appropriate enums
- Provides type safety and consistent data

## Security Considerations

### Password Security
- Passwords are hashed using bcryptjs
- No plain text password storage

### Data Privacy
- Sensitive information (addresses, phone numbers) are optional
- Email verification required for account activation

### Access Control
- Role-based access control through User.role
- Profile data separated by user type

## Migration Strategy

### Initial Setup
1. Run `prisma generate` to create client
2. Run `prisma db push` to create tables
3. Run `prisma db seed` to populate sample data

### Schema Changes
1. Modify schema.prisma
2. Run `prisma db push` for development
3. Create migration with `prisma migrate dev` for production

## Sample Data

The seed file includes:
- 1 Admin user
- 2 Lecturer users with profiles
- 3 Student users with profiles
- 3 Courses
- 5 Enrollments
- 1 Academic record
- 2 Assignments
- 1 Submission
- 2 Fees (1 paid, 1 unpaid)
- 2 Announcements

## Performance Considerations

### Query Optimization
- Use `include` and `select` to limit data fetching
- Implement pagination for large datasets
- Use database indexes for frequently queried fields

### Caching Strategy
- Cache user profiles and course information
- Implement Redis for session management
- Use React Query for client-side caching

## Backup and Recovery

### Regular Backups
- Daily automated backups of production database
- Point-in-time recovery capability
- Test restore procedures regularly

### Data Export
- Export capabilities for academic records
- GDPR compliance for data deletion
- Audit trail for sensitive operations
