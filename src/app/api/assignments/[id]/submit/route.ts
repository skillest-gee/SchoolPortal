import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { submissionSchema, validateData } from '@/lib/validation'
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

    // Only students can submit assignments
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = validateData(submissionSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const submissionData = validation.data!

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { course: true }
    })

    if (!assignment) {
      throw new NotFoundError('Assignment not found')
    }

    // Check if student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: session.user.id,
        courseId: assignment.courseId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    // Check if assignment is still open
    const now = new Date()
    if (now > assignment.dueDate) {
      return NextResponse.json(
        { error: 'Assignment deadline has passed' },
        { status: 400 }
      )
    }

    // Check if student has already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: params.id,
        studentId: session.user.id
      }
    })

    if (existingSubmission) {
      throw new ConflictError('Assignment already submitted')
    }

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        assignmentId: params.id,
        studentId: session.user.id,
        fileUrl: submissionData.fileUrl,
        content: submissionData.content,
        status: 'SUBMITTED',
        submittedAt: now
      },
      include: {
        assignment: {
          include: {
            course: true
          }
        },
        student: {
          include: {
            studentProfile: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Assignment submitted successfully'
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/assignments/${params.id}/submit`)
  }
}

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

    // Only students can update their submissions
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { content, fileUrl } = body

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id }
    })

    if (!assignment) {
      throw new NotFoundError('Assignment not found')
    }

    // Check if assignment is still open
    const now = new Date()
    if (now > assignment.dueDate) {
      return NextResponse.json(
        { error: 'Assignment deadline has passed' },
        { status: 400 }
      )
    }

    // Find existing submission
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId: params.id,
        studentId: session.user.id
      }
    })

    if (!existingSubmission) {
      return NextResponse.json(
        { error: 'No submission found' },
        { status: 404 }
      )
    }

    // Update submission
    const updatedSubmission = await prisma.submission.update({
      where: { id: existingSubmission.id },
      data: {
        content: content || existingSubmission.content,
        fileUrl: fileUrl || existingSubmission.fileUrl,
        status: 'SUBMITTED',
        submittedAt: now
      },
      include: {
        assignment: {
          include: {
            course: true
          }
        },
        student: {
          include: {
            studentProfile: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission updated successfully'
    })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/assignments/${params.id}/submit`)
  }
})
