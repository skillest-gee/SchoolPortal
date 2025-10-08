import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCourseSchema = z.object({
  code: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  credits: z.number().min(1).optional(),
  department: z.string().min(1).optional(),
  level: z.string().min(1).optional(),
  semester: z.string().min(1).optional(),
  academicYear: z.string().min(1).optional(),
  lecturerId: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        enrollments: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                studentProfile: {
                  select: {
                    studentId: true,
                    program: true,
                    yearOfStudy: true,
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: course,
    })
  } catch (error) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateCourseSchema.parse(body)

    // Check if course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id: params.id }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if course code is being changed and if it's already taken
    if (validatedData.code && validatedData.code !== existingCourse.code) {
      const codeExists = await prisma.course.findFirst({
        where: { 
          code: validatedData.code,
          id: { not: params.id }
        }
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Course code already exists' },
          { status: 400 }
        )
      }
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCourse,
    })
  } catch (error) {
    console.error('Error updating course:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      )
    }

    const updatedCourse = await prisma.course.update({
      where: { id: params.id },
      data: { isActive },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCourse,
    })
  } catch (error) {
    console.error('Error updating course status:', error)
    return NextResponse.json(
      { error: 'Failed to update course status' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Check if course has enrollments
    if (course._count.enrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with active enrollments' },
        { status: 400 }
      )
    }

    // Delete course
    await prisma.course.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
