'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  BookOpen, 
  FileText,
  TrendingUp, 
  DollarSign,
  CheckCircle,
  Clock,
  BarChart3,
  Download,
  Calendar
} from 'lucide-react'
import Loading from '@/components/ui/loading'
import { generateReportPDF } from '@/lib/pdf-export'

interface AnalyticsData {
  overview: {
    totalStudents: number
    activeLecturers: number
    totalCourses: number
    enrolledStudents: number
    totalApplications: number
    pendingApplications: number
    approvedApplications: number
    totalAssignments: number
    totalSubmissions: number
    totalAttendanceRecords: number
    totalFees: number
    paidFees: number
    pendingFees: number
    totalRevenue: number
    paymentRate: number
  }
  trends: {
    applicationTrends: Array<{ date: string; count: number }>
    enrollmentByProgramme: Array<{ programme: string; count: number }>
    topCourses: Array<{ courseCode: string; courseTitle: string; enrollmentCount: number }>
  }
  attendance: {
    stats: Array<{ status: string; count: number }>
    total: number
  }
  fees: {
    status: Array<{ status: string; count: number; totalAmount: number }>
    total: number
  }
  submissions: {
    stats: Array<{ status: string; count: number }>
    total: number
  }
  grades: {
    distribution: Array<{ grade: string; count: number }>
  }
  recentActivity: Array<any>
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchAnalytics()
    }
  }, [session, period])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics?period=${period}`)
      const data = await response.json()

      if (data.success) {
        setAnalytics(data.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (!analytics) return

    setDownloading(true)
    try {
      const reportData = {
        summary: {
          'Total Students': analytics.overview.totalStudents,
          'Active Lecturers': analytics.overview.activeLecturers,
          'Total Courses': analytics.overview.totalCourses,
          'Total Applications': analytics.overview.totalApplications,
          'Pending Applications': analytics.overview.pendingApplications,
          'Total Revenue': `$${analytics.overview.totalRevenue.toFixed(2)}`,
          'Payment Rate': `${analytics.overview.paymentRate.toFixed(1)}%`
        }
      }

      const doc = generateReportPDF(reportData, 'Analytics Dashboard Report')
      doc.save(`analytics_report_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <Loading message="Loading analytics..." />
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Comprehensive insights into your portal</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg w-full sm:w-auto text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <Button onClick={handleExportPDF} disabled={downloading} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            {downloading ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.enrolledStudents} enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Lecturers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.activeLecturers}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.totalCourses} courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.overview.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.paymentRate.toFixed(1)}% payment rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.overview.totalApplications}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.overview.pendingApplications} pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Enrollment by Programme */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment by Programme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.trends.enrollmentByProgramme.map((item) => (
                <div key={item.programme} className="flex items-center justify-between">
                  <span className="text-sm">{item.programme}</span>
                  <Badge>{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Top Enrolled Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.trends.topCourses.map((course, index) => (
                <div key={course.courseCode} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{course.courseCode}</span>
                    <p className="text-xs text-gray-500">{course.courseTitle}</p>
                  </div>
                  <Badge>{course.enrollmentCount}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.attendance.stats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{stat.status}</span>
                  <Badge>{stat.count}</Badge>
                </div>
              ))}
              <div className="pt-2 border-t">
                <span className="text-sm font-medium">Total: {analytics.attendance.total}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.grades.distribution.map((item) => (
                <div key={item.grade} className="flex items-center justify-between">
                  <span className="text-sm">Grade {item.grade}</span>
                  <Badge>{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.recentActivity.slice(0, 10).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{activity.firstName} {activity.lastName}</span>
                  <span className="text-sm text-gray-500 ml-2">{activity.applicationNumber}</span>
                </div>
                <Badge variant={activity.status === 'APPROVED' ? 'default' : 'secondary'}>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

