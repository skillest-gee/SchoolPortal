import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Custom error classes
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  
  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429)
  }
}

// Error response interface
export interface ErrorResponse {
  success: false
  error: string
  message: string
  statusCode: number
  timestamp: string
  path?: string
  details?: any
}

// Parse API error from response
export function parseApiError(error: any): {
  message: string
  statusCode: number
  details?: any
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      details: error.isOperational ? undefined : 'Internal server error'
    }
  }
  
  if (error instanceof ZodError) {
    return {
      message: 'Validation failed',
      statusCode: 400,
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    }
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  }
  
  return {
    message: 'An unexpected error occurred',
    statusCode: 500,
    details: process.env.NODE_ENV === 'development' ? error : undefined
  }
}

// Get user-friendly error message
export function getUserFriendlyMessage(error: any): string {
  const parsed = parseApiError(error)
  
  // Map technical errors to user-friendly messages
  const friendlyMessages: Record<string, string> = {
    'Validation failed': 'Please check your input and try again',
    'Authentication required': 'Please log in to continue',
    'Insufficient permissions': 'You do not have permission to perform this action',
    'Resource not found': 'The requested item could not be found',
    'Resource already exists': 'This item already exists',
    'Rate limit exceeded': 'Too many requests. Please try again later',
    'Database connection failed': 'Service temporarily unavailable. Please try again later',
    'File upload failed': 'Failed to upload file. Please try again',
    'Email sending failed': 'Failed to send email. Please try again later'
  }
  
  return friendlyMessages[parsed.message] || parsed.message
}

// Create error response
export function createErrorResponse(
  error: any,
  path?: string
): NextResponse<ErrorResponse> {
  const parsed = parseApiError(error)
  const userMessage = getUserFriendlyMessage(error)
  
  const errorResponse: ErrorResponse = {
    success: false,
    error: parsed.message,
    message: userMessage,
    statusCode: parsed.statusCode,
    timestamp: new Date().toISOString(),
    path,
    details: parsed.details
  }
  
  return NextResponse.json(errorResponse, { status: parsed.statusCode })
}

// Global error handler
export function handleError(error: any, path?: string): NextResponse<ErrorResponse> {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path,
    timestamp: new Date().toISOString()
  })
  
  return createErrorResponse(error, path)
}

// Async error wrapper
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      throw error
    }
  }
}

// Database error handler
export function handleDatabaseError(error: any): AppError {
  if (error.code === 'P2002') {
    return new ConflictError('A record with this information already exists')
  }
  
  if (error.code === 'P2025') {
    return new NotFoundError('Record not found')
  }
  
  if (error.code === 'P2003') {
    return new ValidationError('Invalid reference to related record')
  }
  
  if (error.code === 'P2014') {
    return new ValidationError('Invalid relation between records')
  }
  
  return new AppError('Database operation failed', 500)
}

// Validation error handler
export function handleValidationError(error: ZodError): ValidationError {
  const messages = error.errors.map(err => 
    `${err.path.join('.')}: ${err.message}`
  ).join(', ')
  
  return new ValidationError(messages)
}

// File upload error handler
export function handleFileUploadError(error: any): AppError {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File size too large')
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError('Too many files uploaded')
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file field')
  }
  
  return new AppError('File upload failed', 500)
}

// Network error handler
export function handleNetworkError(error: any): AppError {
  if (error.code === 'ECONNREFUSED') {
    return new AppError('Service unavailable', 503)
  }
  
  if (error.code === 'ETIMEDOUT') {
    return new AppError('Request timeout', 408)
  }
  
  return new AppError('Network error', 500)
}

// Log error for monitoring
export function logError(error: any, context?: any): void {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  }
  
  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Send to monitoring service (e.g., Sentry, DataDog, etc.)
    console.error('Production error:', errorLog)
  } else {
    console.error('Development error:', errorLog)
  }
}

// Error boundary for React components
export function createErrorBoundary() {
  return {
    onError: (error: Error, errorInfo: any) => {
      logError(error, errorInfo)
    }
  }
}