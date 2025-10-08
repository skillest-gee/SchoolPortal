'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  BookOpen, 
  Users,
  Search,
  Filter,
  Edit,
  Save,
  Eye,
  Download
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Course {
  id: string
  code: string
  title: string
  enrolledStudents: number
  assignments: number
  averageGrade: string
}

interface StudentGrade {
  id: string
  studentId: string
  studentName: string
  courseCode: string
  assignmentTitle: string
  grade: string
  maxPoints: number
  submittedAt: string
  status: 'graded' | 'pending' | 'not-submitted'
}

export default function LecturerGradesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [studentGrades, setStudentGrades] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingGrades, setEditingGrades] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'LECTURER') {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    const loadGradesData = async () => {
      setLoading(true)
      
      // Mock courses data
      const mockCourses: Course[] = [
        {
          id: '1',
          code: 'CS101',
          title: 'Introduction to Computer Science',
          enrolledStudents: 45,
          assignments: 5,
          averageGrade: 'B+'
        },
        {
          id: '2',
          code: 'CS201',
          title: 'Data Structures and Algorithms',
          enrolledStudents: 32,
          assignments: 4,
          averageGrade: 'A-'
        },
        {
          id: '3',
          code: 'CS301',
          title: 'Software Engineering',
          enrolledStudents: 28,
          assignments: 3,
          averageGrade: 'B'
        }
      ]

      // Mock student grades data
      const mockGrades: StudentGrade[] = [
        {
          id: '1',
          studentId: 'STU001',
          studentName: 'John Smith',
          courseCode: 'CS101',
          assignmentTitle: 'Python Basics Assignment',
          grade: 'A',
          maxPoints: 100,
          submittedAt: '2024-01-15',
          status: 'graded'
        },
        {
          id: '2',
          studentId: 'STU002',
          studentName: 'Sarah Johnson',
          courseCode: 'CS101',
          assignmentTitle: 'Python Basics Assignment',
          grade: 'B+',
          maxPoints: 100,
          submittedAt: '2024-01-15',
          status: 'graded'
        },
        {
          id: '3',
          studentId: 'STU003',
          studentName: 'Michael Brown',
          courseCode: 'CS201',
          assignmentTitle: 'Data Structures Project',
          grade: '',
          maxPoints: 100,
          submittedAt: '2024-01-16',
          status: 'pending'
        },
        {
          id: '4',
          studentId: 'STU004',
          studentName: 'Emily Davis',
          courseCode: 'CS101',
          assignmentTitle: 'Python Basics Assignment',
          grade: '',
          maxPoints: 100,
          submittedAt: '',
          status: 'not-submitted'
        }
      ]

      setTimeout(() => {
        setCourses(mockCourses)
        setStudentGrades(mockGrades)
        setLoading(false)
      }, 1000)
    }

    if (session?.user.role === 'LECTURER') {
      loadGradesData()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading grades..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'LECTURER') {
    return null
  }

  const filteredGrades = studentGrades.filter(grade => {
    const matchesCourse = selectedCourse === 'all' || grade.courseCode === selectedCourse
    const matchesSearch = grade.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.assignmentTitle.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCourse && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'not-submitted': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getGradeColor = (grade: string) => {
    if (!grade) return 'text-gray-400'
    switch (grade) {
      case 'A': case 'A+': return 'text-green-600'
      case 'A-': case 'B+': return 'text-blue-600'
      case 'B': case 'B-': return 'text-yellow-600'
      case 'C+': case 'C': return 'text-orange-600'
      case 'C-': case 'D': case 'F': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const handleGradeEdit = (gradeId: string, newGrade: string) => {
    setEditingGrades(prev => ({
      ...prev,
      [gradeId]: newGrade
    }))
  }

  const handleSaveGrade = async (gradeId: string) => {
    const newGrade = editingGrades[gradeId]
    if (!newGrade) return

    // Here you would typically make an API call to save the grade
    setStudentGrades(prev => prev.map(grade => 
      grade.id === gradeId 
        ? { ...grade, grade: newGrade, status: 'graded' as const }
        : grade
    ))

    // Clear the editing state
    setEditingGrades(prev => {
      const newState = { ...prev }
      delete newState[gradeId]
      return newState
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-green-600" />
                Grade Management
              </h1>
              <p className="text-gray-600 mt-1">Manage and update student grades</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Export Grades
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
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Edit className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Grades</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {studentGrades.filter(grade => grade.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg. Grade</p>
                  <p className="text-2xl font-bold text-gray-900">B+</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name or assignment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.code}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grades Table */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Student Grades</CardTitle>
            <CardDescription>
              Manage and update student assignment grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Assignment</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Submitted</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((grade) => (
                    <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{grade.studentName}</div>
                          <div className="text-sm text-gray-500">ID: {grade.studentId}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{grade.courseCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{grade.assignmentTitle}</span>
                      </td>
                      <td className="py-3 px-4">
                        {editingGrades[grade.id] !== undefined ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingGrades[grade.id]}
                              onChange={(e) => handleGradeEdit(grade.id, e.target.value)}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder="Grade"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleSaveGrade(grade.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className={`font-medium ${getGradeColor(grade.grade)}`}>
                            {grade.grade || 'Not graded'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(grade.status)}>
                          {grade.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-500 text-sm">
                          {grade.submittedAt || 'Not submitted'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {grade.status === 'pending' && !editingGrades[grade.id] && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGradeEdit(grade.id, '')}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/lecturer/grades/${grade.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {filteredGrades.length === 0 && (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No grades found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

