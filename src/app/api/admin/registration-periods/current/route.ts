import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registrationPeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required'),
  description: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
  level: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true)
})

// POST: Create registration period
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = registrationPeriodSchema.parse(body)

    // Check for overlapping periods
    const overlappingPeriod = await prisma.courseRegistrationPeriod.findFirst({
      where: {
        academicYear: validatedData.academicYear,
        semester: validatedData.semester,
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(validatedData.startDate) } },
              { endDate: { gte: new Date(validatedData.startDate) } }
            ]
          },
          {
            AND: [
              { startDate: { lte: new Date(validatedData.endDate) } },
              { endDate: { gte: new Date(validatedData.endDate) } }
            ]
          }
        ]
      }
    })

    if (overlappingPeriod) {
      return NextResponse.json(
        { error: 'Registration period overlaps with existing period' },
        { status: 400 }
      )
    }

    const registrationPeriod = await prisma.courseRegistrationPeriod.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        academicYear: validatedData.academicYear,
        semester: validatedData.semester,
        level: validatedData.level,
        department: validatedData.department,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registration period created successfully',
      data: registrationPeriod
    })

  } catch (error) {
    console.error('Error creating registration period:', error)
    
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

// GET: Get current registration period
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear') || '2024/2025'
    const semester = searchParams.get('semester') || '1st Semester'

    const currentPeriod = await prisma.courseRegistrationPeriod.findFirst({
      where: {
        academicYear: academicYear,
        semester: semester,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!currentPeriod) {
      // Create a default open registration period
      const defaultPeriod = await prisma.courseRegistrationPeriod.create({
        data: {
          name: 'Default Registration Period',
          description: 'Open registration for all students',
          academicYear: academicYear,
          semester: semester,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2025-12-31'),
          isActive: true
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          isOpen: true,
          period: defaultPeriod,
          message: 'Registration is currently open'
        }
      })
    }

    const isOpen = new Date() >= currentPeriod.startDate && new Date() <= currentPeriod.endDate

    return NextResponse.json({
      success: true,
      data: {
        isOpen,
        period: currentPeriod,
        message: isOpen ? 'Registration is currently open' : 'Registration is currently closed'
      }
    })

  } catch (error) {
    console.error('Error fetching registration period:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
