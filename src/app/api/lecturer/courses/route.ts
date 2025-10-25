import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCourseSchema = z.object({
  code: z.string().min(1, 'Course code is required'),
  title: z.string().min(1, 'Course title is required'),
  description: z.string().optional(),
  credits: z.number().min(1, 'Credits must be at least 1'),
  department: z.string().min(1, 'Department is required'),
  level: z.string().min(1, 'Level is required'),
  semester: z.string().min(1, 'Semester is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'LECTURER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCourseSchema.parse(body)

    // Check if course code already exists
    const existingCourse = await prisma.course.findFirst({
      where: { code: validatedData.code }
    })

    if (existingCourse) {
      return NextResponse.json(
        { error: 'Course code already exists' },
        { status: 400 }
      )
    }

    // Create course with lecturer as the creator (pending approval)
    const course = await prisma.course.create({
      data: {
        code: validatedData.code,
        title: validatedData.title,
        description: validatedData.description,
        credits: validatedData.credits,
        department: validatedData.department,
        level: validatedData.level,
        semester: validatedData.semester,
        academicYear: validatedData.academicYear,
        lecturerId: session.user.id, // Lecturer creates the course
        status: 'PENDING', // Requires admin approval
        isActive: false, // Not active until approved
      },
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
      data: course,
    })
  } catch (error) {
    console.error('Error creating course:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}