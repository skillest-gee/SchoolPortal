'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, FileText, User, Calendar, Download, CheckCircle, XCircle, Clock } from 'lucide-react'

const gradeSubmissionSchema = z.object({
  mark: z.number().min(0, 'Mark cannot be negative'),
  feedback: z.string().optional(),
})

type GradeSubmissionFormData = z.infer<typeof gradeSubmissionSchema>

interface Submission {
  id: string
  student: {
    id: string
    name: string
    email: string
    studentProfile?: {
      studentId: string
    }
  }
  fileUrl: string
  comments?: string
  submittedAt: string
  status: string
  mark?: number
  feedback?: string
}

interface Assignment {
  id: string
  title: string
  dueDate: string
  maxPoints: number
}

interface SubmissionsData {
  assignment: Assignment
  submissions: Submission[]
  notSubmitted: Array<{
    student: {
      id: string
      name: string
      email: string
      studentProfile?: {
        studentId: string
      }
    }
    submission: null
  }>
}

export default function AssignmentSubmissionsPage({ params }: { params: { assignmentId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<SubmissionsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [grading, setGrading] = useState<string | null>(null)
  const [gradingForm, setGradingForm] = useState<{ submissionId: string; mark?: number; feedback?: string } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GradeSubmissionFormData>({
    resolver: zodResolver(gradeSubmissionSchema),
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'LECTURER') {
      router.push('/auth/login')
      return
    }

    fetchSubmissions()
  }, [session, status, router, params.assignmentId])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/assignments/${params.assignmentId}/submissions`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch submissions')
      }

      if (result.success) {
        setData(result.data)
      }

    } catch (error) {
      console.error('Error fetching submissions:', error)
      setError(error instanceof Error ? error.message : 'Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  const gradeSubmission = async (submissionId: string, formData: GradeSubmissionFormData) => {
    try {
      setGrading(submissionId)
      setError('')

      const response = await fetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to grade submission')
      }

      // Refresh submissions
      await fetchSubmissions()
      setGradingForm(null)

    } catch (error) {
      console.error('Error grading submission:', error)
      setError(error instanceof Error ? error.message : 'Failed to grade submission')
    } finally {
      setGrading(null)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Submitted</Badge>
      case 'GRADED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Graded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isLate = (submittedAt: string, dueDate: string) => {
    return new Date(submittedAt) > new Date(dueDate)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading submissions...</span>
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
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">
                {data ? data.assignment.title : 'Assignment Submissions'}
              </h1>
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

        {data && (
          <>
            {/* Assignment Info */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Assignment Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="text-sm text-gray-900">{data.assignment.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <p className="text-sm text-gray-900">{formatDate(data.assignment.dueDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Max Points</label>
                    <p className="text-sm text-gray-900">{data.assignment.maxPoints}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Submitted</p>
                      <p className="text-2xl font-bold text-gray-900">{data.submissions.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Not Submitted</p>
                      <p className="text-2xl font-bold text-gray-900">{data.notSubmitted.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{data.submissions.length + data.notSubmitted.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submissions */}
            <div className="space-y-6">
              {/* Submitted Assignments */}
              {data.submissions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Submitted Assignments ({data.submissions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.submissions.map((submission) => (
                        <div key={submission.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center space-x-3">
                              <User className="h-5 w-5 text-gray-400" />
                              <div>
                                <h4 className="font-medium">{submission.student.name}</h4>
                                <p className="text-sm text-gray-500">
                                  {submission.student.studentProfile?.studentId || submission.student.email}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {isLate(submission.submittedAt, data.assignment.dueDate) && (
                                <Badge variant="destructive">Late</Badge>
                              )}
                              {getStatusBadge(submission.status)}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500">Submitted</label>
                              <p className="text-sm text-gray-900">{formatDate(submission.submittedAt)}</p>
                            </div>
                            {submission.mark !== undefined && (
                              <div>
                                <label className="text-sm font-medium text-gray-500">Grade</label>
                                <p className="text-sm text-gray-900">{submission.mark}/{data.assignment.maxPoints}</p>
                              </div>
                            )}
                          </div>

                          {submission.comments && (
                            <div className="mb-4">
                              <label className="text-sm font-medium text-gray-500">Student Comments</label>
                              <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{submission.comments}</p>
                            </div>
                          )}

                          {submission.feedback && (
                            <div className="mb-4">
                              <label className="text-sm font-medium text-gray-500">Your Feedback</label>
                              <p className="text-sm text-gray-900 bg-blue-50 p-2 rounded">{submission.feedback}</p>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(submission.fileUrl, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            
                            {submission.status === 'SUBMITTED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setGradingForm({
                                  submissionId: submission.id,
                                  mark: submission.mark,
                                  feedback: submission.feedback
                                })}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Grade
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Not Submitted */}
              {data.notSubmitted.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Not Submitted ({data.notSubmitted.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.notSubmitted.map((item) => (
                        <div key={item.student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-3">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="font-medium">{item.student.name}</p>
                              <p className="text-sm text-gray-500">
                                {item.student.studentProfile?.studentId || item.student.email}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Not Submitted
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Grading Modal */}
        {gradingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Grade Submission</CardTitle>
                <CardDescription>
                  Enter the grade and feedback for this submission
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((data) => gradeSubmission(gradingForm.submissionId, data))} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mark">Grade (out of {data?.assignment.maxPoints})</Label>
                    <Input
                      id="mark"
                      type="number"
                      min="0"
                      max={data?.assignment.maxPoints}
                      {...register('mark', { valueAsNumber: true })}
                      defaultValue={gradingForm.mark}
                      className={errors.mark ? 'border-red-500' : ''}
                    />
                    {errors.mark && (
                      <p className="text-sm text-red-500">{errors.mark.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Feedback (Optional)</Label>
                    <Textarea
                      id="feedback"
                      {...register('feedback')}
                      defaultValue={gradingForm.feedback}
                      rows={3}
                      placeholder="Enter feedback for the student..."
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setGradingForm(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={grading === gradingForm.submissionId}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {grading === gradingForm.submissionId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Grading...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Submit Grade
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
