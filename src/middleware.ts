import { NextRequest, NextResponse } from 'next/server'
import { getSystemSetting } from '@/lib/system-settings'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for API routes that need to work during maintenance
  if (pathname.startsWith('/api/admin/settings') || 
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  try {
    // Check if maintenance mode is enabled
    const maintenanceMode = await getSystemSetting('maintenanceMode') as boolean

    if (maintenanceMode) {
      // Allow admin access during maintenance
      if (pathname.startsWith('/admin')) {
        return NextResponse.next()
      }

      // Show maintenance page for all other routes
      if (!pathname.startsWith('/maintenance')) {
        return NextResponse.redirect(new URL('/maintenance', request.url))
      }
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error)
    // Continue if there's an error checking maintenance mode
  }

  return NextResponse.next()
}

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
