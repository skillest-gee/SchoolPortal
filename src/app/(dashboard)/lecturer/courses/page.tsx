'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  Calendar,
  Plus,
  Eye,
  Edit,
  BarChart3,
  Clock
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Course {
  id: string
  code: string
  title: string
  description: string
  credits: number
  enrolledStudents: number
  totalCapacity: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  semester: string
  academicYear: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  createdAt: string
}

export default function LecturerCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'LECTURER') {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    const loadCourses = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/lecturer/courses')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCourses(data.data.courses)
          } else {
            console.error('Failed to load courses:', data.error)
          }
        } else {
          console.error('Failed to fetch courses')
        }
      } catch (error) {
        console.error('Error loading courses:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user.role === 'LECTURER') {
      loadCourses()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading your courses..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'LECTURER') {
    return null
  }

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'Approved'
      case 'PENDING':
        return 'Pending Approval'
      case 'REJECTED':
        return 'Rejected'
      default:
        return status
    }
  }

  const getEnrollmentColor = (enrolled: number, capacity: number) => {
    const percentage = (enrolled / capacity) * 100
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 75) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-green-600" />
                My Courses
              </h1>
              <p className="text-gray-600 mt-1">Manage your courses and student enrollments</p>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={() => router.push('/lecturer/courses/create')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.reduce((sum, course) => sum + course.enrolledStudents, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Enrollment</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(courses.reduce((sum, course) => sum + course.enrolledStudents, 0) / courses.length) || 0}%
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Approved Courses</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(course => course.status === 'APPROVED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {course.code} • {course.credits} credits
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(course.status)}>
                    {getStatusText(course.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description}
                  </p>
                  
                  {course.status === 'REJECTED' && course.rejectionReason && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-xs text-red-700">
                        <strong>Rejection Reason:</strong> {course.rejectionReason}
                      </p>
                    </div>
                  )}
                  
                  {course.status === 'APPROVED' && course.approvedAt && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-xs text-green-700">
                        <strong>Approved:</strong> {new Date(course.approvedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Enrollment:</span>
                      <span className={`font-medium ${getEnrollmentColor(course.enrolledStudents, course.totalCapacity)}`}>
                        {course.enrolledStudents}/{course.totalCapacity}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          (course.enrolledStudents / course.totalCapacity) >= 0.9 ? 'bg-red-500' :
                          (course.enrolledStudents / course.totalCapacity) >= 0.75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(course.enrolledStudents / course.totalCapacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {course.semester} {course.academicYear}
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => router.push(`/lecturer/assignments?course=${course.code}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Assignments
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/lecturer/courses/${course.id}/attendance`)}
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
            <p className="text-gray-600 mb-4">You haven't been assigned to any courses yet.</p>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Course
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}