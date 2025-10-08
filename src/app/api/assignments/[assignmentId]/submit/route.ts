import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const submitAssignmentSchema = z.object({
  fileUrl: z.string().min(1, 'File URL is required'),
  comments: z.string().optional(),
})

// POST: Submit assignment
export async function POST(
  request: NextRequest,
  { params }: { params: { assignmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only students can submit assignments
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Only students can submit assignments' },
        { status: 403 }
      )
    }

    const assignmentId = params.assignmentId
    const body = await request.json()
    const validatedData = submitAssignmentSchema.parse(body)

    // Verify assignment exists and get course info
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { studentId: session.user.id }
            }
          }
        }
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if student is enrolled in the course
    if (assignment.course.enrollments.length === 0) {
      return NextResponse.json(
        { error: 'You are not enrolled in this course' },
        { status: 403 }
      )
    }

    // Check if assignment is still open (not past due date)
    const now = new Date()
    if (now > assignment.dueDate) {
      return NextResponse.json(
        { error: 'Assignment submission deadline has passed' },
        { status: 400 }
      )
    }

    // Check if student has already submitted
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId: session.user.id
      }
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this assignment' },
        { status: 400 }
      )
    }

    // Create the submission
    const submission = await prisma.submission.create({
      data: {
        assignmentId,
        studentId: session.user.id,
        fileUrl: validatedData.fileUrl,
        comments: validatedData.comments,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submission
    })

  } catch (error) {
    console.error('Error submitting assignment:', error)
    
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
