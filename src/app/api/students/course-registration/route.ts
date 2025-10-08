import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registrationSchema = z.object({
  courseIds: z.array(z.string()).min(1, 'At least one course must be selected')
})

// GET: Fetch available courses for registration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = session.user.id

    // Get student profile to determine program
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Get all active courses
    const courses = await prisma.course.findMany({
      where: {
        isActive: true
      },
      include: {
        lecturer: true,
        enrollments: {
          where: {
            studentId: studentId
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Check if student has already registered for this semester
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId,
        status: 'ACTIVE'
      }
    })

    const hasRegistered = existingEnrollments.length > 0

    // Transform courses data
    const coursesWithEnrollmentStatus = courses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.title,
      description: course.description,
      credits: course.credits,
      lecturer: {
        name: course.lecturer.name || 'TBA'
      },
      isEnrolled: course.enrollments.length > 0
    }))

    // Determine registration status
    const currentDate = new Date()
    const semesterStart = new Date('2024-09-01') // Fall semester start
    const semesterEnd = new Date('2024-12-15') // Fall semester end
    const registrationDeadline = new Date('2024-09-15') // Registration deadline

    let registrationStatus: 'OPEN' | 'CLOSED' | 'COMPLETED' = 'CLOSED'
    let canRegister = false

    if (hasRegistered) {
      registrationStatus = 'COMPLETED'
    } else if (currentDate >= semesterStart && currentDate <= registrationDeadline) {
      registrationStatus = 'OPEN'
      canRegister = true
    }

    return NextResponse.json({
      success: true,
      data: {
        courses: coursesWithEnrollmentStatus,
        totalCredits: existingEnrollments.length,
        canRegister,
        registrationStatus,
        studentProfile: {
          level: studentProfile.level,
          programme: studentProfile.programme
        }
      }
    })

  } catch (error) {
    console.error('Error fetching course registration data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Register for courses
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { courseIds } = registrationSchema.parse(body)

    const studentId = session.user.id

    // Check if student has already registered
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId,
        status: 'ACTIVE'
      }
    })

    if (existingEnrollments.length > 0) {
      return NextResponse.json(
        { error: 'You have already registered for this semester' },
        { status: 400 }
      )
    }

    // Validate courses exist and are active
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        isActive: true
      }
    })

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'One or more courses are invalid or inactive' },
        { status: 400 }
      )
    }

    // Calculate total credits
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)

    if (totalCredits < 12 || totalCredits > 18) {
      return NextResponse.json(
        { error: 'Total credits must be between 12 and 18' },
        { status: 400 }
      )
    }

    // Create enrollments
    const enrollments = await Promise.all(
      courseIds.map(courseId =>
        prisma.enrollment.create({
          data: {
            studentId: studentId,
            courseId: courseId,
            status: 'ACTIVE',
            enrollmentDate: new Date()
          }
        })
      )
    )

    // Create academic records for each course
    await Promise.all(
      courseIds.map(courseId =>
        prisma.academicRecord.create({
          data: {
            studentId: studentId,
            courseId: courseId,
            semester: '1st Semester',
            academicYear: '2024/2025',
            grade: null, // No grade yet
            points: null
          }
        })
      )
    )

    // Create notification for successful registration
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Course Registration Successful',
        content: `You have successfully registered for ${courseIds.length} courses (${totalCredits} credits) for the 1st Semester 2024/2025.`,
        type: 'SUCCESS'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Course registration completed successfully',
      data: {
        enrollments: enrollments.length,
        totalCredits,
        courses: courses.map(course => ({
          code: course.code,
          title: course.title,
          credits: course.credits
        }))
      }
    })

  } catch (error) {
    console.error('Error registering for courses:', error)
    
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
