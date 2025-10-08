import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { quizSchema, validateData } from '@/lib/validation'
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
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause based on user role and filters
    let whereClause: any = {}
    
    if (courseId) {
      whereClause.courseId = courseId
    }
    
    if (status) {
      whereClause.status = status
    }

    // For students, only show quizzes for their enrolled courses
    if (session.user.role === 'STUDENT') {
      const enrolledCourses = await prisma.enrollment.findMany({
        where: { studentId: session.user.id },
        select: { courseId: true }
      })
      
      whereClause.courseId = {
        in: enrolledCourses.map(e => e.courseId)
      }
    }

    // For lecturers, only show quizzes for their courses
    if (session.user.role === 'LECTURER') {
      const taughtCourses = await prisma.course.findMany({
        where: { lecturerId: session.user.id },
        select: { id: true }
      })
      
      whereClause.courseId = {
        in: taughtCourses.map(c => c.id)
      }
    }

    const quizzes = await prisma.quiz.findMany({
      where: whereClause,
      include: {
        course: {
          include: {
            lecturer: {
              include: {
                lecturerProfile: true
              }
            }
          }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        attempts: session.user.role === 'STUDENT' ? {
          where: { studentId: session.user.id }
        } : true,
        _count: {
          select: {
            attempts: true,
            questions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.quiz.count({ where: whereClause })

    return NextResponse.json({
      success: true,
      data: quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleError(error, '/api/quizzes')
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

    // Only lecturers and admins can create quizzes
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = validateData(quizSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const quizData = validation.data!

    // Verify the lecturer owns the course
    if (session.user.role === 'LECTURER') {
      const course = await prisma.course.findFirst({
        where: {
          id: quizData.courseId,
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

    const quiz = await prisma.quiz.create({
      data: {
        title: quizData.title,
        description: quizData.description,
        courseId: quizData.courseId,
        timeLimit: quizData.timeLimit,
        maxAttempts: quizData.maxAttempts || 1,
        startDate: quizData.startDate ? new Date(quizData.startDate) : null,
        endDate: quizData.endDate ? new Date(quizData.endDate) : null,
        isActive: true
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

    return NextResponse.json({
      success: true,
      data: quiz
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), '/api/quizzes')
  }
})
