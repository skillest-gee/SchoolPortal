import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const courseId = params.id

    // Verify course exists and user has access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: true,
        enrollments: {
          where: { studentId: session.user.id }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user is enrolled in course (for students) or is the lecturer
    const isEnrolled = course.enrollments.length > 0
    const isLecturer = course.lecturerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isEnrolled && !isLecturer && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Fetch assignments for the course
    const assignments = await prisma.assignment.findMany({
      where: { courseId: courseId },
      include: {
        submissions: session.user.role === 'STUDENT' 
          ? {
              where: { studentId: session.user.id }
            }
          : true,
        course: {
          select: {
            id: true,
            code: true,
            title: true
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    })

    // Transform the data
    const assignmentsWithDetails = assignments.map(assignment => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate.toISOString(),
      maxPoints: assignment.maxPoints,
      fileUrl: assignment.fileUrl,
      course: assignment.course,
      submissions: assignment.submissions.map(submission => ({
        id: submission.id,
        fileUrl: submission.fileUrl,
        comments: submission.comments,
        submittedAt: submission.submittedAt.toISOString(),
        status: submission.status,
        mark: submission.mark,
        feedback: submission.feedback
      })),
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: assignmentsWithDetails
    })

  } catch (error) {
    console.error('Error fetching course assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
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

    const courseId = params.id
    const body = await request.json()

    const { title, description, dueDate, maxPoints, fileUrl } = body

    // Validate required fields
    if (!title || !dueDate || !maxPoints) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Check if user is the lecturer or admin
    if (session.user.role === 'LECTURER' && course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description: description || null,
        dueDate: new Date(dueDate),
        maxPoints: parseInt(maxPoints),
        fileUrl: fileUrl || null,
        courseId: courseId
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate.toISOString(),
        maxPoints: assignment.maxPoints,
        fileUrl: assignment.fileUrl,
        course: assignment.course,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
