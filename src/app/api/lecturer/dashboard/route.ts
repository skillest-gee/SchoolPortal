import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lecturerId = session.user.id

    // Get lecturer's courses
    const courses = await prisma.course.findMany({
      where: {
        lecturerId: lecturerId,
        isActive: true
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    // Calculate total students across all courses
    const totalStudents = courses.reduce((sum, course) => sum + course._count.enrollments, 0)

    // Get pending assignments that need grading
    const pendingGrading = await prisma.submission.count({
      where: {
        assignment: {
          course: {
            lecturerId: lecturerId
          }
        },
        status: 'SUBMITTED'
      }
    })

    // Get recent activity (last 10 activities)
    const recentActivity = await prisma.assignment.findMany({
      where: {
        course: {
          lecturerId: lecturerId
        }
      },
      include: {
        course: true,
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    // Get average grade for lecturer's courses
    const academicRecords = await prisma.academicRecord.findMany({
      where: {
        course: {
          lecturerId: lecturerId
        },
        grade: {
          not: null
        }
      },
      select: {
        grade: true
      }
    })

    const averageGrade = academicRecords.length > 0 
      ? (academicRecords.reduce((sum, record) => sum + (parseFloat(record.grade || '0') || 0), 0) / academicRecords.length).toFixed(1)
      : 'N/A'

    // Format recent activity
    const formattedActivity = recentActivity.map(assignment => ({
      id: assignment.id,
      type: 'assignment' as const,
      title: 'Assignment created',
      description: `${assignment.course.code} - ${assignment.title}`,
      date: new Date(assignment.createdAt).toLocaleDateString(),
      status: 'completed' as const
    }))

    // Get important updates (announcements)
    const importantUpdates = await prisma.announcement.findMany({
      where: {
        isActive: true,
        targetAudience: {
          in: ['ALL', 'LECTURERS']
        }
      },
      include: {
        author: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    const dashboardData = {
      courseStats: {
        totalCourses: courses.length,
        totalStudents: totalStudents,
        pendingGrading: pendingGrading,
        averageGrade: averageGrade
      },
      recentActivity: formattedActivity,
      importantUpdates: importantUpdates.map(update => ({
        id: update.id,
        title: update.title,
        content: update.content,
        type: update.type,
        priority: update.priority,
        createdAt: update.createdAt,
        author: update.author.name
      }))
    }

    return NextResponse.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Error fetching lecturer dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
