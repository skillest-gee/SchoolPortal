import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentication - EduPortal',
  description: 'Sign in to your EduPortal account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {children}
    </div>
  )
}
