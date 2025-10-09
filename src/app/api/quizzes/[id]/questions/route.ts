import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { quizQuestionSchema, validateData } from '@/lib/validation'
import { handleError, handleDatabaseError, NotFoundError } from '@/lib/error-handling'

export const GET = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: { course: true }
    })

    if (!quiz) {
      throw new NotFoundError('Quiz not found')
    }

    // Check access permissions
    if (session.user.role === 'STUDENT') {
      // Check if student is enrolled in the course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: session.user.id,
          courseId: quiz.courseId
        }
      })
      
      if (!enrollment) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    } else if (session.user.role === 'LECTURER') {
      // Check if lecturer owns the course
      if (quiz.course.lecturerId !== session.user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const questions = await prisma.quizQuestion.findMany({
      where: { quizId: params.id },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: questions
    })
  } catch (error) {
    return handleError(error, `/api/quizzes/${params.id}/questions`)
  }
})

export const POST = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only lecturers and admins can create quiz questions
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = validateData(quizQuestionSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const questionData = validation.data!

    // Check if quiz exists and lecturer owns it
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: { course: true }
    })

    if (!quiz) {
      throw new NotFoundError('Quiz not found')
    }

    if (session.user.role === 'LECTURER' && quiz.course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const question = await prisma.quizQuestion.create({
      data: {
        quizId: params.id,
        question: questionData.question,
        questionType: questionData.questionType,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        points: questionData.points,
        order: questionData.order
      }
    })

    return NextResponse.json({
      success: true,
      data: question
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/quizzes/${params.id}/questions`)
  }
})
