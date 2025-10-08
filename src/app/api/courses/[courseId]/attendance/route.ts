import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const markAttendanceSchema = z.object({
  date: z.string().transform((str) => new Date(str)),
  attendance: z.array(z.object({
    studentId: z.string(),
    status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
    notes: z.string().optional(),
  })).min(1, 'At least one attendance record is required'),
})

// GET: Fetch attendance records for a course
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
    const date = searchParams.get('date')
    const studentId = searchParams.get('studentId')

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

    // Build where clause for attendance records
    const where: any = { courseId }
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      where.date = {
        gte: startOfDay,
        lte: endOfDay
      }
    }
    if (studentId) {
      where.studentId = studentId
    }

    // Fetch attendance records
    const attendance = await prisma.attendance.findMany({
      where,
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

    // If requesting for a specific date and no records exist, return enrolled students
    if (date && attendance.length === 0 && session.user.role !== 'STUDENT') {
      const enrolledStudents = course.enrollments.map(enrollment => ({
        student: enrollment.student,
        attendance: null
      }))

      return NextResponse.json({
        success: true,
        data: {
          date,
          attendance: enrolledStudents
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: attendance
    })

  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Mark attendance for a course
export async function POST(
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

    // Only lecturers and admins can mark attendance
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only lecturers can mark attendance' },
        { status: 403 }
      )
    }

    const courseId = params.courseId
    const body = await request.json()
    const validatedData = markAttendanceSchema.parse(body)

    // Verify course exists and user is the lecturer
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (session.user.role === 'LECTURER' && course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only mark attendance for your own courses' },
        { status: 403 }
      )
    }

    // Use transaction to ensure all attendance records are created/updated
    const result = await prisma.$transaction(async (tx) => {
      const attendanceRecords = []

      for (const record of validatedData.attendance) {
        // Upsert attendance record
        const attendance = await tx.attendance.upsert({
          where: {
            studentId_courseId_date: {
              studentId: record.studentId,
              courseId,
              date: validatedData.date
            }
          },
          update: {
            status: record.status,
            notes: record.notes,
            markedBy: session.user.id
          },
          create: {
            studentId: record.studentId,
            courseId,
            date: validatedData.date,
            status: record.status,
            notes: record.notes,
            markedBy: session.user.id
          }
        })

        attendanceRecords.push(attendance)
      }

      return attendanceRecords
    })

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      data: result
    })

  } catch (error) {
    console.error('Error marking attendance:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
