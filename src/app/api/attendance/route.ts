import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { attendanceSchema, validateData } from '@/lib/validation'
import { withAPIRateLimit } from '@/lib/rate-limit'
import { handleError, handleDatabaseError } from '@/lib/error-handling'

export const GET = withAPIRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const studentId = searchParams.get('studentId')
    const date = searchParams.get('date')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause based on user role and filters
    let whereClause: any = {}
    
    if (courseId) {
      whereClause.courseId = courseId
    }
    
    if (studentId) {
      whereClause.studentId = studentId
    }
    
    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      
      whereClause.date = {
        gte: startDate,
        lt: endDate
      }
    }

    // For students, only show their own attendance
    if (session.user.role === 'STUDENT') {
      whereClause.studentId = session.user.id
    }

    // For lecturers, only show attendance for their courses
    if (session.user.role === 'LECTURER') {
      const taughtCourses = await prisma.course.findMany({
        where: { lecturerId: session.user.id },
        select: { id: true }
      })
      
      whereClause.courseId = {
        in: taughtCourses.map(c => c.id)
      }
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        course: {
          include: {
            lecturer: {
              include: {
                lecturerProfile: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.attendance.count({ where: whereClause })

    return NextResponse.json({
      success: true,
      data: attendance,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleError(error, '/api/attendance')
  }
})

export const POST = withAPIRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only lecturers and admins can mark attendance
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = validateData(attendanceSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const attendanceData = validation.data!

    // Check if lecturer owns the course
    if (session.user.role === 'LECTURER') {
      const course = await prisma.course.findFirst({
        where: {
          id: attendanceData.courseId,
          lecturerId: session.user.id
        }
      })
      
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: attendanceData.studentId,
        courseId: attendanceData.courseId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Student is not enrolled in this course' },
        { status: 400 }
      )
    }

    // Check if attendance already exists for this student, course, and date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: attendanceData.studentId,
        courseId: attendanceData.courseId,
        date: new Date(attendanceData.date)
      }
    })

    if (existingAttendance) {
      // Update existing attendance
      const attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: attendanceData.status,
          notes: attendanceData.notes,
          markedBy: session.user.id
        },
        include: {
          student: {
            include: {
              studentProfile: true
            }
          },
          course: true
        }
      })

      return NextResponse.json({
        success: true,
        data: attendance,
        message: 'Attendance updated successfully'
      })
    } else {
      // Create new attendance record
      const attendance = await prisma.attendance.create({
        data: {
          studentId: attendanceData.studentId,
          courseId: attendanceData.courseId,
          date: new Date(attendanceData.date),
          status: attendanceData.status,
          notes: attendanceData.notes,
          markedBy: session.user.id
        },
        include: {
          student: {
            include: {
              studentProfile: true
            }
          },
          course: true
        }
      })

      return NextResponse.json({
        success: true,
        data: attendance,
        message: 'Attendance marked successfully'
      }, { status: 201 })
    }
  } catch (error) {
    return handleError(handleDatabaseError(error), '/api/attendance')
  }
})
