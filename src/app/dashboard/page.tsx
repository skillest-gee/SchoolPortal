'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Loading from '@/components/ui/loading'

export default function DashboardRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/login')
      return
    }

    // Redirect to role-specific dashboard
    const role = session.user.role?.toLowerCase()
    if (role) {
      router.push(`/${role}/dashboard`)
    } else {
      router.push('/auth/login')
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading message="Redirecting to your dashboard..." />
    </div>
  )
}
