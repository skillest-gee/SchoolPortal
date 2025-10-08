import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createQuestionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string()).min(2, 'At least 2 options required'),
  correctAnswer: z.number().min(0, 'Correct answer index is required'),
  points: z.number().min(1, 'Points must be at least 1').default(1),
  order: z.number().min(1, 'Order must be at least 1'),
})

// GET: Fetch questions for a quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const quizId = params.quizId

    // Verify quiz exists and user has access
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          include: {
            lecturer: true,
            enrollments: {
              where: { studentId: session.user.id }
            }
          }
        }
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this quiz
    const hasAccess = 
      session.user.role === 'ADMIN' ||
      quiz.course.lecturerId === session.user.id ||
      quiz.course.enrollments.length > 0

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this quiz' },
        { status: 403 }
      )
    }

    // Fetch questions
    const questions = await prisma.quizQuestion.findMany({
      where: { quizId },
      orderBy: { order: 'asc' }
    })

    // For students, don't include correct answers
    if (session.user.role === 'STUDENT') {
      const safeQuestions = questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        points: q.points,
        order: q.order
      }))
      
      return NextResponse.json({
        success: true,
        data: safeQuestions
      })
    }

    return NextResponse.json({
      success: true,
      data: questions
    })

  } catch (error) {
    console.error('Error fetching quiz questions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create question for a quiz (lecturer only)
export async function POST(
  request: NextRequest,
  { params }: { params: { quizId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only lecturers and admins can create questions
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only lecturers can create questions' },
        { status: 403 }
      )
    }

    const quizId = params.quizId
    const body = await request.json()
    const validatedData = createQuestionSchema.parse(body)

    // Verify quiz exists and user is the lecturer
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: true
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    if (session.user.role === 'LECTURER' && quiz.course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create questions for your own quizzes' },
        { status: 403 }
      )
    }

    // Validate correct answer index
    if (validatedData.correctAnswer >= validatedData.options.length) {
      return NextResponse.json(
        { error: 'Correct answer index is out of range' },
        { status: 400 }
      )
    }

    // Create the question
    const question = await prisma.quizQuestion.create({
      data: {
        ...validatedData,
        quizId,
        questionType: 'MULTIPLE_CHOICE',
        options: JSON.stringify(validatedData.options),
        correctAnswer: validatedData.correctAnswer.toString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Question created successfully',
      data: question
    })

  } catch (error) {
    console.error('Error creating question:', error)
    
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
