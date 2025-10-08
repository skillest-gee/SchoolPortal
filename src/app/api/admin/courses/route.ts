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
  lecturerId: z.string().min(1, 'Lecturer is required'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const lecturerId = searchParams.get('lecturerId')
    const department = searchParams.get('department')
    const level = searchParams.get('level')
    const semester = searchParams.get('semester')
    const academicYear = searchParams.get('academicYear')

    const where: any = {}
    
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }
    
    if (lecturerId && lecturerId !== 'all') {
      where.lecturerId = lecturerId
    }
    
    if (department && department !== 'all') {
      where.department = department
    }
    
    if (level && level !== 'all') {
      where.level = level
    }
    
    if (semester && semester !== 'all') {
      where.semester = semester
    }
    
    if (academicYear && academicYear !== 'all') {
      where.academicYear = academicYear
    }

    const courses = await prisma.course.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: courses,
    })
  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
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

    // Create course
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
        lecturerId: validatedData.lecturerId,
        isActive: true,
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
