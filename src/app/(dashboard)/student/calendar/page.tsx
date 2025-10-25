'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Users, 
  Bell,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface TimetableEntry {
  id: string
  courseId: string
  course: {
    id: string
    code: string
    title: string
  }
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  classType: 'LECTURE' | 'TUTORIAL' | 'LAB' | 'SEMINAR' | 'EXAM'
  semester: string
  academicYear: string
  notes?: string
}

interface AcademicEvent {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  location?: string
  type: 'EXAM' | 'HOLIDAY' | 'DEADLINE' | 'EVENT' | 'MEETING'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  isAllDay: boolean
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  timetableEntries: TimetableEntry[]
  events: AcademicEvent[]
}

export default function AcademicCalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [academicEvents, setAcademicEvents] = useState<AcademicEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedView, setSelectedView] = useState<'month' | 'week' | 'day'>('month')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchCalendarData()
  }, [session, status, router, selectedSemester])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch timetable entries
      const timetableResponse = await fetch(`/api/timetable?semester=${selectedSemester}`)
      if (timetableResponse.ok) {
        const timetableData = await timetableResponse.json()
        if (timetableData.success) {
          setTimetableEntries(timetableData.data)
        }
      }

      // Fetch academic events (mock data for now)
      const mockEvents: AcademicEvent[] = [
        {
          id: '1',
          title: 'Midterm Exams',
          description: 'Midterm examination period',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'EXAM',
          priority: 'HIGH',
          isAllDay: true
        },
        {
          id: '2',
          title: 'Assignment Due',
          description: 'Software Engineering Project Submission',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          time: '23:59',
          type: 'DEADLINE',
          priority: 'URGENT',
          isAllDay: false
        },
        {
          id: '3',
          title: 'Academic Holiday',
          description: 'Independence Day',
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          type: 'HOLIDAY',
          priority: 'LOW',
          isAllDay: true
        }
      ]
      setAcademicEvents(mockEvents)

    } catch (error) {
      console.error('Error fetching calendar data:', error)
      setError('Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: CalendarDay[] = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      const dayTimetable = timetableEntries.filter(entry => {
        // For timetable entries, we'll match by day of week
        const entryDay = entry.dayOfWeek.toLowerCase()
        const currentDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
        return entryDay === currentDay
      })
      
      const dayEvents = academicEvents.filter(event => {
        const eventDate = new Date(event.date)
        return eventDate.toDateString() === currentDate.toDateString()
      })
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        timetableEntries: dayTimetable,
        events: dayEvents
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'EXAM':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'DEADLINE':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'HOLIDAY':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'EVENT':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'MEETING':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getClassTypeColor = (type: string) => {
    switch (type) {
      case 'LECTURE':
        return 'bg-blue-100 text-blue-800'
      case 'TUTORIAL':
        return 'bg-green-100 text-green-800'
      case 'LAB':
        return 'bg-purple-100 text-purple-800'
      case 'SEMINAR':
        return 'bg-yellow-100 text-yellow-800'
      case 'EXAM':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading academic calendar..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  const days = getDaysInMonth(currentDate)
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                Academic Calendar
              </h1>
              <p className="text-gray-600 mt-1">Your class schedule and important academic events</p>
            </div>
            <div className="flex space-x-3">
              <Select value={selectedView} onValueChange={(value: 'month' | 'week' | 'day') => setSelectedView(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Month</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline"
                onClick={() => router.push('/timetable')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Timetable
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value="FIRST">First Semester</SelectItem>
                  <SelectItem value="SECOND">Second Semester</SelectItem>
                  <SelectItem value="SUMMER">Summer Semester</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-24 p-2 border border-gray-200 ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${day.isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${day.isToday ? 'text-blue-600' : ''}`}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* Timetable Entries */}
                  {day.timetableEntries.slice(0, 2).map(entry => (
                    <div key={entry.id} className="mb-1">
                      <Badge 
                        className={`text-xs ${getClassTypeColor(entry.classType)}`}
                        variant="outline"
                      >
                        {entry.course.code} - {entry.classType}
                      </Badge>
                    </div>
                  ))}
                  
                  {/* Events */}
                  {day.events.slice(0, 1).map(event => (
                    <div key={event.id} className="mb-1">
                      <Badge 
                        className={`text-xs ${getEventColor(event.type)}`}
                        variant="outline"
                      >
                        {event.title}
                      </Badge>
                    </div>
                  ))}
                  
                  {/* More indicator */}
                  {(day.timetableEntries.length + day.events.length) > 3 && (
                    <div className="text-xs text-gray-500">
                      +{(day.timetableEntries.length + day.events.length) - 3} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="bg-white shadow-sm mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-orange-600" />
              Upcoming Events
            </CardTitle>
            <CardDescription>
              Important academic dates and deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            {academicEvents.length > 0 ? (
              <div className="space-y-4">
                {academicEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">
                            {new Date(event.date).toLocaleDateString()}
                          </span>
                          {event.time && (
                            <span className="text-sm text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {event.time}
                            </span>
                          )}
                          {event.location && (
                            <span className="text-sm text-gray-500 flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge className={getEventColor(event.type)}>
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-600">No academic events scheduled for the selected period.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
