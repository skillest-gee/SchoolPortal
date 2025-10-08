'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, ArrowLeft, Users, BookOpen, CheckCircle, XCircle } from 'lucide-react'

interface StudentGrade {
  enrollmentId: string
  studentId: string
  studentName: string | null
  studentEmail: string
  studentProfile: {
    studentId: string | null
    program: string | null
    yearOfStudy: number | null
  } | null
  enrollmentDate: string
  enrollmentStatus: string
  academicRecord: {
    id: string
    grade: string | null
    points: number | null
    gpa: number | null
    status: string
    semester: string
    academicYear: string
  } | null
}

interface Course {
  id: string
  code: string
  title: string
  credits: number
  semester: string
  academicYear: string
}

interface GradeUpdate {
  studentId: string
  grade: string
  points?: number
  comments?: string
}

const GRADE_OPTIONS = [
  { value: 'A+', label: 'A+ (97-100)' },
  { value: 'A', label: 'A (93-96)' },
  { value: 'A-', label: 'A- (90-92)' },
  { value: 'B+', label: 'B+ (87-89)' },
  { value: 'B', label: 'B (83-86)' },
  { value: 'B-', label: 'B- (80-82)' },
  { value: 'C+', label: 'C+ (77-79)' },
  { value: 'C', label: 'C (73-76)' },
  { value: 'C-', label: 'C- (70-72)' },
  { value: 'D+', label: 'D+ (67-69)' },
  { value: 'D', label: 'D (63-66)' },
  { value: 'D-', label: 'D- (60-62)' },
  { value: 'F', label: 'F (Below 60)' },
  { value: 'I', label: 'Incomplete' },
  { value: 'W', label: 'Withdrawn' }
]

export default function LecturerGradesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [students, setStudents] = useState<StudentGrade[]>([])
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [points, setPoints] = useState<Record<string, number>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
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

    fetchCourseGrades()
  }, [session, status, router, courseId])

  const fetchCourseGrades = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/lecturer/courses/${courseId}/grades`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch course grades')
      }

      if (data.success) {
        setCourse(data.data.course)
        setStudents(data.data.students)

        // Initialize grades state with existing grades
        const initialGrades: Record<string, string> = {}
        const initialPoints: Record<string, number> = {}
        const initialComments: Record<string, string> = {}

        data.data.students.forEach((student: StudentGrade) => {
          if (student.academicRecord?.grade) {
            initialGrades[student.studentId] = student.academicRecord.grade
          }
          if (student.academicRecord?.points) {
            initialPoints[student.studentId] = student.academicRecord.points
          }
          // Comments field removed from schema
          initialComments[student.studentId] = ''
        })

        setGrades(initialGrades)
        setPoints(initialPoints)
        setComments(initialComments)
      }

    } catch (error) {
      console.error('Error fetching course grades:', error)
      setError(error instanceof Error ? error.message : 'Failed to load course grades')
    } finally {
      setLoading(false)
    }
  }

  const handleGradeChange = (studentId: string, grade: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: grade
    }))
  }

  const handlePointsChange = (studentId: string, value: string) => {
    const pointsValue = value === '' ? 0 : parseFloat(value)
    setPoints(prev => ({
      ...prev,
      [studentId]: pointsValue
    }))
  }

  const handleCommentsChange = (studentId: string, value: string) => {
    setComments(prev => ({
      ...prev,
      [studentId]: value
    }))
  }

  const handleSaveGrades = async () => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      // Prepare grades data
      const gradesData: GradeUpdate[] = students.map(student => ({
        studentId: student.studentId,
        grade: grades[student.studentId] || '',
        points: points[student.studentId] || undefined,
        comments: comments[student.studentId] || undefined
      })).filter(grade => grade.grade) // Only include students with grades

      if (gradesData.length === 0) {
        setError('Please enter at least one grade before saving')
        return
      }

      const response = await fetch(`/api/lecturer/courses/${courseId}/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grades: gradesData }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save grades')
      }

      setSuccess(`Successfully updated grades for ${data.data.updatedCount} students`)
      
      // Refresh the data
      await fetchCourseGrades()

    } catch (error) {
      console.error('Error saving grades:', error)
      setError(error instanceof Error ? error.message : 'Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
      case 'A-':
        return 'text-green-600 bg-green-50'
      case 'B+':
      case 'B':
      case 'B-':
        return 'text-blue-600 bg-blue-50'
      case 'C+':
      case 'C':
      case 'C-':
        return 'text-yellow-600 bg-yellow-50'
      case 'D+':
      case 'D':
      case 'D-':
        return 'text-orange-600 bg-orange-50'
      case 'F':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading course grades...</span>
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
                onClick={() => router.push('/lecturer/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Course Grades</h1>
                {course && (
                  <p className="text-sm text-gray-600">
                    {course.code} - {course.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleSaveGrades}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save All Grades
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Course Info */}
        {course && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Course Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Course Code</Label>
                  <p className="text-lg font-semibold">{course.code}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Credits</Label>
                  <p className="text-lg font-semibold">{course.credits}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Semester</Label>
                  <p className="text-lg font-semibold">{course.semester}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Academic Year</Label>
                  <p className="text-lg font-semibold">{course.academicYear}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students and Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Student Grades ({students.length} students)</span>
            </CardTitle>
            <CardDescription>
              Update grades for enrolled students. Changes are saved when you click "Save All Grades".
            </CardDescription>
          </CardHeader>
          <CardContent>
            {students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Program
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Comments
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.studentId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.studentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.studentProfile?.studentId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentProfile?.program || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.studentProfile?.yearOfStudy || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select
                            value={grades[student.studentId] || ''}
                            onValueChange={(value) => handleGradeChange(student.studentId, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Select grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={points[student.studentId] || ''}
                            onChange={(e) => handlePointsChange(student.studentId, e.target.value)}
                            placeholder="Points"
                            className="w-20"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            value={comments[student.studentId] || ''}
                            onChange={(e) => handleCommentsChange(student.studentId, e.target.value)}
                            placeholder="Comments"
                            className="w-48"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No students enrolled in this course.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
