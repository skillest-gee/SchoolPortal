'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Upload, FileText, Calendar, Download } from 'lucide-react'
import FileUpload from '@/components/forms/file-upload'

const submitAssignmentSchema = z.object({
  comments: z.string().optional(),
})

type SubmitAssignmentFormData = z.infer<typeof submitAssignmentSchema>

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
}

export default function SubmitAssignmentPage({ params }: { params: { assignmentId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SubmitAssignmentFormData>({
    resolver: zodResolver(submitAssignmentSchema),
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchAssignment()
  }, [session, status, router, params.assignmentId])

  const fetchAssignment = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Get student's enrolled courses first
      const enrollmentsResponse = await fetch(`/api/students/${session?.user.id}/enrollments`)
      const enrollmentsData = await enrollmentsResponse.json()

      if (!enrollmentsData.success) {
        throw new Error('Failed to fetch enrolled courses')
      }

      // Find the assignment in enrolled courses
      let foundAssignment = null
      for (const enrollment of enrollmentsData.data) {
        const response = await fetch(`/api/courses/${enrollment.course.id}/assignments`)
        const data = await response.json()
        
        if (data.success) {
          const assignment = data.data.find((a: any) => a.id === params.assignmentId)
          if (assignment) {
            foundAssignment = {
              ...assignment,
              course: enrollment.course
            }
            break
          }
        }
      }

      if (foundAssignment) {
        setAssignment(foundAssignment)
      } else {
        setError('Assignment not found or you are not enrolled in this course')
      }

    } catch (error) {
      console.error('Error fetching assignment:', error)
      setError(error instanceof Error ? error.message : 'Failed to load assignment')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: SubmitAssignmentFormData) => {
    if (!uploadedFileUrl) {
      setError('Please upload a file before submitting')
      return
    }

    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/assignments/${params.assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          fileUrl: uploadedFileUrl
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit assignment')
      }

      setSuccess('Assignment submitted successfully!')
      
      // Redirect to assignments list after a short delay
      setTimeout(() => {
        router.push('/student/assignments')
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUploadSuccess = (fileUrl: string, fileName: string) => {
    setUploadedFileUrl(fileUrl)
  }

  const handleFileUploadError = (error: string) => {
    setError(error)
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading assignment...</span>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Assignment Not Found</h2>
          <p className="text-gray-600 mb-4">The assignment you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/student/assignments')}>
            Back to Assignments
          </Button>
        </div>
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
                onClick={() => router.push('/student/assignments')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Assignments
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Submit Assignment</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Assignment Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Assignment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{assignment.title}</h3>
                <p className="text-sm text-gray-600">{assignment.course.code} - {assignment.course.title}</p>
              </div>

              {assignment.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Due: {formatDate(assignment.dueDate)}
                  {isOverdue(assignment.dueDate) && (
                    <span className="ml-2 text-red-600 font-medium">(Overdue)</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Points:</span> {assignment.maxPoints}
                </div>
              </div>

              {assignment.fileUrl && (
                <div>
                  <h4 className="font-medium mb-2">Assignment File</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(assignment.fileUrl, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Assignment File
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Submit Your Work</span>
            </CardTitle>
            <CardDescription>
              Upload your completed assignment and add any comments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label>Upload Your Assignment *</Label>
                <FileUpload
                  onUploadSuccess={handleFileUploadSuccess}
                  onUploadError={handleFileUploadError}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                  maxSize={10}
                />
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">Comments (Optional)</Label>
                <Textarea
                  id="comments"
                  {...register('comments')}
                  rows={4}
                  placeholder="Add any comments or notes about your submission..."
                />
              </div>

              <div className="flex justify-end space-x-2 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/student/assignments')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !uploadedFileUrl || isOverdue(assignment.dueDate)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : isOverdue(assignment.dueDate) ? (
                    'Assignment Overdue'
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Assignment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
