import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get basic statistics
    const [
      totalStudents,
      activeLecturers,
      totalCourses,
      totalApplications,
      pendingApplications,
      approvedApplications,
      enrolledStudents,
      totalAssignments,
      totalSubmissions,
      totalAttendanceRecords,
      totalFees,
      paidFees,
      totalRevenue
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { role: 'LECTURER', isActive: true } }),
      prisma.course.count({ where: { isActive: true } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: 'PENDING' } }),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
      prisma.assignment.count(),
      prisma.submission.count(),
      prisma.attendance.count(),
      prisma.fee.count(),
      prisma.fee.count({ where: { isPaid: true } }),
      prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true }
      })
    ])

    // Get recent activity (last 30 days)
    const recentApplications = await prisma.application.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        applicationNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
        programme: true
      }
    })

    // Get application trends (daily for last period)
    const applicationTrends = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = await prisma.application.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })

      applicationTrends.push({
        date: date.toISOString().split('T')[0],
        count
      })
    }

    // Get student enrollment by programme
    const enrollmentByProgramme = await prisma.studentProfile.groupBy({
      by: ['programme'],
      where: {
        user: {
          isActive: true
        }
      },
      _count: {
        programme: true
      }
    })

    // Get course enrollment stats
    const courseEnrollment = await prisma.enrollment.groupBy({
      by: ['courseId'],
      _count: {
        courseId: true
      },
      orderBy: {
        _count: {
          courseId: 'desc'
        }
      },
      take: 10
    })

    const courseDetails = await Promise.all(
      courseEnrollment.map(async (enrollment) => {
        const course = await prisma.course.findUnique({
          where: { id: enrollment.courseId },
          select: { code: true, title: true }
        })
        return {
          courseCode: course?.code || 'N/A',
          courseTitle: course?.title || 'N/A',
          enrollmentCount: enrollment._count.courseId
        }
      })
    )

    // Get attendance stats
    const attendanceStats = await prisma.attendance.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    // Get fee payment status
    const feeStatus = await prisma.fee.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      _sum: {
        amount: true
      }
    })

    // Get submission stats
    const submissionStats = await prisma.submission.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    // Get grade distribution
    const gradeDistribution = await prisma.academicRecord.groupBy({
      by: ['grade'],
      where: {
        grade: { not: null }
      },
      _count: {
        grade: true
      },
      orderBy: {
        grade: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          activeLecturers,
          totalCourses,
          enrolledStudents,
          totalApplications,
          pendingApplications,
          approvedApplications,
          totalAssignments,
          totalSubmissions,
          totalAttendanceRecords,
          totalFees,
          paidFees,
          pendingFees: totalFees - paidFees,
          totalRevenue: totalRevenue._sum.amount || 0,
          paymentRate: totalFees > 0 ? (paidFees / totalFees) * 100 : 0
        },
        trends: {
          applicationTrends,
          enrollmentByProgramme: enrollmentByProgramme.map(item => ({
            programme: item.programme || 'Unknown',
            count: item._count.programme
          })),
          topCourses: courseDetails
        },
        attendance: {
          stats: attendanceStats.map(item => ({
            status: item.status,
            count: item._count.status
          })),
          total: attendanceStats.reduce((sum, item) => sum + item._count.status, 0)
        },
        fees: {
          status: feeStatus.map(item => ({
            status: item.status,
            count: item._count.status,
            totalAmount: item._sum.amount || 0
          })),
          total: feeStatus.reduce((sum, item) => sum + item._count.status, 0)
        },
        submissions: {
          stats: submissionStats.map(item => ({
            status: item.status,
            count: item._count.status
          })),
          total: submissionStats.reduce((sum, item) => sum + item._count.status, 0)
        },
        grades: {
          distribution: gradeDistribution.map(item => ({
            grade: item.grade,
            count: item._count.grade
          }))
        },
        recentActivity: recentApplications
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

