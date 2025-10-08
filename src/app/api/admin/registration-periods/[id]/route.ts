import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRegistrationPeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required').optional(),
  description: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year is required').optional(),
  semester: z.string().min(1, 'Semester is required').optional(),
  level: z.string().optional(),
  department: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required').optional(),
  endDate: z.string().min(1, 'End date is required').optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const period = await prisma.courseRegistrationPeriod.findUnique({
      where: { id: params.id }
    })

    if (!period) {
      return NextResponse.json(
        { error: 'Registration period not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ period })
  } catch (error) {
    console.error('Error fetching registration period:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration period' },
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
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateRegistrationPeriodSchema.parse(body)

    // Check if period exists
    const existingPeriod = await prisma.courseRegistrationPeriod.findUnique({
      where: { id: params.id }
    })

    if (!existingPeriod) {
      return NextResponse.json(
        { error: 'Registration period not found' },
        { status: 404 }
      )
    }

    // Validate date range if dates are being updated
    if (validatedData.startDate || validatedData.endDate) {
      const startDate = new Date(validatedData.startDate || existingPeriod.startDate)
      const endDate = new Date(validatedData.endDate || existingPeriod.endDate)
      
      if (startDate >= endDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    // Check for overlapping periods with same criteria (excluding current period)
    if (validatedData.startDate || validatedData.endDate || 
        validatedData.academicYear || validatedData.semester ||
        validatedData.level !== undefined || validatedData.department !== undefined) {
      
      const academicYear = validatedData.academicYear || existingPeriod.academicYear
      const semester = validatedData.semester || existingPeriod.semester
      const level = validatedData.level !== undefined ? validatedData.level : existingPeriod.level
      const department = validatedData.department !== undefined ? validatedData.department : existingPeriod.department
      const startDate = new Date(validatedData.startDate || existingPeriod.startDate)
      const endDate = new Date(validatedData.endDate || existingPeriod.endDate)

      const overlappingPeriod = await prisma.courseRegistrationPeriod.findFirst({
        where: {
          id: { not: params.id },
          academicYear,
          semester,
          level: level || null,
          department: department || null,
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
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.academicYear !== undefined) updateData.academicYear = validatedData.academicYear
    if (validatedData.semester !== undefined) updateData.semester = validatedData.semester
    if (validatedData.level !== undefined) updateData.level = validatedData.level
    if (validatedData.department !== undefined) updateData.department = validatedData.department
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate)
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate)
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const period = await prisma.courseRegistrationPeriod.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ period })
  } catch (error) {
    console.error('Error updating registration period:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update registration period' },
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
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateRegistrationPeriodSchema.parse(body)

    // Check if period exists
    const existingPeriod = await prisma.courseRegistrationPeriod.findUnique({
      where: { id: params.id }
    })

    if (!existingPeriod) {
      return NextResponse.json(
        { error: 'Registration period not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.academicYear !== undefined) updateData.academicYear = validatedData.academicYear
    if (validatedData.semester !== undefined) updateData.semester = validatedData.semester
    if (validatedData.level !== undefined) updateData.level = validatedData.level
    if (validatedData.department !== undefined) updateData.department = validatedData.department
    if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate)
    if (validatedData.endDate !== undefined) updateData.endDate = new Date(validatedData.endDate)
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const period = await prisma.courseRegistrationPeriod.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ period })
  } catch (error) {
    console.error('Error updating registration period:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update registration period' },
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
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if period exists
    const existingPeriod = await prisma.courseRegistrationPeriod.findUnique({
      where: { id: params.id }
    })

    if (!existingPeriod) {
      return NextResponse.json(
        { error: 'Registration period not found' },
        { status: 404 }
      )
    }

    await prisma.courseRegistrationPeriod.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Registration period deleted successfully' })
  } catch (error) {
    console.error('Error deleting registration period:', error)
    return NextResponse.json(
      { error: 'Failed to delete registration period' },
      { status: 500 }
    )
  }
}
