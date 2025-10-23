import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleError, handleDatabaseError, NotFoundError, ValidationError } from '@/lib/error-handling'
import { z } from 'zod'

const gradeSubmissionSchema = z.object({
  mark: z.number().min(0).max(1000),
  feedback: z.string().max(2000).optional(),
  comments: z.string().max(1000).optional()
})

export const PUT = async (
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

    // Only lecturers and admins can grade submissions
    if (session.user.role !== 'LECTURER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = gradeSubmissionSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { mark, feedback, comments } = validation.data

    // Check if submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        assignment: {
          include: {
            course: true
          }
        }
      }
    })

    if (!submission) {
      throw new NotFoundError('Submission not found')
    }

    // Check if lecturer owns the course
    if (session.user.role === 'LECTURER' && submission.assignment.course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Validate mark against assignment max points
    if (mark > submission.assignment.maxPoints) {
      throw new ValidationError('Mark cannot exceed maximum points for this assignment')
    }

    // Update submission with grade
    const updatedSubmission = await prisma.submission.update({
      where: { id: params.id },
      data: {
        mark,
        feedback: feedback || null,
        comments: comments || null,
        status: 'GRADED'
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

    // Update academic record if needed
    try {
      await prisma.academicRecord.upsert({
        where: {
          studentId_courseId_semester_academicYear: {
            studentId: submission.studentId,
            courseId: submission.assignment.courseId,
            semester: 'CURRENT', // You might want to get this from the course
            academicYear: '2024' // You might want to get this from the course
          }
        },
        update: {
          grade: mark >= 80 ? 'A' : mark >= 70 ? 'B' : mark >= 60 ? 'C' : mark >= 50 ? 'D' : 'F',
          points: (mark / submission.assignment.maxPoints) * 4, // Convert to 4.0 scale
          status: 'COMPLETED'
        },
        create: {
          studentId: submission.studentId,
          courseId: submission.assignment.courseId,
          semester: 'CURRENT',
          academicYear: '2024',
          grade: mark >= 80 ? 'A' : mark >= 70 ? 'B' : mark >= 60 ? 'C' : mark >= 50 ? 'D' : 'F',
          points: (mark / submission.assignment.maxPoints) * 4,
          status: 'COMPLETED'
        }
      })
    } catch (error) {
      console.error('Error updating academic record:', error)
      // Don't fail the grading if academic record update fails
    }

    return NextResponse.json({
      success: true,
      data: updatedSubmission,
      message: 'Submission graded successfully'
    })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/submissions/${params.id}/grade`)
  }
}
