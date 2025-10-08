import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const gradeSubmissionSchema = z.object({
  mark: z.number().min(0, 'Mark cannot be negative'),
  feedback: z.string().optional(),
})

// PUT: Grade a submission
export async function PUT(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only lecturers and admins can grade submissions
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only lecturers can grade submissions' },
        { status: 403 }
      )
    }

    const submissionId = params.submissionId
    const body = await request.json()
    const validatedData = gradeSubmissionSchema.parse(body)

    // Verify submission exists and get assignment/course info
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            course: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check if user has access to grade this submission
    const hasAccess = 
      session.user.role === 'ADMIN' ||
      submission.assignment.course.lecturerId === session.user.id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: You can only grade submissions for your own courses' },
        { status: 403 }
      )
    }

    // Validate mark doesn't exceed max points
    if (validatedData.mark > submission.assignment.maxPoints) {
      return NextResponse.json(
        { error: `Mark cannot exceed ${submission.assignment.maxPoints} points` },
        { status: 400 }
      )
    }

    // Update submission with grade
    const updatedSubmission = await prisma.submission.update({
      where: { id: submissionId },
      data: {
        mark: validatedData.mark,
        feedback: validatedData.feedback,
        status: 'GRADED'
      }
    })

    // Update academic record
    await prisma.academicRecord.upsert({
      where: {
        studentId_courseId_semester_academicYear: {
          studentId: submission.studentId,
          courseId: submission.assignment.courseId,
          semester: 'SPRING', // You might want to make this dynamic
          academicYear: new Date().getFullYear().toString()
        }
      },
      update: {
        points: validatedData.mark,
        status: 'COMPLETED'
      },
      create: {
        studentId: submission.studentId,
        courseId: submission.assignment.courseId,
        semester: 'SPRING',
        academicYear: new Date().getFullYear().toString(),
        points: validatedData.mark,
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Submission graded successfully',
      data: updatedSubmission
    })

  } catch (error) {
    console.error('Error grading submission:', error)
    
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
