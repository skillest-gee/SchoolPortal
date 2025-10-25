import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const academicEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['ACADEMIC', 'ADMINISTRATIVE', 'EXAM', 'HOLIDAY', 'EVENT']),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  isActive: z.boolean().default(true)
})

// GET: Fetch academic calendar events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const type = searchParams.get('type')

    // Build where clause
    let whereClause: any = {}

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month), 1)
      const endDate = new Date(parseInt(year), parseInt(month) + 1, 0)
      whereClause.date = {
        gte: startDate,
        lte: endDate
      }
    }

    if (type) {
      whereClause.type = type
    }

    const events = await prisma.academicEvent.findMany({
      where: whereClause,
      orderBy: { date: 'asc' }
    })

    return NextResponse.json({
      success: true,
      data: events
    })

  } catch (error) {
    console.error('Error fetching academic calendar:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch academic calendar' },
      { status: 500 }
    )
  }
}

// POST: Create new academic event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = academicEventSchema.parse(body)

    const event = await prisma.academicEvent.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        date: new Date(validatedData.date),
        type: validatedData.type,
        priority: validatedData.priority,
        isActive: validatedData.isActive
      }
    })

    return NextResponse.json({
      success: true,
      data: event,
      message: 'Academic event created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating academic event:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create academic event' },
      { status: 500 }
    )
  }
}
