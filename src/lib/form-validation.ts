/**
 * Form validation utilities
 */

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (supports various formats)
 */
export function validatePhone(phone: string): boolean {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  // Check if it's all digits and has reasonable length (7-15 digits)
  return /^\d{7,15}$/.test(cleaned)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate student ID format (STUYYYYXXX)
 */
export function validateStudentId(studentId: string): boolean {
  const regex = /^STU\d{4}\d{3,4}$/
  return regex.test(studentId)
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} cannot be empty`
  }
  return null
}

/**
 * Validate number range
 */
export function validateNumberRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): string | null {
  if (value < min || value > max) {
    return `${fieldName} must be between ${min} and ${max}`
  }
  return null
}

/**
 * Validate date is in the past (e.g., for date of birth)
 */
export function validatePastDate(date: Date, fieldName: string): string | null {
  if (date > new Date()) {
    return `${fieldName} must be in the past`
  }
  return null
}

/**
 * Validate date is in the future (e.g., for deadlines)
 */
export function validateFutureDate(date: Date, fieldName: string): string | null {
  if (date < new Date()) {
    return `${fieldName} must be in the future`
  }
  return null
}

/**
 * Real-time validation helper
 */
export function validateOnChange<T>(
  value: T,
  validators: Array<(val: T) => string | null>
): string | null {
  for (const validator of validators) {
    const error = validator(value)
    if (error) return error
  }
  return null
}

