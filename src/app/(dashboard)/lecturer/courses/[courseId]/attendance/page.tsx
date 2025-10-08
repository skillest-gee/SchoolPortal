'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Users, Calendar, CheckCircle, XCircle, Clock, AlertTriangle, Save } from 'lucide-react'

interface Student {
  id: string
  name: string
  email: string
  studentProfile?: {
    studentId: string
  }
}

interface AttendanceRecord {
  studentId: string
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED'
  notes?: string
}

interface Course {
  id: string
  code: string
  title: string
  credits: number
}

export default function CourseAttendancePage({ params }: { params: { courseId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'LECTURER') {
      router.push('/auth/login')
      return
    }

    fetchData()
  }, [session, status, router, params.courseId, selectedDate])

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

      // Fetch attendance for the selected date
      const attendanceResponse = await fetch(`/api/courses/${params.courseId}/attendance?date=${selectedDate}`)
      const attendanceData = await attendanceResponse.json()

      if (attendanceData.success) {
        if (attendanceData.data.attendance) {
          // Existing attendance records
          const records = attendanceData.data.attendance.map((record: any) => ({
            studentId: record.student.id,
            status: record.status,
            notes: record.notes || ''
          }))
          setAttendanceRecords(records)
          setStudents(attendanceData.data.attendance.map((record: any) => record.student))
        } else {
          // No attendance records for this date, get enrolled students
          const students = attendanceData.data.map((item: any) => item.student)
          setStudents(students)
          setAttendanceRecords(students.map((student: Student) => ({
            studentId: student.id,
            status: 'PRESENT' as const,
            notes: ''
          })))
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const updateAttendanceStatus = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, status }
          : record
      )
    )
  }

  const updateAttendanceNotes = (studentId: string, notes: string) => {
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, notes }
          : record
      )
    )
  }

  const saveAttendance = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/courses/${params.courseId}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          attendance: attendanceRecords
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save attendance')
      }

      setSuccess('Attendance saved successfully!')

    } catch (error) {
      console.error('Error saving attendance:', error)
      setError(error instanceof Error ? error.message : 'Failed to save attendance')
    } finally {
      setSaving(false)
    }
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
                {course ? `${course.code} - Attendance` : 'Attendance'}
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

        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {course && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
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

        {/* Date Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>
              Choose the date for marking attendance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
              </div>
              <Button
                onClick={fetchData}
                variant="outline"
              >
                Load Attendance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        {students.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Student Attendance</span>
                  </CardTitle>
                  <CardDescription>
                    Mark attendance for {students.length} student{students.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button
                  onClick={saveAttendance}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Attendance
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {students.map((student) => {
                  const record = attendanceRecords.find(r => r.studentId === student.id)
                  const status = record?.status || 'PRESENT'
                  const notes = record?.notes || ''

                  return (
                    <div key={student.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(status)}
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-gray-500">
                              {student.studentProfile?.studentId || student.email}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={status}
                            onValueChange={(value: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => 
                              updateAttendanceStatus(student.id, value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PRESENT">Present</SelectItem>
                              <SelectItem value="ABSENT">Absent</SelectItem>
                              <SelectItem value="LATE">Late</SelectItem>
                              <SelectItem value="EXCUSED">Excused</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Notes (Optional)</Label>
                          <Input
                            value={notes}
                            onChange={(e) => updateAttendanceNotes(student.id, e.target.value)}
                            placeholder="Add notes..."
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-500">
                No students are enrolled in this course yet.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
