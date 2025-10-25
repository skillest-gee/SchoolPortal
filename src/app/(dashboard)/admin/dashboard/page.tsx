'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  FileText,
  TrendingUp, 
  User, 
  Settings, 
  DollarSign,
  MessageSquare, 
  Megaphone, 
  Clock, 
  Target,
  BarChart3,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface SystemStats {
  totalStudents: number
  activeLecturers: number
  activeCourses: number
  totalApplications: number
  pendingApplications: number
  systemHealth: string
}

interface SystemAlert {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
  date: string
  priority: 'high' | 'medium' | 'low'
}

interface RecentActivity {
  id: string
  type: 'user' | 'system' | 'financial' | 'academic'
  title: string
  description: string
  date: string
  status: 'completed' | 'pending' | 'in-progress'
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalStudents: 0,
    activeLecturers: 0,
    activeCourses: 0,
    totalApplications: 0,
    pendingApplications: 0,
    systemHealth: '99.9%'
  })
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      
      try {
        const response = await fetch('/api/admin/dashboard')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setSystemStats(data.data.systemStats)
            setSystemAlerts(data.data.systemAlerts)
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

    if (session?.user.role === 'ADMIN') {
      loadDashboardData()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading admin dashboard..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user': return Users
      case 'system': return Activity
      case 'financial': return DollarSign
      case 'academic': return BookOpen
      default: return FileText
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white -mr-4 sm:-mr-6 lg:-mr-8 mb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {session.user.name}!
              </h1>
              <p className="text-purple-100 text-lg">
                System overview and administrative controls
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{systemStats.totalStudents}</div>
                    <div className="text-sm text-purple-100">Total Students</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{systemStats.activeLecturers}</div>
                    <div className="text-sm text-purple-100">Active Lecturers</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{systemStats.activeCourses}</div>
                    <div className="text-sm text-purple-100">Active Courses</div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalStudents.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Lecturers</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.activeLecturers}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.activeCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.systemHealth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.totalApplications.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{systemStats.pendingApplications.toLocaleString()}</p>
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
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Administrative tasks and system management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/admin/applications')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Applications
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/admin/users')}
                >
                  <User className="h-4 w-4 mr-2" />
                  Manage Users
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
                  onClick={() => router.push('/admin/announcements')}
                >
                  <Megaphone className="h-4 w-4 mr-2" />
                  Manage Announcements
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/timetable')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Timetable Management
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/admin/courses')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Manage Courses
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/admin/registration')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Course Registration
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/admin/settings')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Alerts & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Alerts */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                      System Alerts
                    </CardTitle>
                    <CardDescription>
                      Important system notifications and updates
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
                  {systemAlerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                        <Badge className={getAlertColor(alert.type)}>
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Priority: {alert.priority}</span>
                        <span>{alert.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest administrative activities and system events
                </CardDescription>
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
          </div>
        </div>
      </div>
    </div>
  )
}
