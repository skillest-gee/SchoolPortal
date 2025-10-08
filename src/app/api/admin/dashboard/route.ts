import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch admin dashboard data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can access dashboard data
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get system statistics
    const [
      totalStudents,
      activeLecturers,
      activeCourses,
      totalApplications,
      pendingApplications,
      recentUsers,
      recentApplications,
      systemAlerts
    ] = await Promise.all([
      // Total students
      prisma.user.count({
        where: { role: 'STUDENT', isActive: true }
      }),
      
      // Active lecturers
      prisma.user.count({
        where: { role: 'LECTURER', isActive: true }
      }),
      
      // Active courses
      prisma.course.count({
        where: { isActive: true }
      }),
      
      // Total applications
      prisma.application.count(),
      
      // Pending applications
      prisma.application.count({
        where: { status: 'PENDING' }
      }),
      
      // Recent users (last 7 days)
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          studentProfile: true,
          lecturerProfile: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Recent applications (last 7 days)
      prisma.application.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          programme: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // System alerts (notifications)
      prisma.notification.findMany({
        where: {
          type: { in: ['WARNING', 'ERROR', 'SUCCESS', 'INFO'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    // Calculate system health (based on various metrics)
    const systemHealth = calculateSystemHealth(totalStudents, activeLecturers, activeCourses)

    // Format system alerts
    const formattedAlerts = systemAlerts.map(alert => ({
      id: alert.id,
      type: alert.type.toLowerCase() as 'success' | 'warning' | 'error' | 'info',
      title: alert.title,
      description: alert.content,
      date: formatRelativeTime(alert.createdAt),
      priority: getPriorityFromType(alert.type)
    }))

    // Format recent activity
    const recentActivity = [
      ...recentUsers.map(user => ({
        id: user.id,
        type: user.role.toLowerCase() as 'user' | 'system' | 'financial' | 'academic',
        title: `New ${user.role.toLowerCase()} registered`,
        description: `${user.name} - ${user.role}`,
        date: formatRelativeTime(user.createdAt),
        status: 'completed' as const
      })),
      ...recentApplications.map(app => ({
        id: app.id,
        type: 'academic' as const,
        title: 'New application submitted',
        description: `${app.firstName} ${app.lastName} - ${app.programme.name}`,
        date: formatRelativeTime(app.createdAt),
        status: app.status === 'PENDING' ? 'pending' as const : 'completed' as const
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    const dashboardData = {
      systemStats: {
        totalStudents,
        activeLecturers,
        activeCourses,
        totalApplications,
        pendingApplications,
        systemHealth
      },
      systemAlerts: formattedAlerts,
      recentActivity
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateSystemHealth(students: number, lecturers: number, courses: number): string {
  // Simple health calculation based on data availability
  const healthScore = Math.min(100, Math.max(0, 
    (students > 0 ? 25 : 0) + 
    (lecturers > 0 ? 25 : 0) + 
    (courses > 0 ? 25 : 0) + 
    25 // Base score
  ))
  return `${healthScore}%`
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return date.toLocaleDateString()
}

function getPriorityFromType(type: string): 'high' | 'medium' | 'low' {
  switch (type) {
    case 'ERROR': return 'high'
    case 'WARNING': return 'medium'
    case 'SUCCESS': 
    case 'INFO': 
    default: return 'low'
  }
}

