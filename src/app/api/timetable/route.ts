import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTimetableSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  room: z.string().min(1, 'Room is required'),
  semester: z.enum(['FIRST', 'SECOND', 'SUMMER']).default('FIRST'),
  academicYear: z.string().min(1, 'Academic year is required'),
  classType: z.enum(['LECTURE', 'TUTORIAL', 'LAB', 'SEMINAR', 'EXAM']).default('LECTURE'),
  notes: z.string().optional(),
})

// GET: Fetch timetable entries
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const dayOfWeek = searchParams.get('dayOfWeek')
    const semester = searchParams.get('semester')
    const academicYear = searchParams.get('academicYear')
    const classType = searchParams.get('classType')
    const room = searchParams.get('room')

    // Build where clause
    const where: any = {}

    if (courseId) {
      where.courseId = courseId
    }
    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek
    }
    if (semester) {
      where.semester = semester
    }
    if (academicYear) {
      where.academicYear = academicYear
    }
    if (classType) {
      where.classType = classType
    }
    if (room) {
      where.room = room
    }

    // For students, only show their enrolled courses
    if (session.user.role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({
        where: { studentId: session.user.id },
        select: { courseId: true }
      })
      
      const enrolledCourseIds = enrollments.map(e => e.courseId)
      where.courseId = { in: enrolledCourseIds }
    }

    // For lecturers, only show their courses
    if (session.user.role === 'LECTURER') {
      const courses = await prisma.course.findMany({
        where: { lecturerId: session.user.id },
        select: { id: true }
      })
      
      const courseIds = courses.map(c => c.id)
      where.courseId = { in: courseIds }
    }

    const timetable = await prisma.timetableEntry.findMany({
      where,
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: timetable
    })

  } catch (error) {
    console.error('Error fetching timetable:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new timetable entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins and lecturers can create timetable entries
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators and lecturers can create timetable entries' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createTimetableSchema.parse(body)

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: validatedData.courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if lecturer has access to this course
    if (session.user.role === 'LECTURER' && course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create timetables for your own courses' },
        { status: 403 }
      )
    }

    // Check for time conflicts
    const conflictingEntry = await prisma.timetableEntry.findFirst({
      where: {
        dayOfWeek: validatedData.dayOfWeek,
        room: validatedData.room,
        OR: [
          {
            AND: [
              { startTime: { lte: validatedData.startTime } },
              { endTime: { gt: validatedData.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: validatedData.endTime } },
              { endTime: { gte: validatedData.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: validatedData.startTime } },
              { endTime: { lte: validatedData.endTime } }
            ]
          }
        ]
      }
    })

    if (conflictingEntry) {
      return NextResponse.json(
        { error: 'Time conflict detected. Another class is scheduled in the same room at this time.' },
        { status: 400 }
      )
    }

    // Create the timetable entry
    const timetableEntry = await prisma.timetableEntry.create({
      data: validatedData,
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Timetable entry created successfully',
      data: timetableEntry
    })

  } catch (error) {
    console.error('Error creating timetable entry:', error)
    
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
