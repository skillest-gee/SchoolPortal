import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  timeLimit: z.number().min(1, 'Time limit must be at least 1 minute').optional(),
  maxAttempts: z.number().min(1, 'Max attempts must be at least 1').default(1),
  isActive: z.boolean().default(true),
})

// GET: Fetch quizzes for a course
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

    // Verify course exists and user has access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: true,
        enrollments: {
          where: { studentId: session.user.id }
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
      course.enrollments.length > 0

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this course' },
        { status: 403 }
      )
    }

    // Fetch quizzes with attempt info for students
    const quizzes = await prisma.quiz.findMany({
      where: { courseId },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        attempts: session.user.role === 'STUDENT' ? {
          where: { studentId: session.user.id },
          orderBy: { createdAt: 'desc' }
        } : true,
        _count: {
          select: {
            attempts: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: quizzes
    })

  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new quiz (lecturer only)
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

    // Only lecturers and admins can create quizzes
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only lecturers can create quizzes' },
        { status: 403 }
      )
    }

    const courseId = params.courseId
    const body = await request.json()
    const validatedData = createQuizSchema.parse(body)

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
        { error: 'Forbidden: You can only create quizzes for your own courses' },
        { status: 403 }
      )
    }

    // Create the quiz
    const quiz = await prisma.quiz.create({
      data: {
        ...validatedData,
        courseId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    })

  } catch (error) {
    console.error('Error creating quiz:', error)
    
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
