'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BookOpen, Clock, User, CheckCircle, AlertCircle, Printer } from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Course {
  id: string
  code: string
  title: string
  description: string
  credits: number
  lecturer: {
    name: string
  }
  isEnrolled: boolean
}

interface RegistrationData {
  courses: Course[]
  totalCredits: number
  canRegister: boolean
  registrationStatus: 'OPEN' | 'CLOSED' | 'COMPLETED' | 'FEES_OUTSTANDING' | 'MAINTENANCE'
  registrationMessage?: string
}

export default function CourseRegistrationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [isRegistering, setIsRegistering] = useState(false)

  // Fetch available courses for registration
  const { data: registrationData, isLoading, error } = useQuery({
    queryKey: ['course-registration'],
    queryFn: async (): Promise<RegistrationData> => {
      const response = await fetch('/api/students/course-registration')
      if (!response.ok) {
        throw new Error('Failed to fetch registration data')
      }
      return response.json()
    },
    enabled: !!session,
  })

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (courseIds: string[]) => {
      const response = await fetch('/api/students/course-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds }),
      })
      if (!response.ok) {
        throw new Error('Registration failed')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-registration'] })
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
      setIsRegistering(false)
    },
    onError: (error) => {
      console.error('Registration error:', error)
      setIsRegistering(false)
    },
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    if (session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }
  }, [session, status, router])

  const handleCourseToggle = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    )
  }

  const handleRegistration = async () => {
    if (selectedCourses.length === 0) return
    
    setIsRegistering(true)
    registerMutation.mutate(selectedCourses)
  }

  const calculateTotalCredits = () => {
    if (!registrationData) return 0
    return selectedCourses.reduce((total, courseId) => {
      const course = courses.find(c => c.id === courseId)
      return total + (course?.credits || 0)
    }, 0)
  }

  const handlePrintRegistration = () => {
    window.print()
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading course registration..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Registration</h2>
          <p className="text-gray-600 mb-4">Failed to load course registration data.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  const courses = registrationData?.courses || []
  const registrationStatus = registrationData?.registrationStatus || 'CLOSED'
  const canRegister = registrationData?.canRegister || false
  const registrationMessage = registrationData?.registrationMessage || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Course Registration</h1>
            <p className="text-gray-600 mt-2">Register for your courses for the current semester</p>
            
            <div className="mt-4 flex items-center space-x-4">
              <Badge variant={registrationStatus === 'OPEN' ? 'default' : 'secondary'}>
                {registrationStatus === 'OPEN' ? 'Registration Open' : 
                 registrationStatus === 'COMPLETED' ? 'Registration Completed' : 'Registration Closed'}
              </Badge>
              <span className="text-sm text-gray-600">
                Total Credits Selected: {calculateTotalCredits()}
              </span>
            </div>
          </div>

          {/* Registration Status Messages */}
          {registrationStatus === 'COMPLETED' && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-900">Registration Completed</h3>
                    <p className="text-green-700">You have successfully registered for your courses.</p>
                  </div>
                  <Button onClick={handlePrintRegistration} variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print Registration
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {registrationStatus === 'CLOSED' && registrationMessage && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-medium text-yellow-900">Registration Closed</h3>
                    <p className="text-yellow-700">{registrationMessage}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {registrationStatus === 'FEES_OUTSTANDING' && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <h3 className="font-medium text-red-900">Outstanding Fees</h3>
                    <p className="text-red-700">{registrationMessage}</p>
                    <Button 
                      onClick={() => router.push('/student/fees')} 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                    >
                      Pay Fees
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Courses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className={`${course.isEnrolled ? 'border-green-200 bg-green-50' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.code}</CardTitle>
                      <h3 className="font-medium text-gray-900 mt-1">{course.title}</h3>
                    </div>
                    {course.isEnrolled && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Enrolled
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">{course.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.credits} Credits</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{course.lecturer.name}</span>
                      </div>
                    </div>
                  </div>

                  {registrationStatus === 'OPEN' && !course.isEnrolled && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={course.id}
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => handleCourseToggle(course.id)}
                      />
                      <label htmlFor={course.id} className="text-sm font-medium">
                        Select for Registration
                      </label>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Registration Actions */}
          {registrationStatus === 'OPEN' && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Selected {selectedCourses.length} course(s) • {calculateTotalCredits()} credits</p>
                <p className="text-xs mt-1">Minimum: 12 credits • Maximum: 18 credits</p>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCourses([])}
                  disabled={selectedCourses.length === 0}
                >
                  Clear Selection
                </Button>
                <Button
                  onClick={handleRegistration}
                  disabled={selectedCourses.length === 0 || isRegistering || calculateTotalCredits() < 12 || calculateTotalCredits() > 18}
                >
                  {isRegistering ? 'Registering...' : 'Register Selected Courses'}
                </Button>
              </div>
            </div>
          )}

          {/* Registration Guidelines */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Registration Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p>• You must register for a minimum of 12 credits and maximum of 18 credits per semester</p>
              <p>• All courses are mandatory for your program</p>
              <p>• Registration is only available during the designated registration period</p>
              <p>• You can print your registration form after successful registration</p>
              <p>• Contact your academic advisor if you need assistance</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
