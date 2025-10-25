'use client'

import { useState } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, BookOpen, Loader2, Plus } from 'lucide-react'
import Loading from '@/components/ui/loading'

const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  title: z.string().min(1, 'Course title is required'),
  description: z.string().optional(),
  credits: z.number().min(1, 'Credits must be at least 1'),
  department: z.string().min(1, 'Department is required'),
  level: z.string().min(1, 'Level is required'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
})

type CreateCourseFormData = z.infer<typeof createCourseSchema>

export default function CreateCoursePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
  })

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'LECTURER') {
    router.push('/auth/login')
    return null
  }

  const onSubmit = async (data: CreateCourseFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/lecturer/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create course')
      }

      setSuccess('Course created successfully!')
      
      // Redirect to courses list after a short delay
      setTimeout(() => {
        router.push('/lecturer/courses')
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create course')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/lecturer/courses')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="h-6 w-6 mr-2 text-green-600" />
                  Create New Course
                </h1>
                <p className="text-gray-600 mt-1">Add a new course to your teaching portfolio</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>
              Fill in the details for your new course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Code */}
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    {...register('code')}
                    placeholder="e.g., CS101, MATH201"
                    className={errors.code ? 'border-red-500' : ''}
                  />
                  {errors.code && (
                    <p className="text-sm text-red-600">{errors.code.message}</p>
                  )}
                </div>

                {/* Course Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    {...register('title')}
                    placeholder="e.g., Introduction to Computer Science"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                {/* Credits */}
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits *</Label>
                  <Input
                    id="credits"
                    type="number"
                    min="1"
                    max="6"
                    {...register('credits', { valueAsNumber: true })}
                    placeholder="3"
                    className={errors.credits ? 'border-red-500' : ''}
                  />
                  {errors.credits && (
                    <p className="text-sm text-red-600">{errors.credits.message}</p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select onValueChange={(value) => setValue('department', value)}>
                    <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Economics">Economics</SelectItem>
                      <SelectItem value="Psychology">Psychology</SelectItem>
                      <SelectItem value="Literature">Literature</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Art">Art</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-sm text-red-600">{errors.department.message}</p>
                  )}
                </div>

                {/* Level */}
                <div className="space-y-2">
                  <Label htmlFor="level">Level *</Label>
                  <Select onValueChange={(value) => setValue('level', value)}>
                    <SelectTrigger className={errors.level ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                      <SelectItem value="300">300 Level</SelectItem>
                      <SelectItem value="400">400 Level</SelectItem>
                      <SelectItem value="500">500 Level (Graduate)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.level && (
                    <p className="text-sm text-red-600">{errors.level.message}</p>
                  )}
                </div>

                {/* Semester */}
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Select onValueChange={(value) => setValue('semester', value)}>
                    <SelectTrigger className={errors.semester ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Semester">First Semester</SelectItem>
                      <SelectItem value="Second Semester">Second Semester</SelectItem>
                      <SelectItem value="Summer Semester">Summer Semester</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.semester && (
                    <p className="text-sm text-red-600">{errors.semester.message}</p>
                  )}
                </div>

                {/* Academic Year */}
                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Input
                    id="academicYear"
                    {...register('academicYear')}
                    placeholder="e.g., 2024/2025"
                    className={errors.academicYear ? 'border-red-500' : ''}
                  />
                  {errors.academicYear && (
                    <p className="text-sm text-red-600">{errors.academicYear.message}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of the course content and objectives..."
                  rows={4}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/lecturer/courses')}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Course...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
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
