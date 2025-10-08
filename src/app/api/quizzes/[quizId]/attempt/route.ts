import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submitAttemptSchema = z.object({
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.number()
  })).min(1, 'At least one answer is required'),
  timeSpent: z.number().min(0, 'Time spent must be non-negative').optional(),
})

// POST: Submit quiz attempt
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

    // Only students can submit quiz attempts
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Only students can submit quiz attempts' },
        { status: 403 }
      )
    }

    const quizId = params.quizId
    const body = await request.json()
    const validatedData = submitAttemptSchema.parse(body)

    // Verify quiz exists and get course info
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { studentId: session.user.id }
            }
          }
        },
        questions: true
      }
    })

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    // Check if student is enrolled in the course
    if (quiz.course.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    // Check if quiz is active
    if (!quiz.isActive) {
      return NextResponse.json(
        { error: 'This quiz is not currently active' },
        { status: 400 }
      )
    }

    // Check attempt limit
    const existingAttempts = await prisma.quizAttempt.count({
      where: {
        quizId,
        studentId: session.user.id
      }
    })

    if (existingAttempts >= quiz.maxAttempts) {
      return NextResponse.json(
        { error: `You have reached the maximum number of attempts (${quiz.maxAttempts})` },
        { status: 400 }
      )
    }

    // Calculate score
    let totalScore = 0
    let maxScore = 0

    for (const question of quiz.questions) {
      maxScore += question.points
      const answer = validatedData.answers.find(a => a.questionId === question.id)
      if (answer && answer.answer.toString() === question.correctAnswer) {
        totalScore += question.points
      }
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0

    // Create the attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        studentId: session.user.id,
        score: percentage,
        totalPoints: maxScore,
        timeSpent: validatedData.timeSpent,
        completedAt: new Date()
      }
    })

    // Create individual answers
    for (const answer of validatedData.answers) {
      const question = quiz.questions.find(q => q.id === answer.questionId)
      const isCorrect = !!(question && answer.answer.toString() === question.correctAnswer)
      const points = isCorrect ? (question?.points || 0) : 0
      
      await prisma.quizAnswer.create({
        data: {
          attemptId: attempt.id,
          questionId: answer.questionId,
          answer: answer.answer.toString(),
          isCorrect,
          points
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        attempt,
        score: totalScore,
        maxScore,
        percentage: Math.round(percentage * 100) / 100
      }
    })

  } catch (error) {
    console.error('Error submitting quiz attempt:', error)
    
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
