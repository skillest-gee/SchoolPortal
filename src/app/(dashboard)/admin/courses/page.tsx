'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Users, 
  Clock, 
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download
} from 'lucide-react'
import { exportCoursesToCSV } from '@/lib/csv-export'
import { showSuccess, showError } from '@/lib/toast'

const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  title: z.string().min(1, 'Course title is required'),
  description: z.string().optional(),
  credits: z.string().min(1, 'Credits is required').transform(val => parseInt(val)),
  department: z.string().min(1, 'Department is required'),
  level: z.string().min(1, 'Level is required'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  lecturerId: z.string().min(1, 'Lecturer is required'),
})

type CreateCourseFormData = z.infer<typeof createCourseSchema>

interface Course {
  id: string
  code: string
  title: string
  description?: string
  credits: number
  department: string
  level: string
  semester: string
  academicYear: string
  isActive: boolean
  createdAt: string
  lecturer?: {
    id: string
    name: string
    email: string
  }
  _count?: {
    enrollments: number
  }
}

interface Lecturer {
  id: string
  name: string
  email: string
  lecturerProfile?: {
    department: string
  }
}

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Business Administration',
  'Economics',
  'Psychology',
  'Sociology',
  'English',
  'History',
  'Political Science',
  'Engineering',
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Law',
  'Education',
]

const LEVELS = ['100', '200', '300', '400'] // Up to 400 level as specified
const SEMESTERS = ['First Semester', 'Second Semester'] // 2 semesters per level
const ACADEMIC_YEARS = ['2023/2024', '2024/2025', '2025/2026']

export default function AdminCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [academicYearFilter, setAcademicYearFilter] = useState('all')
  const [lecturerFilter, setLecturerFilter] = useState('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [updating, setUpdating] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    fetchCourses()
    fetchLecturers()
  }, [session, status, router])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/courses')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch courses')
      }

      if (data.success) {
        setCourses(data.data || [])
      }

    } catch (error) {
      console.error('Error fetching courses:', error)
      showError(error instanceof Error ? error.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchLecturers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=LECTURER')
      const data = await response.json()

      if (response.ok && data.success) {
        setLecturers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching lecturers:', error)
    }
  }

  const createCourse = async (data: CreateCourseFormData) => {
    try {
      setCreating(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/courses', {
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

      showSuccess('Course created successfully!')
      reset()
      setShowCreateForm(false)
      await fetchCourses()

    } catch (error) {
      console.error('Error creating course:', error)
      showError(error instanceof Error ? error.message : 'Failed to create course')
    } finally {
      setCreating(false)
    }
  }

  const toggleCourseStatus = async (courseId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        await fetchCourses()
        showSuccess(`Course ${isActive ? 'activated' : 'deactivated'} successfully!`)
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Failed to update course status')
      }
    } catch (error) {
      showError('Error updating course status')
    }
  }

  const updateCourse = async (data: Partial<CreateCourseFormData>) => {
    if (!editingCourse) return

    try {
      setUpdating(true)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update course')
      }

      showSuccess('Course updated successfully!')
      setEditingCourse(null)
      await fetchCourses()

    } catch (error) {
      console.error('Error updating course:', error)
      showError(error instanceof Error ? error.message : 'Failed to update course')
    } finally {
      setUpdating(false)
    }
  }

  const startEdit = (course: Course) => {
    setEditingCourse(course)
    setValue('code', course.code)
    setValue('title', course.title)
    setValue('description', course.description || '')
    setValue('credits', course.credits.toString())
    setValue('department', course.department)
    setValue('level', course.level)
    setValue('semester', course.semester)
    setValue('academicYear', course.academicYear)
    setValue('lecturerId', course.lecturer?.id || '')
    setSelectedCourse(null)
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case '100': return 'bg-blue-100 text-blue-800'
      case '200': return 'bg-green-100 text-green-800'
      case '300': return 'bg-yellow-100 text-yellow-800'
      case '400': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDepartment = departmentFilter === 'all' || course.department === departmentFilter
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter
    const matchesSemester = semesterFilter === 'all' || course.semester === semesterFilter
    const matchesAcademicYear = academicYearFilter === 'all' || course.academicYear === academicYearFilter
    const matchesLecturer = lecturerFilter === 'all' || course.lecturer?.id === lecturerFilter
    
    return matchesSearch && matchesDepartment && matchesLevel && matchesSemester && matchesAcademicYear && matchesLecturer
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading courses...</span>
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
                onClick={() => router.push('/admin/dashboard')}
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {SEMESTERS.map((semester) => (
                      <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {ACADEMIC_YEARS.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={lecturerFilter} onValueChange={setLecturerFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lecturer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lecturers</SelectItem>
                    {lecturers.map((lecturer) => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>
                        {lecturer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => {
                    try {
                      exportCoursesToCSV(filteredCourses)
                      showSuccess('Courses exported successfully!')
                    } catch (error) {
                      showError('Failed to export courses')
                    }
                  }} 
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{course.code}</CardTitle>
                        <CardDescription className="mt-1">{course.title}</CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Badge className={getLevelColor(course.level)}>
                          Level {course.level}
                        </Badge>
                        <Badge variant={course.isActive ? "default" : "secondary"}>
                          {course.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {course.description || 'No description provided'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4 text-gray-400" />
                        <span>{course.credits} credits</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{course._count?.enrollments || 0} enrolled</span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-600">
                      <div><strong>Department:</strong> {course.department}</div>
                      <div><strong>Level:</strong> {course.level}</div>
                      <div><strong>Semester:</strong> {course.semester}</div>
                      <div><strong>Academic Year:</strong> {course.academicYear}</div>
                      {course.lecturer && (
                        <div><strong>Lecturer:</strong> {course.lecturer.name}</div>
                      )}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCourse(course)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(course)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant={course.isActive ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleCourseStatus(course.id, !course.isActive)}
                      >
                        {course.isActive ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Courses Found</h3>
              <p className="text-gray-500">
                {searchTerm || departmentFilter !== 'all' || levelFilter !== 'all'
                  ? 'No courses match your search criteria.'
                  : 'No courses have been created yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Create Course Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Create New Course</CardTitle>
                    <CardDescription>Add a new course to the system</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false)
                      reset()
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(createCourse)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Course Code *</Label>
                      <Input
                        id="code"
                        {...register('code')}
                        className={errors.code ? 'border-red-500' : ''}
                        placeholder="e.g., CS101"
                      />
                      {errors.code && (
                        <p className="text-sm text-red-500">{errors.code.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="credits">Credits *</Label>
                      <Input
                        id="credits"
                        type="number"
                        min="1"
                        max="6"
                        {...register('credits')}
                        className={errors.credits ? 'border-red-500' : ''}
                      />
                      {errors.credits && (
                        <p className="text-sm text-red-500">{errors.credits.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="title">Course Title *</Label>
                      <Input
                        id="title"
                        {...register('title')}
                        className={errors.title ? 'border-red-500' : ''}
                        placeholder="e.g., Introduction to Computer Science"
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select onValueChange={(value) => setValue('department', value)}>
                        <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-sm text-red-500">{errors.department.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="level">Level *</Label>
                      <Select onValueChange={(value) => setValue('level', value)}>
                        <SelectTrigger className={errors.level ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.level && (
                        <p className="text-sm text-red-500">{errors.level.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester *</Label>
                      <Select onValueChange={(value) => setValue('semester', value)}>
                        <SelectTrigger className={errors.semester ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEMESTERS.map((semester) => (
                            <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.semester && (
                        <p className="text-sm text-red-500">{errors.semester.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="academicYear">Academic Year *</Label>
                      <Select onValueChange={(value) => setValue('academicYear', value)}>
                        <SelectTrigger className={errors.academicYear ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACADEMIC_YEARS.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.academicYear && (
                        <p className="text-sm text-red-500">{errors.academicYear.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lecturerId">Assign Lecturer *</Label>
                      <Select onValueChange={(value) => setValue('lecturerId', value)}>
                        <SelectTrigger className={errors.lecturerId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select lecturer" />
                        </SelectTrigger>
                        <SelectContent>
                          {lecturers.map((lecturer) => (
                            <SelectItem key={lecturer.id} value={lecturer.id}>
                              {lecturer.name} ({lecturer.lecturerProfile?.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.lecturerId && (
                        <p className="text-sm text-red-500">{errors.lecturerId.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        {...register('description')}
                        rows={3}
                        placeholder="Course description and objectives..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false)
                        reset()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
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
          </div>
        )}

        {/* Edit Course Modal */}
        {editingCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Edit Course</CardTitle>
                    <CardDescription>Update course details and lecturer assignment</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingCourse(null)
                      reset()
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit((data) => updateCourse(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-code">Course Code *</Label>
                      <Input
                        id="edit-code"
                        {...register('code')}
                        className={errors.code ? 'border-red-500' : ''}
                        placeholder="e.g., CS101"
                      />
                      {errors.code && (
                        <p className="text-sm text-red-500">{errors.code.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-credits">Credits *</Label>
                      <Input
                        id="edit-credits"
                        type="number"
                        min="1"
                        max="6"
                        {...register('credits')}
                        className={errors.credits ? 'border-red-500' : ''}
                      />
                      {errors.credits && (
                        <p className="text-sm text-red-500">{errors.credits.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-title">Course Title *</Label>
                      <Input
                        id="edit-title"
                        {...register('title')}
                        className={errors.title ? 'border-red-500' : ''}
                        placeholder="e.g., Introduction to Computer Science"
                      />
                      {errors.title && (
                        <p className="text-sm text-red-500">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Department *</Label>
                      <Select onValueChange={(value) => setValue('department', value)} value={watch('department')}>
                        <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.department && (
                        <p className="text-sm text-red-500">{errors.department.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-level">Level *</Label>
                      <Select onValueChange={(value) => setValue('level', value)} value={watch('level')}>
                        <SelectTrigger className={errors.level ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>{level}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.level && (
                        <p className="text-sm text-red-500">{errors.level.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-semester">Semester *</Label>
                      <Select onValueChange={(value) => setValue('semester', value)} value={watch('semester')}>
                        <SelectTrigger className={errors.semester ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEMESTERS.map((semester) => (
                            <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.semester && (
                        <p className="text-sm text-red-500">{errors.semester.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-academicYear">Academic Year *</Label>
                      <Select onValueChange={(value) => setValue('academicYear', value)} value={watch('academicYear')}>
                        <SelectTrigger className={errors.academicYear ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                        <SelectContent>
                          {ACADEMIC_YEARS.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.academicYear && (
                        <p className="text-sm text-red-500">{errors.academicYear.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-lecturerId">Assign Lecturer *</Label>
                      <Select onValueChange={(value) => setValue('lecturerId', value)} value={watch('lecturerId')}>
                        <SelectTrigger className={errors.lecturerId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select lecturer" />
                        </SelectTrigger>
                        <SelectContent>
                          {lecturers.map((lecturer) => (
                            <SelectItem key={lecturer.id} value={lecturer.id}>
                              {lecturer.name} ({lecturer.lecturerProfile?.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.lecturerId && (
                        <p className="text-sm text-red-500">{errors.lecturerId.message}</p>
                      )}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        {...register('description')}
                        rows={3}
                        placeholder="Course description and objectives..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingCourse(null)
                        reset()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          Update Course
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Detail Modal */}
        {selectedCourse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedCourse.code} - {selectedCourse.title}</CardTitle>
                    <CardDescription>Course Details</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCourse(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Credits</Label>
                    <p className="text-gray-900">{selectedCourse.credits}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Level</Label>
                    <div className="flex items-center space-x-2">
                      <Badge className={getLevelColor(selectedCourse.level)}>
                        Level {selectedCourse.level}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Department</Label>
                    <p className="text-gray-900">{selectedCourse.department}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Semester</Label>
                    <p className="text-gray-900">{selectedCourse.semester}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Academic Year</Label>
                    <p className="text-gray-900">{selectedCourse.academicYear}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant={selectedCourse.isActive ? "default" : "secondary"}>
                      {selectedCourse.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="text-gray-900 mt-1">{selectedCourse.description}</p>
                </div>
                {selectedCourse.lecturer && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Assigned Lecturer</Label>
                    <p className="text-gray-900 mt-1">{selectedCourse.lecturer.name} ({selectedCourse.lecturer.email})</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-600">Enrollments</Label>
                  <p className="text-gray-900 mt-1">{selectedCourse._count?.enrollments || 0} students enrolled</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
