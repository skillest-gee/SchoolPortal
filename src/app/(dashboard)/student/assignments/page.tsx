'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FileText, Calendar, Download, Upload, CheckCircle, Clock, XCircle } from 'lucide-react'
import { LoadingState, ErrorAlert } from '@/components/ui/loading'
import { parseApiError, getUserFriendlyMessage } from '@/lib/error-handling'

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate: string
  maxPoints: number
  fileUrl?: string
  course: {
    id: string
    code: string
    title: string
  }
  submissions: Array<{
    id: string
    fileUrl: string
    comments?: string
    submittedAt: string
    status: string
    mark?: number
    feedback?: string
  }>
}

export default function StudentAssignmentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchAssignments()
  }, [session, status, router])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      setError('')

      // Get student's enrolled courses
      const enrollmentsResponse = await fetch(`/api/students/${session?.user.id}/enrollments`)
      const enrollmentsData = await enrollmentsResponse.json()

      if (!enrollmentsData.success) {
        throw new Error('Failed to fetch enrolled courses')
      }

      // Fetch assignments for each course
      const assignmentPromises = enrollmentsData.data.map(async (enrollment: any) => {
        const response = await fetch(`/api/courses/${enrollment.course.id}/assignments`)
        const data = await response.json()
        
        if (data.success) {
          return data.data.map((assignment: any) => ({
            ...assignment,
            course: enrollment.course
          }))
        }
        return []
      })

      const allAssignments = (await Promise.all(assignmentPromises)).flat()
      setAssignments(allAssignments)

    } catch (error) {
      console.error('Error fetching assignments:', error)
      setError(error instanceof Error ? error.message : 'Failed to load assignments')
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

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date()
    const dueDate = new Date(assignment.dueDate)
    const isOverdue = now > dueDate
    const hasSubmission = assignment.submissions.length > 0
    const submission = assignment.submissions[0]

    if (hasSubmission) {
      if (submission.status === 'GRADED') {
        return <Badge className="bg-green-100 text-green-800">Graded</Badge>
      }
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
    }

    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>
    }

    return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>
  }

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
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

  if (!session || session.user.role !== 'STUDENT') {
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
                onClick={() => router.push('/student/dashboard')}
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
            </div>
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

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Submitted</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments.filter(a => a.submissions.length > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments.filter(a => a.submissions.length === 0 && !isOverdue(a.dueDate)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assignments.filter(a => a.submissions.length === 0 && isOverdue(a.dueDate)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        {assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => {
              const submission = assignment.submissions[0]
              const daysUntilDue = getDaysUntilDue(assignment.dueDate)
              
              return (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {assignment.course.code} - {assignment.maxPoints} points
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
                        {!isOverdue(assignment.dueDate) && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''} left
                          </span>
                        )}
                      </div>

                      {submission && (
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Submitted: {formatDate(submission.submittedAt)}
                          </div>
                          
                          {submission.mark !== undefined && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="font-medium">Grade: {submission.mark}/{assignment.maxPoints}</span>
                            </div>
                          )}

                          {submission.feedback && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-500">Feedback:</span>
                              <p className="text-gray-700 bg-gray-50 p-2 rounded mt-1">
                                {submission.feedback}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {assignment.fileUrl && (
                        <div className="flex items-center text-sm text-blue-600">
                          <FileText className="h-4 w-4 mr-2" />
                          Has attachment
                        </div>
                      )}

                      <div className="flex space-x-2 pt-2">
                        {assignment.fileUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(assignment.fileUrl, '_blank')}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        
                        {submission ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/student/assignments/${assignment.id}/submission`)}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            View Submission
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/student/assignments/${assignment.id}/submit`)}
                            className="flex-1"
                            disabled={isOverdue(assignment.dueDate)}
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            {isOverdue(assignment.dueDate) ? 'Overdue' : 'Submit'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments</h3>
              <p className="text-gray-500">
                You don't have any assignments yet. Check back later or contact your lecturers.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
