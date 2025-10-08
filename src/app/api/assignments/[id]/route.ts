import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withAPIRateLimit } from '@/lib/rate-limit'
import { handleError, handleDatabaseError, NotFoundError } from '@/lib/error-handling'

export const GET = withAPIRateLimit(async (
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
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
        submissions: {
          include: {
            student: {
              include: {
                studentProfile: true
              }
            }
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!assignment) {
      throw new NotFoundError('Assignment not found')
    }

    // Check access permissions
    if (session.user.role === 'STUDENT') {
      // Check if student is enrolled in the course
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: session.user.id,
          courseId: assignment.courseId
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
      if (assignment.course.lecturerId !== session.user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: assignment
    })
  } catch (error) {
    return handleError(error, `/api/assignments/${params.id}`)
  }
})

export const PUT = withAPIRateLimit(async (
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

    // Only lecturers and admins can update assignments
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, description, dueDate, maxPoints, fileUrl } = body

    // Check if assignment exists and lecturer owns it
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { course: true }
    })

    if (!existingAssignment) {
      throw new NotFoundError('Assignment not found')
    }

    if (session.user.role === 'LECTURER' && existingAssignment.course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: params.id },
      data: {
        title: title || existingAssignment.title,
        description: description || existingAssignment.description,
        dueDate: dueDate ? new Date(dueDate) : existingAssignment.dueDate,
        maxPoints: maxPoints || existingAssignment.maxPoints,
        fileUrl: fileUrl || existingAssignment.fileUrl
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
      data: updatedAssignment
    })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/assignments/${params.id}`)
  }
})

export const DELETE = withAPIRateLimit(async (
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

    // Only lecturers and admins can delete assignments
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if assignment exists and lecturer owns it
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { course: true }
    })

    if (!existingAssignment) {
      throw new NotFoundError('Assignment not found')
    }

    if (session.user.role === 'LECTURER' && existingAssignment.course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    await prisma.assignment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/assignments/${params.id}`)
  }
})
