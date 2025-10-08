'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, Users, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react'

interface AttendanceRecord {
  id: string
  date: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  notes?: string
  course: {
    id: string
    code: string
    title: string
  }
}

interface Course {
  id: string
  code: string
  title: string
  credits: number
}

interface AttendanceStats {
  totalRecords: number
  present: number
  absent: number
  late: number
  excused: number
  attendancePercentage: number
}

export default function StudentAttendancePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('all')
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchData()
  }, [session, status, router, selectedCourse])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // Get student's enrolled courses
      const enrollmentsResponse = await fetch(`/api/students/${session?.user.id}/enrollments`)
      const enrollmentsData = await enrollmentsResponse.json()

      if (!enrollmentsData.success) {
        throw new Error('Failed to fetch enrolled courses')
      }

      const enrolledCourses = enrollmentsData.data.map((enrollment: any) => enrollment.course)
      setCourses(enrolledCourses)

      // Fetch attendance records for all courses or selected course
      const attendancePromises = enrolledCourses
        .filter((course: Course) => selectedCourse === 'all' || course.id === selectedCourse)
        .map(async (course: Course) => {
          const response = await fetch(`/api/courses/${course.id}/attendance?studentId=${session?.user.id}`)
          const data = await response.json()
          
          if (data.success) {
            return data.data.map((record: any) => ({
              ...record,
              course: {
                id: course.id,
                code: course.code,
                title: course.title
              }
            }))
          }
          return []
        })

      const allAttendance = (await Promise.all(attendancePromises)).flat()
      setAttendanceRecords(allAttendance)

      // Calculate statistics
      const totalRecords = allAttendance.length
      const present = allAttendance.filter(r => r.status === 'PRESENT').length
      const absent = allAttendance.filter(r => r.status === 'ABSENT').length
      const late = allAttendance.filter(r => r.status === 'LATE').length
      const excused = allAttendance.filter(r => r.status === 'EXCUSED').length
      const attendancePercentage = totalRecords > 0 ? ((present + late + excused) / totalRecords) * 100 : 0

      setStats({
        totalRecords,
        present,
        absent,
        late,
        excused,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      })

    } catch (error) {
      console.error('Error fetching attendance:', error)
      setError(error instanceof Error ? error.message : 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <Badge className="bg-green-100 text-green-800">Present</Badge>
      case 'ABSENT':
        return <Badge variant="destructive">Absent</Badge>
      case 'LATE':
        return <Badge className="bg-yellow-100 text-yellow-800">Late</Badge>
      case 'EXCUSED':
        return <Badge className="bg-blue-100 text-blue-800">Excused</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'ABSENT':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'LATE':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'EXCUSED':
        return <AlertTriangle className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading attendance...</span>
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
              <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
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
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Present</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.present}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Absent</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.absent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Attendance %</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.attendancePercentage}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter by Course</CardTitle>
            <CardDescription>
              Select a course to view attendance records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        {attendanceRecords.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Attendance Records</span>
              </CardTitle>
              <CardDescription>
                {selectedCourse === 'all' 
                  ? `Showing attendance for all courses (${attendanceRecords.length} records)`
                  : `Showing attendance for selected course (${attendanceRecords.length} records)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendanceRecords
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(record.status)}
                          <div>
                            <h4 className="font-medium">{record.course.code} - {record.course.title}</h4>
                            <p className="text-sm text-gray-500">{formatDate(record.date)}</p>
                            {record.notes && (
                              <p className="text-sm text-gray-600 mt-1">{record.notes}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
              <p className="text-gray-500">
                {selectedCourse === 'all' 
                  ? 'No attendance records found for any of your courses.'
                  : 'No attendance records found for the selected course.'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
