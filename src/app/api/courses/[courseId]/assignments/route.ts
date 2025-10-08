import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAssignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().transform((str) => new Date(str)),
  maxPoints: z.number().min(1, 'Max points must be at least 1').default(100),
  fileUrl: z.string().optional(),
})

// GET: Fetch assignments for a course
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const courseId = params.courseId

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

    // Check if user has access to this course
    const hasAccess = 
      session.user.role === 'ADMIN' ||
      course.lecturerId === session.user.id ||
      course.enrollments.length > 0

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this course' },
        { status: 403 }
      )
    }

    // Fetch assignments with submission info for students
    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: session.user.role === 'STUDENT' ? {
          where: { studentId: session.user.id }
        } : true,
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: assignments
    })

  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new assignment (lecturer only)
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
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
        { error: 'Forbidden: Only lecturers can create assignments' },
        { status: 403 }
      )
    }

    const courseId = params.courseId
    const body = await request.json()
    const validatedData = createAssignmentSchema.parse(body)

    // Verify course exists and user is the lecturer
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (session.user.role === 'LECTURER' && course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only create assignments for your own courses' },
        { status: 403 }
      )
    }

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        ...validatedData,
        courseId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    })

  } catch (error) {
    console.error('Error creating assignment:', error)
    
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
