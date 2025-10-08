import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const enrollSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const studentId = params.id

    // Verify that the student ID matches the session user ID
    if (studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only enroll yourself' },
        { status: 403 }
      )
    }

    // Verify that the user is a student
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only students can enroll in courses' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { courseId } = enrollSchema.parse(body)

    // Check if the course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: {
          include: {
            lecturerProfile: true
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

    if (!course.isActive) {
      return NextResponse.json(
        { error: 'Course is not available for enrollment' },
        { status: 400 }
      )
    }

    // Check if student is already enrolled in this course
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId
        }
      }
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { 
          error: 'You are already enrolled in this course',
          enrollment: existingEnrollment
        },
        { status: 400 }
      )
    }

    // Create the enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        enrollmentDate: new Date(),
        status: 'ENROLLED'
      },
      include: {
        course: {
          include: {
            lecturer: {
              include: {
                lecturerProfile: true
              }
            }
          }
        }
      }
    })

    // Create an initial academic record for the current semester
    await prisma.academicRecord.create({
      data: {
        studentId,
        courseId,
        semester: '1st Semester', // Default semester
        academicYear: '2024/2025' // Current academic year
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        id: enrollment.id,
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        enrollmentDate: enrollment.enrollmentDate,
        status: enrollment.status,
        course: {
          id: enrollment.course.id,
          code: enrollment.course.code,
          title: enrollment.course.title,
          credits: enrollment.course.credits,
          lecturer: {
            id: enrollment.course.lecturer.id,
            name: enrollment.course.lecturer.name,
            profile: enrollment.course.lecturer.lecturerProfile
          }
        }
      }
    })

  } catch (error) {
    console.error('Enrollment error:', error)
    
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
