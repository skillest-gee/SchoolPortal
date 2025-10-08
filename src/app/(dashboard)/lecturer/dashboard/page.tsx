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
  FileText, 
  TrendingUp, 
  Plus, 
  MessageSquare, 
  Megaphone, 
  Clock,
  Target,
  BarChart3,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Calendar
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface RecentActivity {
  id: string
  type: 'grading' | 'assignment' | 'course' | 'announcement'
  title: string
  description: string
  date: string
  status: 'completed' | 'pending' | 'in-progress'
}

interface CourseStats {
  totalCourses: number
  totalStudents: number
  pendingGrading: number
  averageGrade: string
}

export default function LecturerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalCourses: 0,
    totalStudents: 0,
    pendingGrading: 0,
    averageGrade: 'B+'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'LECTURER') {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/lecturer/dashboard')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setCourseStats(data.data.courseStats)
            setRecentActivity(data.data.recentActivity)
          } else {
            console.error('Failed to load dashboard data:', data.error)
          }
        } else {
          console.error('Failed to fetch dashboard data')
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user.role === 'LECTURER') {
      loadDashboardData()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading your dashboard..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'LECTURER') {
    return null
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grading': return FileText
      case 'assignment': return Plus
      case 'course': return BookOpen
      case 'announcement': return Megaphone
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'in-progress': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white -mr-4 sm:-mr-6 lg:-mr-8 mb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {session.user.name}!
              </h1>
              <p className="text-green-100 text-lg">
                Manage your courses, students, and academic activities
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{courseStats.totalCourses}</div>
                    <div className="text-sm text-green-100">Active Courses</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{courseStats.totalStudents}</div>
                    <div className="text-sm text-green-100">Total Students</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{courseStats.pendingGrading}</div>
                    <div className="text-sm text-green-100">Pending Grading</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{courseStats.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{courseStats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Grading</p>
                  <p className="text-2xl font-bold text-gray-900">{courseStats.pendingGrading}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Grade</p>
                  <p className="text-2xl font-bold text-gray-900">{courseStats.averageGrade}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common teaching tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/lecturer/courses')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Courses
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/lecturer/assignments/create')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Assignment
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/lecturer/grades')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Grade Submissions
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/lecturer/students')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  View Students
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/messages')}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/announcements')}
                >
                  <Megaphone className="h-4 w-4 mr-2" />
                  Announcements
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/timetable')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Timetable
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity & Important Updates */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Your latest teaching activities and updates
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    View All
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = getActivityIcon(activity.type)
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(activity.status)}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                          <p className="text-xs text-gray-400">{activity.date}</p>
                        </div>
                        <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Important Updates */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                  Important Updates
                </CardTitle>
                <CardDescription>
                  Stay informed about academic policies and deadlines
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-orange-900">Midterm Grading Deadline</h3>
                      <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                        Urgent
                      </Badge>
                    </div>
                    <p className="text-orange-700 text-sm mb-2">
                      All midterm grades must be submitted by March 15th, 2024.
                    </p>
                    <p className="text-orange-600 text-xs">Due in 5 days</p>
                  </div>
                  
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-blue-900">New Academic Policy</h3>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        Info
                      </Badge>
                    </div>
                    <p className="text-blue-700 text-sm mb-2">
                      Updated attendance policy for Spring 2024 semester.
                    </p>
                    <p className="text-blue-600 text-xs">Effective immediately</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
