import { 
  User, 
  StudentProfile, 
  LecturerProfile, 
  Course, 
  Enrollment, 
  AcademicRecord,
  Assignment, 
  Submission, 
  Fee,
  Announcement
} from '@prisma/client'

// Define custom types since Prisma doesn't export these enums
export type UserRole = 'STUDENT' | 'LECTURER' | 'ADMIN'
export type StudentStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED'
export type LecturerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type CourseStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
export type EnrollmentStatus = 'ENROLLED' | 'COMPLETED' | 'DROPPED' | 'FAILED'
export type AcademicRecordStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
export type SubmissionStatus = 'SUBMITTED' | 'GRADED' | 'LATE'
export type TargetAudience = 'ALL' | 'STUDENT' | 'LECTURER' | 'ADMIN'

// Types are already exported above, no need to re-export

export interface UserWithProfile extends User {
  studentProfile?: StudentProfile | null
  lecturerProfile?: LecturerProfile | null
}

export interface CourseWithDetails extends Course {
  lecturer: User & {
    lecturerProfile?: LecturerProfile | null
  }
  enrollments: (Enrollment & {
    student: User & {
      studentProfile?: StudentProfile | null
    }
  })[]
  _count: {
    enrollments: number
  }
}

export interface StudentWithCourses extends User {
  studentProfile?: StudentProfile | null
  enrollments: (Enrollment & {
    course: Course & {
      lecturer: User & {
        lecturerProfile?: LecturerProfile | null
      }
    }
  })[]
}

export interface LecturerWithCourses extends User {
  lecturerProfile?: LecturerProfile | null
  taughtCourses: Course[]
}

export interface AssignmentWithDetails extends Assignment {
  course: Course
  submissions: (Submission & {
    student: User & {
      studentProfile?: StudentProfile | null
    }
  })[]
  _count: {
    submissions: number
  }
}

export interface AcademicRecordWithDetails extends AcademicRecord {
  student: User & {
    studentProfile?: StudentProfile | null
  }
  course: Course
}

export interface SubmissionWithDetails extends Submission {
  assignment: Assignment
  student: User & {
    studentProfile?: StudentProfile | null
  }
}

export interface FeeWithDetails extends Fee {
  student: User & {
    studentProfile?: StudentProfile | null
  }
}

export interface AnnouncementWithDetails extends Announcement {
  author: User
}

// Course registration types
export interface CourseWithEnrollment extends Course {
  lecturer: User & {
    lecturerProfile?: LecturerProfile | null
  }
  isEnrolled: boolean
  enrollmentId: string | null
  enrollmentStatus: string | null
}

export interface EnrollmentWithDetails extends Enrollment {
  course: Course & {
    lecturer: User & {
      lecturerProfile?: LecturerProfile | null
    }
  }
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  name: string
}

export interface StudentProfileFormData {
  studentId: string
  dateOfBirth: string
  address?: string
  phone?: string
  program: string
  yearOfStudy: number
}

export interface LecturerProfileFormData {
  staffId: string
  department: string
  office?: string
  specialization?: string
}

export interface CourseFormData {
  code: string
  title: string
  description?: string
  credits: number
  semester: string
  academicYear: string
  lecturerId: string
}

export interface AssignmentFormData {
  title: string
  description?: string
  dueDate: string
  maxPoints: number
  courseId: string
  fileUrl?: string
}

export interface SubmissionFormData {
  assignmentId: string
  content?: string
  fileUrl?: string
}

export interface AcademicRecordFormData {
  studentId: string
  courseId: string
  semester: string
  academicYear: string
  grade?: string
  points?: number
  gpa?: number
  status: AcademicRecordStatus
}

export interface FeeFormData {
  studentId: string
  amount: number
  description: string
  dueDate: string
  isPaid?: boolean
  paymentDate?: string
  paymentMethod?: string
  reference?: string
}

export interface AnnouncementFormData {
  title: string
  content: string
  targetAudience: TargetAudience
  isPublished?: boolean
  publishedAt?: string
  expiresAt?: string
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Dashboard data types
export interface DashboardStats {
  totalStudents: number
  totalLecturers: number
  totalCourses: number
  totalAdmins: number
  recentEnrollments: number
  upcomingAssignments: number
  pendingSubmissions: number
  unpaidFees: number
}

export interface StudentDashboardData {
  enrolledCourses: CourseWithDetails[]
  academicRecords: AcademicRecordWithDetails[]
  upcomingAssignments: AssignmentWithDetails[]
  recentSubmissions: SubmissionWithDetails[]
  fees: FeeWithDetails[]
  announcements: AnnouncementWithDetails[]
}

export interface LecturerDashboardData {
  taughtCourses: CourseWithDetails[]
  recentSubmissions: SubmissionWithDetails[]
  pendingSubmissions: SubmissionWithDetails[]
  academicRecords: AcademicRecordWithDetails[]
  announcements: AnnouncementWithDetails[]
}

export interface AdminDashboardData {
  stats: DashboardStats
  recentEnrollments: Enrollment[]
  recentAnnouncements: AnnouncementWithDetails[]
  systemAlerts: any[]
  feeSummary: {
    totalFees: number
    paidFees: number
    unpaidFees: number
  }
}
