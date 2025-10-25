import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating assignments
const createAssignmentSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  maxPoints: z.number().min(1).max(1000),
  instructions: z.string().optional(),
  attachments: z.array(z.string()).optional()
})

// Schema for updating assignments
const updateAssignmentSchema = createAssignmentSchema.partial().extend({
  id: z.string(),
  isActive: z.boolean().optional()
})

// GET: Fetch assignments for lecturer's courses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lecturerId = session.user.id
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status') // active, inactive, all

    // Build where clause
    const whereClause: any = {
      course: {
        lecturerId: lecturerId
      }
    }

    if (courseId) {
      whereClause.courseId = courseId
    }

    if (status === 'active') {
      whereClause.isActive = true
    } else if (status === 'inactive') {
      whereClause.isActive = false
    }

    // Get assignments with related data
    const assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            department: true,
            level: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get lecturer's courses for filtering
    const courses = await prisma.course.findMany({
      where: {
        lecturerId: lecturerId
      },
      select: {
        id: true,
        code: true,
        title: true,
        department: true,
        level: true,
        semester: true,
        academicYear: true
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Format assignments data
    const formattedAssignments = assignments.map(assignment => {
      const dueDate = new Date(assignment.dueDate)
      const now = new Date()
      const isOverdue = dueDate < now
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: assignment.id,
        courseId: assignment.courseId,
        courseCode: assignment.course.code,
        courseTitle: assignment.course.title,
        courseDepartment: assignment.course.department,
        courseLevel: assignment.course.level,
        title: assignment.title,
        description: assignment.description || '',
        instructions: assignment.description || '',
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        attachments: [],
        submissionCount: assignment._count.submissions,
        isActive: true,
        isOverdue: isOverdue,
        daysUntilDue: daysUntilDue,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt
      }
    })

    // Calculate summary statistics
    const totalAssignments = assignments.length
    const activeAssignments = assignments.length
    const overdueAssignments = formattedAssignments.filter(a => a.isOverdue).length
    const totalSubmissions = assignments.reduce((sum, a) => sum + a._count.submissions, 0)

    const summaryStats = {
      totalAssignments,
      activeAssignments,
      overdueAssignments,
      totalSubmissions,
      totalCourses: courses.length
    }

    return NextResponse.json({
      success: true,
      data: {
        assignments: formattedAssignments,
        courses: courses,
        summary: summaryStats
      }
    })

  } catch (error) {
    console.error('Error fetching lecturer assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST: Create new assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lecturerId = session.user.id
    const body = await request.json()
    const validatedData = createAssignmentSchema.parse(body)

    // Verify the course belongs to the lecturer
    const course = await prisma.course.findFirst({
      where: {
        id: validatedData.courseId,
        lecturerId: lecturerId
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found or access denied' },
        { status: 404 }
      )
    }

    // Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        courseId: validatedData.courseId,
        title: validatedData.title,
        description: validatedData.description || '',
        dueDate: new Date(validatedData.dueDate),
        maxPoints: validatedData.maxPoints
      },
      include: {
        course: {
          select: {
            code: true,
            title: true
          }
        }
      }
    })

    // Create notifications for enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: validatedData.courseId
      },
      select: {
        studentId: true
      }
    })

    const notifications = enrollments.map(enrollment => ({
      userId: enrollment.studentId,
      title: 'New Assignment Posted',
      content: `A new assignment "${validatedData.title}" has been posted for ${assignment.course.code} - ${assignment.course.title}. Due: ${new Date(validatedData.dueDate).toLocaleDateString()}`,
      type: 'INFO' as const
    }))

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      data: {
        id: assignment.id,
        title: assignment.title,
        courseCode: assignment.course.code,
        courseTitle: assignment.course.title,
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        isActive: true
      }
    })

  } catch (error) {
    console.error('Error creating assignment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

// PUT: Update assignment
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lecturerId = session.user.id
    const body = await request.json()
    const validatedData = updateAssignmentSchema.parse(body)

    // Verify the assignment belongs to the lecturer
    const existingAssignment = await prisma.assignment.findFirst({
      where: {
        id: validatedData.id,
        course: {
          lecturerId: lecturerId
        }
      }
    })

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found or access denied' },
        { status: 404 }
      )
    }

    // Update the assignment
    const updateData: any = {}
    if (validatedData.title) updateData.title = validatedData.title
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.dueDate) updateData.dueDate = new Date(validatedData.dueDate)
    if (validatedData.maxPoints) updateData.maxPoints = validatedData.maxPoints
    if (validatedData.instructions !== undefined) updateData.instructions = validatedData.instructions
    if (validatedData.attachments !== undefined) updateData.attachments = validatedData.attachments
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const assignment = await prisma.assignment.update({
      where: {
        id: validatedData.id
      },
      data: updateData,
      include: {
        course: {
          select: {
            code: true,
            title: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        id: assignment.id,
        title: assignment.title,
        courseCode: assignment.course.code,
        courseTitle: assignment.course.title,
        dueDate: assignment.dueDate,
        maxPoints: assignment.maxPoints,
        isActive: true
      }
    })

  } catch (error) {
    console.error('Error updating assignment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}
