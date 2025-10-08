import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100
  
  if (percentage >= 90) return 'A+'
  if (percentage >= 85) return 'A'
  if (percentage >= 80) return 'A-'
  if (percentage >= 75) return 'B+'
  if (percentage >= 70) return 'B'
  if (percentage >= 65) return 'B-'
  if (percentage >= 60) return 'C+'
  if (percentage >= 55) return 'C'
  if (percentage >= 50) return 'C-'
  if (percentage >= 45) return 'D+'
  if (percentage >= 40) return 'D'
  return 'F'
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
    case 'A-':
      return 'text-green-600'
    case 'B+':
    case 'B':
    case 'B-':
      return 'text-blue-600'
    case 'C+':
    case 'C':
    case 'C-':
      return 'text-yellow-600'
    case 'D+':
    case 'D':
      return 'text-orange-600'
    case 'F':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export function generateStudentId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `STU${year}${random}`
}

export function generateEmployeeId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `EMP${year}${random}`
}

export function generateCourseCode(courseName: string): string {
  const words = courseName.split(' ')
  const initials = words.map(word => word.charAt(0).toUpperCase()).join('')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${initials}${random}`
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
