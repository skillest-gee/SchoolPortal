import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// Security configuration
export const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SYMBOLS: true,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MFA_ISSUER: 'SchoolPortal',
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`)
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_SYMBOLS && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Enhanced password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Password verification
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate MFA secret
export function generateMFASecret(): string {
  return crypto.randomBytes(20).toString('hex')
}

// Generate TOTP code
export function generateTOTPCode(secret: string): string {
  const epoch = Math.round(Date.now() / 1000.0)
  const time = Math.floor(epoch / 30)
  
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'))
  hmac.update(Buffer.from(time.toString(16).padStart(16, '0'), 'hex'))
  const hash = hmac.digest()
  
  const offset = hash[hash.length - 1] & 0xf
  const code = ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  
  return (code % 1000000).toString().padStart(6, '0')
}

// Verify TOTP code
export function verifyTOTPCode(secret: string, code: string): boolean {
  const expectedCode = generateTOTPCode(secret)
  return crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expectedCode))
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - SECURITY_CONFIG.RATE_LIMIT_WINDOW
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [])
    }
    
    const userRequests = this.requests.get(identifier)!
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart)
    this.requests.set(identifier, validRequests)
    
    if (validRequests.length >= SECURITY_CONFIG.RATE_LIMIT_MAX_REQUESTS) {
      return false
    }
    
    validRequests.push(now)
    return true
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 1000) // Limit length
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Phone number validation
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))
}

// Index number validation
export function isValidIndexNumber(indexNumber: string): boolean {
  // Format: CS/ITC/21/0001 or similar
  const indexRegex = /^[A-Z]{2,4}\/[A-Z]{2,4}\/\d{2}\/\d{4}$/
  return indexRegex.test(indexNumber)
}

// Session security
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

// CSRF token generation
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

// Verify CSRF token
export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken))
}
