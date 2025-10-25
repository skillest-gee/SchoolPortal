'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  Filter, 
  Mail,
  Phone,
  BookOpen,
  TrendingUp,
  Calendar,
  Eye
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  program: string
  yearOfStudy: string
  averageGrade: number | null
  totalCourses: number
  courses: Array<{
    id: string
    code: string
    title: string
    department: string
    level: string
    semester: string
    academicYear: string
    enrolledAt: string
  }>
  academicRecords: Array<{
    id: string
    courseCode: string
    courseTitle: string
    grade: number | null
    semester: string
    academicYear: string
  }>
}

export default function LecturerStudentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgram, setSelectedProgram] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'LECTURER') {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    const loadStudents = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/lecturer/students')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setStudents(data.data.students)
          } else {
            console.error('Failed to load students:', data.error)
          }
        } else {
          console.error('Failed to fetch students')
        }
      } catch (error) {
        console.error('Error loading students:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user.role === 'LECTURER') {
      loadStudents()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading students..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'LECTURER') {
    return null
  }

  const programs = ['all', ...Array.from(new Set(students.map(student => student.program)))]
  const years = ['all', ...Array.from(new Set(students.map(student => student.yearOfStudy)))]

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesProgram = selectedProgram === 'all' || student.program === selectedProgram
    const matchesYear = selectedYear === 'all' || student.yearOfStudy === selectedYear
    return matchesSearch && matchesProgram && matchesYear
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'graduated': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-600'
    if (grade >= 80) return 'text-green-600'
    if (grade >= 70) return 'text-blue-600'
    if (grade >= 60) return 'text-yellow-600'
    if (grade >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Users className="h-6 w-6 mr-2 text-green-600" />
                My Students
              </h1>
              <p className="text-gray-600 mt-1">View and manage students in your courses</p>
            </div>
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
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Grade</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.filter(s => s.averageGrade !== null).length > 0 ? 
                      (students.filter(s => s.averageGrade !== null).reduce((sum, student) => sum + (student.averageGrade || 0), 0) / students.filter(s => s.averageGrade !== null).length).toFixed(1) 
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Programs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {programs.length - 1}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {students.reduce((sum, student) => sum + student.totalCourses, 0)}
                  </p>
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
                  placeholder="Search students by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {programs.map((program) => (
                  <option key={program} value={program}>
                    {program === 'all' ? 'All Programs' : program}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Student List</CardTitle>
            <CardDescription>
              Students enrolled in your courses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Program</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Year</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Average Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Courses</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                          <div className="text-xs text-gray-400">ID: {student.studentId}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{student.program}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{student.yearOfStudy}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${getGradeColor(student.averageGrade)}`}>
                          {student.averageGrade !== null ? student.averageGrade.toFixed(1) : 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {student.courses.map((course) => (
                            <Badge key={course.id} variant="outline" className="text-xs">
                              {course.code}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Active
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/lecturer/students/${student.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`mailto:${student.email}`)}
                          >
                            <Mail className="h-4 w-4" />
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

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

