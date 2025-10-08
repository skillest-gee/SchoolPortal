'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  BookOpen, 
  Calendar,
  Download,
  Filter,
  Search
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Grade {
  id: string
  courseCode: string
  courseName: string
  semester: string
  academicYear: string
  grade: string
  points: number
  credits: number
  lecturer: string
  date: string | null
  isGraded: boolean
}

interface SemesterSummary {
  academicYear: string
  semester: string
  semesterGPA: number
  totalCredits: number
  totalCourses: number
  gradedCourses: number
  grades: Grade[]
}

export default function StudentGrades() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch grades data from API
  const { data: gradesData, isLoading, error } = useQuery({
    queryKey: ['student-grades'],
    queryFn: async () => {
      const response = await fetch('/api/students/grades')
      if (!response.ok) {
        throw new Error('Failed to fetch grades data')
      }
      return response.json()
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
    }
  }, [session, status, router])

  // Remove the mock data loading - we're using useQuery now

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading your grades..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Grades</h2>
          <p className="text-gray-600 mb-4">Failed to load grades data. Please try again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const data = gradesData?.data
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading your grades..." />
      </div>
    )
  }

  const grades = data.grades || []
  const semesterSummaries = data.groupedGrades || []

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': case 'A+': return 'bg-green-100 text-green-800 border-green-200'
      case 'A-': case 'B+': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'B': case 'B-': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'C+': case 'C': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'C-': case 'D': case 'F': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const filteredGrades = grades.filter((grade: any) => {
    const matchesSemester = selectedSemester === 'all' || grade.semester === selectedSemester
    const matchesSearch = grade.courseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         grade.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSemester && matchesSearch
  })

  const overallGPA = data.overallGPA ? data.overallGPA.toFixed(2) : '0.00'
  const totalCredits = data.totalCredits || 0
  const totalCourses = data.totalCourses || 0

  // Calculate CGPA (Cumulative GPA) - average of all semester GPAs
  const cgpa = semesterSummaries.length > 0 
    ? (semesterSummaries.reduce((sum: number, semester: SemesterSummary) => sum + semester.semesterGPA, 0) / semesterSummaries.length).toFixed(2)
    : '0.00'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Academic Grades</h1>
              <p className="text-gray-600 mt-1">View your academic performance and transcripts</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Download Transcript
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overall GPA</p>
                  <p className="text-2xl font-bold text-gray-900">{overallGPA}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">CGPA</p>
                  <p className="text-2xl font-bold text-gray-900">{cgpa}</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Credits</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCredits}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Semester Summaries */}
        {semesterSummaries.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Semester Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {semesterSummaries.map((semester: SemesterSummary, index: number) => (
                <Card key={index} className="bg-white shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{semester.academicYear}</CardTitle>
                    <CardDescription>{semester.semester}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Semester GPA:</span>
                        <span className="font-medium">{semester.semesterGPA.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Credits:</span>
                        <span className="font-medium">{semester.totalCredits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Courses:</span>
                        <span className="font-medium">{semester.gradedCourses}/{semester.totalCourses}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Semesters</option>
                {semesterSummaries.map((summary: any) => (
                  <option key={summary.semester} value={summary.semester}>
                    {summary.semester}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Semester Summaries */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {semesterSummaries.map((summary: any) => (
            <Card key={summary.semester} className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{summary.semester}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">GPA:</span>
                    <span className="font-semibold">{summary.semesterGPA.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Credits:</span>
                    <span className="font-semibold">{summary.totalCredits}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Courses:</span>
                    <span className="font-semibold">{summary.gradedCourses}/{summary.totalCourses}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grades Table */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Course Grades</CardTitle>
            <CardDescription>
              Detailed breakdown of your academic performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Course Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Semester</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Credits</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Grade</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Points</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Lecturer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.map((grade: any) => (
                    <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{grade.courseCode}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{grade.courseName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{grade.semester}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{grade.credits}</span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getGradeColor(grade.grade)}>
                          {grade.grade}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{grade.points}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-600">{grade.lecturer}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-500 text-sm">{grade.date}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

