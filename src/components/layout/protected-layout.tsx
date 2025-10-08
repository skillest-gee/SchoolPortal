import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { UserRole } from '@/types'

interface ProtectedLayoutProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export default async function ProtectedLayout({
  children,
  allowedRoles,
  redirectTo = '/auth/login'
}: ProtectedLayoutProps) {
  const session = await getServerSession(authOptions)

  // If no session, redirect to login
  if (!session) {
    redirect(redirectTo)
  }

  // If specific roles are required, check if user has permission
  if (allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
    // Redirect to appropriate dashboard based on user role
    switch (session.user.role) {
      case 'ADMIN':
        redirect('/admin/dashboard')
      case 'LECTURER':
        redirect('/lecturer/dashboard')
      case 'STUDENT':
        redirect('/student/dashboard')
      default:
        redirect('/dashboard')
    }
  }

  return <>{children}</>
}
