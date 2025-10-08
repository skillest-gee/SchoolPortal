import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Get attendance reports for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const courseId = params.courseId
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Verify course exists and user has access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: true,
        enrollments: {
          where: studentId ? { studentId } : undefined,
          include: {
            student: {
              include: {
                studentProfile: true
              }
            }
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this course
    const hasAccess = 
      session.user.role === 'ADMIN' ||
      course.lecturerId === session.user.id ||
      (session.user.role === 'STUDENT' && course.enrollments.some(e => e.studentId === session.user.id))

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this course' },
        { status: 403 }
      )
    }

    // Build date filter
    const dateFilter: any = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Get attendance records
    const attendance = await prisma.attendance.findMany({
      where: {
        courseId,
        studentId: studentId || undefined,
        ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
      },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Calculate statistics
    const stats = {
      totalRecords: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      late: attendance.filter(a => a.status === 'LATE').length,
      excused: attendance.filter(a => a.status === 'EXCUSED').length,
    }

    // Calculate attendance percentage
    const totalAttendance = stats.present + stats.late + stats.excused
    const totalPossible = stats.totalRecords
    const attendancePercentage = totalPossible > 0 ? (totalAttendance / totalPossible) * 100 : 0

    // Group by student if no specific student requested
    let studentStats = []
    if (!studentId) {
      const studentMap = new Map()

      // Initialize all enrolled students
      course.enrollments.forEach(enrollment => {
        studentMap.set(enrollment.studentId, {
          student: enrollment.student,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
          percentage: 0
        })
      })

      // Count attendance for each student
      attendance.forEach(record => {
        const studentStat = studentMap.get(record.studentId)
        if (studentStat) {
          studentStat[record.status.toLowerCase()]++
          studentStat.total++
        }
      })

      // Calculate percentages
      studentMap.forEach(studentStat => {
        const totalAttendance = studentStat.present + studentStat.late + studentStat.excused
        studentStat.percentage = studentStat.total > 0 ? (totalAttendance / studentStat.total) * 100 : 0
      })

      studentStats = Array.from(studentMap.values())
    }

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: course.id,
          code: course.code,
          title: course.title
        },
        attendance,
        stats: {
          ...stats,
          attendancePercentage: Math.round(attendancePercentage * 100) / 100
        },
        studentStats,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null
        }
      }
    })

  } catch (error) {
    console.error('Error fetching attendance reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
