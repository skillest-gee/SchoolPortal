import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createRegistrationPeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required'),
  description: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
  level: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear')
    const semester = searchParams.get('semester')
    const department = searchParams.get('department')
    const level = searchParams.get('level')
    const isActive = searchParams.get('isActive')

    const where: any = {}
    
    if (academicYear) where.academicYear = academicYear
    if (semester) where.semester = semester
    if (department) where.department = department
    if (level) where.level = level
    if (isActive !== null) where.isActive = isActive === 'true'

    const periods = await prisma.courseRegistrationPeriod.findMany({
      where,
      orderBy: [
        { academicYear: 'desc' },
        { semester: 'asc' },
        { startDate: 'desc' }
      ]
    })

    return NextResponse.json({ periods })
  } catch (error) {
    console.error('Error fetching registration periods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration periods' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createRegistrationPeriodSchema.parse(body)

    // Validate date range
    const startDate = new Date(validatedData.startDate)
    const endDate = new Date(validatedData.endDate)
    
    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check for overlapping periods with same criteria
    const overlappingPeriod = await prisma.courseRegistrationPeriod.findFirst({
      where: {
        academicYear: validatedData.academicYear,
        semester: validatedData.semester,
        level: validatedData.level || null,
        department: validatedData.department || null,
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    })

    if (overlappingPeriod) {
      return NextResponse.json(
        { error: 'A registration period already exists for this time range and criteria' },
        { status: 400 }
      )
    }

    const period = await prisma.courseRegistrationPeriod.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        academicYear: validatedData.academicYear,
        semester: validatedData.semester,
        level: validatedData.level,
        department: validatedData.department,
        startDate,
        endDate,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json({ period }, { status: 201 })
  } catch (error) {
    console.error('Error creating registration period:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create registration period' },
      { status: 500 }
    )
  }
}
