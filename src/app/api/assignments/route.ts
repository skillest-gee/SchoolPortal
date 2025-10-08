import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { assignmentSchema, validateData } from '@/lib/validation'
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

    // For students, only show assignments for their enrolled courses
    if (session.user.role === 'STUDENT') {
      const enrolledCourses = await prisma.enrollment.findMany({
        where: { studentId: session.user.id },
        select: { courseId: true }
      })
      
      whereClause.courseId = {
        in: enrolledCourses.map(e => e.courseId)
      }
    }

    // For lecturers, only show assignments for their courses
    if (session.user.role === 'LECTURER') {
      const taughtCourses = await prisma.course.findMany({
        where: { lecturerId: session.user.id },
        select: { id: true }
      })
      
      whereClause.courseId = {
        in: taughtCourses.map(c => c.id)
      }
    }

    const assignments = await prisma.assignment.findMany({
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
        submissions: session.user.role === 'STUDENT' ? {
          where: { studentId: session.user.id }
        } : true,
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.assignment.count({ where: whereClause })

    return NextResponse.json({
      success: true,
      data: assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleError(error, '/api/assignments')
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

    // Only lecturers and admins can create assignments
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = validateData(assignmentSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const assignmentData = validation.data!

    // Verify the lecturer owns the course
    if (session.user.role === 'LECTURER') {
      const course = await prisma.course.findFirst({
        where: {
          id: assignmentData.courseId,
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

    const assignment = await prisma.assignment.create({
      data: {
        title: assignmentData.title,
        description: assignmentData.description,
        dueDate: new Date(assignmentData.dueDate),
        maxPoints: assignmentData.maxPoints,
        courseId: assignmentData.courseId,
        fileUrl: assignmentData.fileUrl
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
      data: assignment
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), '/api/assignments')
  }
})
