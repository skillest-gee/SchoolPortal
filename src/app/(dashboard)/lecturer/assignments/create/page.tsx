'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Plus, FileText } from 'lucide-react'
import FileUpload from '@/components/forms/file-upload'

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  maxPoints: z.number().min(1, 'Max points must be at least 1').default(100),
  fileUrl: z.string().optional(),
})

type CreateAssignmentFormData = z.infer<typeof createAssignmentSchema>

interface Course {
  id: string
  code: string
  title: string
  credits: number
}

export default function CreateAssignmentPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseId = searchParams.get('courseId')
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [course, setCourse] = useState<Course | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateAssignmentFormData>({
    resolver: zodResolver(createAssignmentSchema),
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'LECTURER') {
      router.push('/auth/login')
      return
    }

    if (!courseId) {
      router.push('/lecturer/courses')
      return
    }

    fetchCourse()
  }, [session, status, router, courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/lecturer/courses`)
      const data = await response.json()

      if (data.success) {
        const foundCourse = data.data.courses.find((c: any) => c.id === courseId)
        if (foundCourse) {
          setCourse(foundCourse)
        } else {
          setError('Course not found or you do not have access to it')
        }
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      setError('Failed to load course information')
    }
  }

  const onSubmit = async (data: CreateAssignmentFormData) => {
    if (!courseId) return

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/lecturer/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          courseId: courseId,
          fileUrl: uploadedFileUrl || undefined
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create assignment')
      }

      setSuccess('Assignment created successfully!')
      
      // Redirect to assignments list after a short delay
      setTimeout(() => {
        router.push(`/lecturer/assignments`)
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create assignment')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUploadSuccess = (fileUrl: string, fileName: string) => {
    setUploadedFileUrl(fileUrl)
    setValue('fileUrl', fileUrl)
  }

  const handleFileUploadError = (error: string) => {
    setError(error)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
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
              <h1 className="text-2xl font-bold text-gray-900">Create Assignment</h1>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Assignment Details</span>
            </CardTitle>
            <CardDescription>
              Create a new assignment for your students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  className={errors.title ? 'border-red-500' : ''}
                  placeholder="Enter assignment title"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  rows={4}
                  placeholder="Enter assignment description and instructions..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    {...register('dueDate')}
                    className={errors.dueDate ? 'border-red-500' : ''}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPoints">Maximum Points *</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    min="1"
                    {...register('maxPoints', { valueAsNumber: true })}
                    className={errors.maxPoints ? 'border-red-500' : ''}
                    placeholder="100"
                  />
                  {errors.maxPoints && (
                    <p className="text-sm text-red-500">{errors.maxPoints.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Assignment File (Optional)</Label>
                <FileUpload
                  onUploadSuccess={handleFileUploadSuccess}
                  onUploadError={handleFileUploadError}
                  accept=".pdf,.doc,.docx,.txt"
                  maxSize={10}
                />
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, DOC, DOCX, TXT (max 10MB)
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Assignment
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
