'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Megaphone, 
  Clock, 
  Library,
  AlertCircle, 
  Award,
  CheckCircle,
  Clock as ClockIcon,
  ExternalLink,
  GraduationCap,
  Target,
  BarChart3
} from 'lucide-react'
import Loading, { LoadingState, ErrorAlert } from '@/components/ui/loading'
import { OptimizedLoading } from '@/components/ui/instant-loading'
import { DashboardSkeleton } from '@/components/ui/skeleton'
import { parseApiError, getUserFriendlyMessage } from '@/lib/error-handling'

interface Announcement {
  id: string
  title: string
  content: string
  priority: 'high' | 'medium' | 'low'
  date: string
  author: string
}

interface RecentActivity {
  id: string
  type: 'assignment' | 'grade' | 'announcement' | 'payment'
  title: string
  description: string
  date: string
  status: 'completed' | 'pending' | 'overdue'
}

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Fetch dashboard data from API
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/students/dashboard')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const apiError = parseApiError({
          message: errorData.error || `HTTP ${response.status}`,
          statusCode: response.status
        })
        throw new Error(getUserFriendlyMessage(apiError))
      }
      return response.json()
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on client errors (4xx)
      if (error?.message?.includes('HTTP 4')) {
        return false
      }
      return failureCount < 2
    },
  })

  useEffect(() => {
    // Only redirect if we're definitely unauthenticated or wrong role
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session && session.user.role !== 'STUDENT') {
      router.push('/auth/login')
    }
  }, [status, session?.user.role, router])


  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    )
  }

  const data = dashboardData?.data
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading your dashboard..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'assignment': return FileText
      case 'grade': return TrendingUp
      case 'announcement': return Megaphone
      case 'payment': return DollarSign
      default: return ClockIcon
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'overdue': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white -mr-4 sm:-mr-6 lg:-mr-8 mb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, {data?.student?.name || 'Student'}!
              </h1>
              <p className="text-blue-100 text-base sm:text-lg">
                Here's your academic overview for this semester
              </p>
            </div>
            <div className="w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6">
                <div className="grid grid-cols-3 gap-4 sm:flex sm:items-center sm:space-x-4">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">{(data?.stats?.currentGPA || 0).toFixed(1)}</div>
                    <div className="text-xs sm:text-sm text-blue-100">Current GPA</div>
                  </div>
                  <div className="hidden sm:block w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">{data?.stats?.totalCourses || 0}</div>
                    <div className="text-xs sm:text-sm text-blue-100">Enrolled Courses</div>
                  </div>
                  <div className="hidden sm:block w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold">{data?.stats?.totalCredits || 0}</div>
                    <div className="text-xs sm:text-sm text-blue-100">Credits</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Registration Alert for New Students */}
      {(data?.stats?.totalCourses || 0) === 0 && (
        <div className="px-4 sm:px-6 lg:px-8 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-medium text-yellow-800">Course Registration Required</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  You haven't registered for any courses yet. Please register for your courses to access all features.
                </p>
                <Button 
                  onClick={() => router.push('/student/course-registration')}
                  className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white"
                  size="sm"
                >
                  Register for Courses
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Enrolled Courses</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{data?.stats?.totalCourses || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Current GPA</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{(data?.stats?.currentGPA || 0).toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Assignments Due</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{data?.stats?.pendingAssignments || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Credits</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{data?.stats?.totalCredits || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Important Announcements */}
          <div className="lg:col-span-2">
            <Card className="bg-white shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Megaphone className="h-5 w-5 mr-2 text-blue-600" />
                      Important Announcements
                    </CardTitle>
                    <CardDescription>
                      Stay updated with the latest school news and updates
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => router.push('/announcements')}>
                    View All
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(data?.announcements || []).map((announcement: any) => (
                    <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                        <Badge className={getPriorityColor(announcement.priority)}>
                          {announcement.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>By {announcement.author}</span>
                        <span>{announcement.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-green-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/student/courses')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  My Courses
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/student/assignments')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Assignments
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/student/grades')}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Grades
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/student/finances')}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Finances
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/library')}
                >
                  <Library className="h-4 w-4 mr-2" />
                  Digital Library
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(data?.recentActivity || []).map((activity: any) => {
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
          </div>
        </div>
      </div>
    </div>
  )
}
