import { z } from 'zod'
import { isValidEmail, isValidPhoneNumber, isValidIndexNumber } from './security'

// Common validation schemas
export const emailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email is too long')

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character')

export const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number is too long')
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')

export const studentIdSchema = z.string()
  .min(1, 'Student ID is required')
  .max(20, 'Student ID is too long')
  .regex(/^STU\d{4}\d{3}$/, 'Invalid student ID format (e.g., STU2024001)')

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters')

// User registration validation
export const userRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
  studentId: z.string().optional(),
  staffId: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => {
  if (data.role === 'STUDENT' && !data.studentId) {
    return false
  }
  if (data.role === 'LECTURER' && !data.staffId) {
    return false
  }
  return true
}, {
  message: "Student ID is required for students, Staff ID is required for lecturers",
  path: ["studentId"]
})

// Student profile validation
export const studentProfileSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  firstName: nameSchema,
  middleName: z.string().max(100).optional(),
  lastName: nameSchema,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  programme: z.string().min(1, 'Programme is required'),
  level: z.string().min(1, 'Level is required'),
  yearOfStudy: z.number().min(1).max(10),
  phone: phoneSchema,
  address: z.string().min(1, 'Address is required').max(500),
  emergencyContactName: nameSchema,
  emergencyContactPhone: phoneSchema,
  emergencyContactRelationship: z.string().min(1, 'Relationship is required')
})

// Lecturer profile validation
export const lecturerProfileSchema = z.object({
  staffId: z.string().min(1, 'Staff ID is required'),
  department: z.string().min(1, 'Department is required'),
  office: z.string().max(100).optional(),
  specialization: z.string().max(200).optional()
})

// Course validation
export const courseSchema = z.object({
  code: z.string()
    .min(1, 'Course code is required')
    .max(20, 'Course code is too long')
    .regex(/^[A-Z]{2,4}\d{3}$/, 'Invalid course code format'),
  title: z.string()
    .min(1, 'Course title is required')
    .max(200, 'Course title is too long'),
  description: z.string().max(1000).optional(),
  credits: z.number().min(1).max(10),
  department: z.string().min(1, 'Department is required'),
  level: z.string().min(1, 'Level is required'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  lecturerId: z.string().min(1, 'Lecturer is required')
})

// Assignment validation
export const assignmentSchema = z.object({
  title: z.string()
    .min(1, 'Assignment title is required')
    .max(200, 'Title is too long'),
  description: z.string().max(2000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, 'Invalid date format'),
  maxPoints: z.number().min(1).max(1000),
  courseId: z.string().min(1, 'Course is required'),
  fileUrl: z.string().url().optional()
})

// Submission validation
export const submissionSchema = z.object({
  assignmentId: z.string().min(1, 'Assignment is required'),
  content: z.string().max(5000).optional(),
  fileUrl: z.string().url().optional()
}).refine((data) => data.content || data.fileUrl, {
  message: "Either content or file is required",
  path: ["content"]
})

// Academic record validation
export const academicRecordSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  courseId: z.string().min(1, 'Course is required'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  grade: z.string().regex(/^[A-F][+-]?$/, 'Invalid grade format').optional(),
  points: z.number().min(0).max(4).optional(),
  gpa: z.number().min(0).max(4).optional(),
  status: z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED'])
})

// Fee validation
export const feeSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(200),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  isPaid: z.boolean().optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional()
})

// Message validation
export const messageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  subject: z.string().min(1, 'Subject is required').max(200),
  content: z.string().min(1, 'Message content is required').max(5000)
})

// Announcement validation
export const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(2000),
  targetAudience: z.enum(['ALL', 'STUDENT', 'LECTURER', 'ADMIN']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  isActive: z.boolean().optional()
})

// Quiz validation
export const quizSchema = z.object({
  title: z.string().min(1, 'Quiz title is required').max(200),
  description: z.string().max(1000).optional(),
  courseId: z.string().min(1, 'Course is required'),
  timeLimit: z.number().min(1).max(300).optional(), // 5 minutes to 5 hours
  maxAttempts: z.number().min(1).max(10).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).optional()
})

// Quiz question validation
export const quizQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required').max(1000),
  questionType: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
  options: z.string().optional(), // JSON string for multiple choice options
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  points: z.number().min(1).max(100),
  order: z.number().min(0)
})

// Attendance validation
export const attendanceSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  courseId: z.string().min(1, 'Course is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
  notes: z.string().max(500).optional()
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(['IMAGE', 'DOCUMENT', 'ASSIGNMENT', 'CERTIFICATE']),
  maxSize: z.number().min(1).max(50 * 1024 * 1024), // 50MB max
  allowedTypes: z.array(z.string()).min(1)
})

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100),
  type: z.enum(['COURSES', 'STUDENTS', 'LECTURERS', 'ASSIGNMENTS', 'ALL']).optional(),
  limit: z.number().min(1).max(100).optional()
})

// Pagination validation
export const paginationSchema = z.object({
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
})

// Generic validation helper
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Validation failed']
    }
  }
}

// Sanitize input data
export function sanitizeInput<T>(data: T): T {
  if (typeof data === 'string') {
    return data.trim().replace(/[<>]/g, '') as T
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {} as T
    for (const [key, value] of Object.entries(data)) {
      sanitized[key as keyof T] = sanitizeInput(value)
    }
    return sanitized
  }
  
  return data
}
