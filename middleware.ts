import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@/types'
import { getSystemSetting } from '@/lib/system-settings'

// Combined middleware that handles both authentication and maintenance mode
export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Handle maintenance mode (only check if we have access to system settings)
    if (!pathname.startsWith('/api/admin/settings') && 
        !pathname.startsWith('/api/auth') &&
        !pathname.startsWith('/_next') &&
        !pathname.startsWith('/favicon')) {
      try {
        const maintenanceMode = await getSystemSetting('maintenanceMode') as boolean

        if (maintenanceMode) {
          // Allow admin access during maintenance
          if (!pathname.startsWith('/admin')) {
            // Show maintenance page for all other routes
            if (!pathname.startsWith('/maintenance')) {
              return NextResponse.redirect(new URL('/maintenance', req.url))
            }
          }
        }
      } catch (error) {
        // Continue if there's an error checking maintenance mode
        console.error('Error checking maintenance mode:', error)
      }
    }

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    const userRole = token.role as UserRole

    // Define protected routes and their required roles
    const protectedRoutes = {
      '/admin': ['ADMIN'],
      '/lecturer': ['LECTURER'],
      '/student': ['STUDENT'],
      '/dashboard': ['ADMIN', 'LECTURER', 'STUDENT'],
    }

    // Check if the current path requires specific role
    for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
      if (pathname.startsWith(route)) {
        if (!allowedRoles.includes(userRole)) {
          // Redirect to appropriate dashboard based on user role
          switch (userRole) {
            case 'ADMIN':
              return NextResponse.redirect(new URL('/admin/dashboard', req.url))
            case 'LECTURER':
              return NextResponse.redirect(new URL('/lecturer/dashboard', req.url))
            case 'STUDENT':
              return NextResponse.redirect(new URL('/student/dashboard', req.url))
            default:
              return NextResponse.redirect(new URL('/auth/login', req.url))
          }
        }
        break
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Allow access to auth pages without token
        if (pathname.startsWith('/auth/')) {
          return true
        }

        // Allow access to public pages
        if (pathname === '/' || pathname.startsWith('/api/auth/')) {
          return true
        }

        // Allow maintenance page without auth
        if (pathname.startsWith('/maintenance')) {
          return true
        }

        // Require token for all other routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
