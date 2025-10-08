import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch submissions for an assignment
export async function GET(
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

    const assignmentId = params.assignmentId

    // Verify assignment exists and get course info
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            lecturer: true,
            enrollments: {
              include: {
                student: {
                  include: {
                    studentProfile: true
                  }
                }
              }
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

    // Check if user has access to view submissions
    const hasAccess = 
      session.user.role === 'ADMIN' ||
      assignment.course.lecturerId === session.user.id

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden: Only the course lecturer can view submissions' },
        { status: 403 }
      )
    }

    // Fetch submissions with student info
    const submissions = await prisma.submission.findMany({
      where: { assignmentId },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        }
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    // Get enrolled students who haven't submitted
    const submittedStudentIds = submissions.map(s => s.studentId)
    const notSubmitted = assignment.course.enrollments
      .filter(enrollment => !submittedStudentIds.includes(enrollment.studentId))
      .map(enrollment => ({
        student: enrollment.student,
        submission: null
      }))

    return NextResponse.json({
      success: true,
      data: {
        assignment: {
          id: assignment.id,
          title: assignment.title,
          dueDate: assignment.dueDate,
          maxPoints: assignment.maxPoints
        },
        submissions: submissions.map(submission => ({
          id: submission.id,
          student: submission.student,
          fileUrl: submission.fileUrl,
          comments: submission.comments,
          submittedAt: submission.submittedAt,
          status: submission.status,
          mark: submission.mark,
          feedback: submission.feedback
        })),
        notSubmitted
      }
    })

  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
