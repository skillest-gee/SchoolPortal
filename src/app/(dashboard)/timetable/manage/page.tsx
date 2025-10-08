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
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

const createTimetableSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().min(1, 'Room is required'),
  semester: z.enum(['FIRST', 'SECOND', 'SUMMER']).default('FIRST'),
  academicYear: z.string().min(1, 'Academic year is required'),
  classType: z.enum(['LECTURE', 'TUTORIAL', 'LAB', 'SEMINAR', 'EXAM']).default('LECTURE'),
  notes: z.string().optional(),
})

type CreateTimetableFormData = z.infer<typeof createTimetableSchema>

interface TimetableEntry {
  id: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  semester: string
  academicYear: string
  classType: string
  notes?: string
  course: {
    id: string
    code: string
    title: string
    lecturer: {
      id: string
      name: string
      email: string
    }
  }
}

interface Course {
  id: string
  code: string
  title: string
  lecturer: {
    id: string
    name: string
  }
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ManageTimetablePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timetable, setTimetable] = useState<TimetableEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateTimetableFormData>({
    resolver: zodResolver(createTimetableSchema),
  })

  const watchedStartTime = watch('startTime')
  const watchedEndTime = watch('endTime')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'LECTURER')) {
      router.push('/auth/login')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch timetable entries
      const timetableResponse = await fetch('/api/timetable')
      const timetableData = await timetableResponse.json()

      if (timetableData.success) {
        setTimetable(timetableData.data)
      }

      // Fetch courses
      const coursesResponse = await fetch('/api/lecturer/courses')
      const coursesData = await coursesResponse.json()

      if (coursesData.success) {
        setCourses(coursesData.data)
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CreateTimetableFormData) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const url = editingEntry ? `/api/timetable/${editingEntry.id}` : '/api/timetable'
      const method = editingEntry ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save timetable entry')
      }

      setSuccess(editingEntry ? 'Timetable entry updated successfully!' : 'Timetable entry created successfully!')
      setShowCreateForm(false)
      setEditingEntry(null)
      reset()
      fetchData()

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save timetable entry')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry)
    setValue('courseId', entry.course.id)
    setValue('dayOfWeek', entry.dayOfWeek as any)
    setValue('startTime', entry.startTime)
    setValue('endTime', entry.endTime)
    setValue('room', entry.room)
    setValue('semester', entry.semester as any)
    setValue('academicYear', entry.academicYear)
    setValue('classType', entry.classType as any)
    setValue('notes', entry.notes || '')
    setShowCreateForm(true)
  }

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) {
      return
    }

    try {
      const response = await fetch(`/api/timetable/${entryId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete timetable entry')
      }

      setSuccess('Timetable entry deleted successfully!')
      fetchData()

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete timetable entry')
    }
  }

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getClassTypeColor = (classType: string) => {
    switch (classType) {
      case 'LECTURE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'TUTORIAL':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'LAB':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SEMINAR':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'EXAM':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const canManageEntry = (entry: TimetableEntry) => {
    return session?.user.role === 'ADMIN' || entry.course.lecturer.id === session?.user.id
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-teal-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading timetable management...</p>
        </div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'LECTURER')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/timetable')}
                className="bg-white/50 hover:bg-white/80 border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Timetable
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Manage Timetable
                </h1>
                <p className="text-gray-600 mt-1">Create and manage class schedules</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingEntry(null)
                reset()
                setShowCreateForm(true)
              }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingEntry ? 'Edit Schedule' : 'Create New Schedule'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingEntry(null)
                    reset()
                  }}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="courseId">Course</Label>
                    <Select onValueChange={(value) => setValue('courseId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.courseId && (
                      <p className="text-sm text-red-500">{errors.courseId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dayOfWeek">Day of Week</Label>
                    <Select onValueChange={(value) => setValue('dayOfWeek', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day, index) => (
                          <SelectItem key={day} value={day}>
                            {DAY_LABELS[index]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.dayOfWeek && (
                      <p className="text-sm text-red-500">{errors.dayOfWeek.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      {...register('startTime')}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-500">{errors.startTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      {...register('endTime')}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-red-500">{errors.endTime.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="room">Room</Label>
                    <Input
                      id="room"
                      {...register('room')}
                      placeholder="e.g., Room 101, Lab A"
                    />
                    {errors.room && (
                      <p className="text-sm text-red-500">{errors.room.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="classType">Class Type</Label>
                    <Select onValueChange={(value) => setValue('classType', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LECTURE">Lecture</SelectItem>
                        <SelectItem value="TUTORIAL">Tutorial</SelectItem>
                        <SelectItem value="LAB">Lab</SelectItem>
                        <SelectItem value="SEMINAR">Seminar</SelectItem>
                        <SelectItem value="EXAM">Exam</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.classType && (
                      <p className="text-sm text-red-500">{errors.classType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select onValueChange={(value) => setValue('semester', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIRST">First Semester</SelectItem>
                        <SelectItem value="SECOND">Second Semester</SelectItem>
                        <SelectItem value="SUMMER">Summer Semester</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.semester && (
                      <p className="text-sm text-red-500">{errors.semester.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Input
                      id="academicYear"
                      {...register('academicYear')}
                      placeholder="e.g., 2024/2025"
                    />
                    {errors.academicYear && (
                      <p className="text-sm text-red-500">{errors.academicYear.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Additional notes or instructions..."
                    rows={3}
                  />
                </div>

                {/* Time Validation */}
                {watchedStartTime && watchedEndTime && watchedStartTime >= watchedEndTime && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      End time must be after start time.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end space-x-2 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingEntry(null)
                      reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving || !!(watchedStartTime && watchedEndTime && watchedStartTime >= watchedEndTime)}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {editingEntry ? 'Update Schedule' : 'Create Schedule'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Timetable Entries */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              <span>Current Schedule</span>
            </CardTitle>
            <CardDescription>
              Manage your timetable entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timetable.length > 0 ? (
              <div className="space-y-4">
                {timetable.map((entry) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-all duration-200 bg-white/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Badge className={getClassTypeColor(entry.classType)}>
                          {entry.classType}
                        </Badge>
                        <div>
                          <h4 className="font-semibold text-gray-900">{entry.course.code}</h4>
                          <p className="text-sm text-gray-600">{entry.course.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </p>
                        <p className="text-sm text-gray-500">{DAY_LABELS[DAYS.indexOf(entry.dayOfWeek)]}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{entry.room}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{entry.course.lecturer.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{entry.academicYear}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <BookOpen className="h-4 w-4" />
                        <span>{entry.semester} Semester</span>
                      </div>
                    </div>

                    {entry.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{entry.notes}</p>
                      </div>
                    )}

                    {canManageEntry(entry) && (
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Entries</h3>
                <p className="text-gray-500">No timetable entries have been created yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
