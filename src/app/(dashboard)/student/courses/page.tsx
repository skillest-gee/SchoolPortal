'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, BookOpen, User, Calendar, CreditCard, CheckCircle, XCircle, ArrowRight } from 'lucide-react'
import { LoadingState, ErrorAlert } from '@/components/ui/loading'
import { OptimizedLoading } from '@/components/ui/instant-loading'
import { ListSkeleton } from '@/components/ui/skeleton'
import { parseApiError, getUserFriendlyMessage } from '@/lib/error-handling'

interface Enrollment {
  id: string
  enrollmentDate: string
  status: string
  course: {
    id: string
    code: string
    title: string
    description: string | null
    credits: number
    isActive: boolean
    lecturer: {
      id: string
      name: string | null
      email: string
      profile: {
        department: string
        office: string | null
      } | null
    }
  }
}

export default function StudentCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchEnrollments()
  }, [session, status, router])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/students/${session?.user.id}/enrollments`)

      if (!response.ok) {
        throw new Error('Failed to fetch enrollments')
      }

      const data = await response.json()

      if (data.success) {
        setEnrollments(data.data)
      } else {
        throw new Error(data.error || 'Failed to load enrollments')
      }

    } catch (error) {
      console.error('Error fetching enrollments:', error)
      const apiError = parseApiError(error)
      setError(getUserFriendlyMessage(apiError))
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'COMPLETED':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'DROPPED':
        return <Badge variant="destructive">Dropped</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <ListSkeleton items={6} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/student/dashboard')}
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            </div>
            <Button
              onClick={() => router.push('/student/course-registration')}
              className="flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Course Registration</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* My Enrolled Courses */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Enrolled Courses</h2>
            <div className="text-sm text-gray-600">
              {enrollments.length} course{enrollments.length !== 1 ? 's' : ''} enrolled
            </div>
          </div>
          
          {enrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{enrollment.course.title}</CardTitle>
                        <CardDescription className="text-sm font-mono">
                          {enrollment.course.code}
                        </CardDescription>
                      </div>
                      {getStatusBadge(enrollment.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="h-4 w-4 mr-2" />
                        <span>{enrollment.course.lecturer.name || 'TBA'}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span>{enrollment.course.credits} credits</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Enrolled: {formatDate(enrollment.enrollmentDate)}</span>
                      </div>
                      {enrollment.course.lecturer.profile?.department && (
                        <div className="flex items-center text-sm text-gray-600">
                          <BookOpen className="h-4 w-4 mr-2" />
                          <span>{enrollment.course.lecturer.profile.department}</span>
                        </div>
                      )}
                      {enrollment.course.description && (
                        <p className="text-sm text-gray-600 mt-3">
                          {enrollment.course.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/student/assignments`)}
                      >
                        View Assignments
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Enrolled</h3>
                <p className="text-gray-500 mb-6">
                  You haven't registered for any courses yet. Register for courses to see them here.
                </p>
                <Button
                  onClick={() => router.push('/student/course-registration')}
                  className="flex items-center space-x-2 mx-auto"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Go to Course Registration</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        {enrollments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/student/assignments')}>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Assignments</div>
                <p className="text-sm text-gray-600">View and submit assignments</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/student/grades')}>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">Grades</div>
                <p className="text-sm text-gray-600">Check your academic progress</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/student/attendance')}>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">Attendance</div>
                <p className="text-sm text-gray-600">Track your attendance</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
