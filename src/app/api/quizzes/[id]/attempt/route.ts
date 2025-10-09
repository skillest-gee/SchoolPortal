import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleError, handleDatabaseError, NotFoundError, ConflictError } from '@/lib/error-handling'

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

    // Only students can attempt quizzes
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { answers } = body

    // Check if quiz exists
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        course: true,
        questions: true
      }
    })

    if (!quiz) {
      throw new NotFoundError('Quiz not found')
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: session.user.id,
        courseId: quiz.courseId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    // Check if quiz is active and within time limits
    const now = new Date()
    if (!quiz.isActive) {
      return NextResponse.json(
        { error: 'Quiz is not active' },
        { status: 400 }
      )
    }

    if (quiz.startDate && now < quiz.startDate) {
      return NextResponse.json(
        { error: 'Quiz has not started yet' },
        { status: 400 }
      )
    }

    if (quiz.endDate && now > quiz.endDate) {
      return NextResponse.json(
        { error: 'Quiz has ended' },
        { status: 400 }
      )
    }

    // Check attempt limits
    const existingAttempts = await prisma.quizAttempt.findMany({
      where: {
        quizId: params.id,
        studentId: session.user.id
      }
    })

    if (existingAttempts.length >= quiz.maxAttempts) {
      throw new ConflictError('Maximum attempts exceeded')
    }

    // Calculate score
    let totalScore = 0
    let correctAnswers = 0
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0)

    const quizAnswers = []
    for (const answer of answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId)
      if (!question) continue

      const isCorrect = answer.answer === question.correctAnswer
      const points = isCorrect ? question.points : 0
      
      totalScore += points
      if (isCorrect) correctAnswers++

      quizAnswers.push({
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
        points
      })
    }

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId: params.id,
        studentId: session.user.id,
        score: totalScore,
        totalPoints,
        timeSpent: body.timeSpent || 0,
        completedAt: now
      }
    })

    // Create quiz answers
    await prisma.quizAnswer.createMany({
      data: quizAnswers.map(answer => ({
        attemptId: attempt.id,
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect: answer.isCorrect,
        points: answer.points
      }))
    })

    // Return attempt with answers
    const attemptWithAnswers = await prisma.quizAttempt.findUnique({
      where: { id: attempt.id },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        attempt: attemptWithAnswers,
        score: totalScore,
        totalPoints,
        correctAnswers,
        totalQuestions: quiz.questions.length,
        percentage: Math.round((totalScore / totalPoints) * 100)
      },
      message: 'Quiz submitted successfully'
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/quizzes/${params.id}/attempt`)
  }
})
