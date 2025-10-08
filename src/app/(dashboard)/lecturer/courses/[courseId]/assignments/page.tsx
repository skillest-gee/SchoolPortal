'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Eye, FileText, Calendar, Users, ArrowLeft, Edit, Trash2 } from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate: string
  maxPoints: number
  fileUrl?: string
  createdAt: string
  _count: {
    submissions: number
  }
}

interface Course {
  id: string
  code: string
  title: string
  credits: number
}

export default function CourseAssignmentsPage({ params }: { params: { courseId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'LECTURER') {
      router.push('/auth/login')
      return
    }

    fetchData()
  }, [session, status, router, params.courseId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch course info
      const courseResponse = await fetch('/api/lecturer/courses')
      const courseData = await courseResponse.json()

      if (courseData.success) {
        const foundCourse = courseData.data.find((c: any) => c.id === params.courseId)
        if (foundCourse) {
          setCourse(foundCourse)
        } else {
          setError('Course not found or you do not have access to it')
          return
        }
      }

      // Fetch assignments
      const assignmentsResponse = await fetch(`/api/courses/${params.courseId}/assignments`)
      const assignmentsData = await assignmentsResponse.json()

      if (assignmentsData.success) {
        setAssignments(assignmentsData.data)
      } else {
        setError(assignmentsData.error || 'Failed to load assignments')
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  const getStatusBadge = (assignment: Assignment) => {
    if (isOverdue(assignment.dueDate)) {
      return <Badge variant="destructive">Overdue</Badge>
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading assignments...</span>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'LECTURER') {
    return null
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
                onClick={() => router.push('/lecturer/courses')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                {course ? `${course.code} - Assignments` : 'Assignments'}
              </h1>
            </div>
            <Button
              onClick={() => router.push(`/lecturer/assignments/create?courseId=${params.courseId}`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {course && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Course Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Course Code</label>
                  <p className="text-sm text-gray-900">{course.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Course Title</label>
                  <p className="text-sm text-gray-900">{course.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Credits</label>
                  <p className="text-sm text-gray-900">{course.credits}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignments List */}
        {assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {assignment.maxPoints} points
                      </CardDescription>
                    </div>
                    {getStatusBadge(assignment)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {assignment.description && (
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {assignment.description}
                      </p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      Due: {formatDate(assignment.dueDate)}
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      {assignment._count.submissions} submission{assignment._count.submissions !== 1 ? 's' : ''}
                    </div>

                    {assignment.fileUrl && (
                      <div className="flex items-center text-sm text-blue-600">
                        <FileText className="h-4 w-4 mr-2" />
                        Has attachment
                      </div>
                    )}

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/lecturer/assignments/${assignment.id}/submissions`)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Submissions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first assignment to get started.
              </p>
              <Button
                onClick={() => router.push(`/lecturer/assignments/create?courseId=${params.courseId}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
