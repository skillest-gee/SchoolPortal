'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Calendar,
  GraduationCap,
  Loader2,
  Eye
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Course {
  id: string
  code: string
  title: string
  description: string
  credits: number
  department: string
  level: string
  semester: string
  academicYear: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  lecturer: {
    id: string
    name: string
    email: string
  }
  createdAt: string
}

export default function CourseApprovalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    fetchCourses()
  }, [session, status, router])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/courses')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCourses(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      setError('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (courseId: string, action: 'approve' | 'reject') => {
    setProcessing(courseId)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rejectionReason: action === 'reject' ? rejectionReason : undefined
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process course')
      }

      setSuccess(`Course ${action === 'approve' ? 'approved' : 'rejected'} successfully!`)
      setRejectionReason('')
      setSelectedCourse(null)
      fetchCourses()

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process course')
    } finally {
      setProcessing(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading course approvals..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const pendingCourses = courses.filter(course => course.status === 'PENDING')
  const approvedCourses = courses.filter(course => course.status === 'APPROVED')
  const rejectedCourses = courses.filter(course => course.status === 'REJECTED')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
              Course Approval Management
            </h1>
            <p className="text-gray-600 mt-1">Review and approve courses created by lecturers</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{approvedCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{rejectedCourses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Courses */}
        {pendingCourses.length > 0 && (
          <Card className="bg-white shadow-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                Pending Approval ({pendingCourses.length})
              </CardTitle>
              <CardDescription>
                Courses waiting for admin approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pendingCourses.map((course) => (
                  <div key={course.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-600">{course.code} • {course.credits} credits</p>
                        <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {course.lecturer.name}
                          </div>
                          <div className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-1" />
                            {course.department} - Level {course.level}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {course.semester} {course.academicYear}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(course.status)}>
                        Pending Approval
                      </Badge>
                    </div>

                    {course.description && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-700">{course.description}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Created: {new Date(course.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproval(course.id, 'approve')}
                          disabled={processing === course.id}
                        >
                          {processing === course.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCourse(course.id)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>

                    {selectedCourse === course.id && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <Label htmlFor="rejectionReason" className="text-sm font-medium text-red-800">
                          Rejection Reason (Required)
                        </Label>
                        <Textarea
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Please provide a reason for rejecting this course..."
                          className="mt-2"
                          rows={3}
                        />
                        <div className="flex space-x-2 mt-3">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleApproval(course.id, 'reject')}
                            disabled={!rejectionReason.trim() || processing === course.id}
                          >
                            {processing === course.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-1" />
                            )}
                            Reject Course
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedCourse(null)
                              setRejectionReason('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approved and Rejected Courses */}
        {(approvedCourses.length > 0 || rejectedCourses.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {approvedCourses.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    Approved Courses ({approvedCourses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approvedCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-sm text-gray-600">{course.code}</p>
                        </div>
                        <Badge className={getStatusColor(course.status)}>
                          Approved
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {rejectedCourses.length > 0 && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <XCircle className="h-5 w-5 mr-2 text-red-600" />
                    Rejected Courses ({rejectedCourses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {rejectedCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-sm text-gray-600">{course.code}</p>
                        </div>
                        <Badge className={getStatusColor(course.status)}>
                          Rejected
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {pendingCourses.length === 0 && (
          <Card className="bg-white shadow-sm">
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All courses approved!</h3>
              <p className="text-gray-600">No courses are currently pending approval.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
