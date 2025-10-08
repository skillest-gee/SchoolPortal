import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from './security'

// Global rate limiter instance
const rateLimiter = new RateLimiter()

// Rate limiting middleware
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    windowMs?: number
    maxRequests?: number
    keyGenerator?: (req: NextRequest) => string
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { windowMs = 15 * 60 * 1000, maxRequests = 100, keyGenerator } = options
    
    // Generate rate limit key
    const key = keyGenerator 
      ? keyGenerator(req)
      : req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    if (!rateLimiter.isAllowed(key)) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
          }
        }
      )
    }
    
    return handler(req)
  }
}

// API-specific rate limiting
export function withAPIRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withRateLimit(handler, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    keyGenerator: (req) => {
      // Use IP address and user agent for rate limiting
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      const userAgent = req.headers.get('user-agent') || 'unknown'
      return `${ip}-${userAgent}`
    }
  })
}

// Auth-specific rate limiting (stricter)
export function withAuthRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withRateLimit(handler, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 auth attempts per window
    keyGenerator: (req) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      return `auth-${ip}`
    }
  })
}

// File upload rate limiting
export function withUploadRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withRateLimit(handler, {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 uploads per hour
    keyGenerator: (req) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      return `upload-${ip}`
    }
  })
}

// Search rate limiting
export function withSearchRateLimit(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withRateLimit(handler, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // 20 searches per minute
    keyGenerator: (req) => {
      const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
      return `search-${ip}`
    }
  })
}

// Reset rate limit for a specific key
export function resetRateLimit(key: string): void {
  rateLimiter.reset(key)
}

// Get rate limit status
export function getRateLimitStatus(key: string): {
  isAllowed: boolean
  remainingRequests: number
  resetTime: number
} {
  // This is a simplified version - in production, you'd want more detailed tracking
  return {
    isAllowed: rateLimiter.isAllowed(key),
    remainingRequests: 0, // Would need to implement proper tracking
    resetTime: Date.now() + 15 * 60 * 1000 // 15 minutes from now
  }
}
