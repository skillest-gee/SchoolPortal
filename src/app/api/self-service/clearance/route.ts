import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createClearanceRequestSchema = z.object({
  clearanceType: z.enum(['GRADUATION', 'TRANSFER', 'WITHDRAWAL', 'OTHER']),
  reason: z.string().min(1, 'Reason is required'),
  additionalNotes: z.string().optional(),
  urgent: z.boolean().default(false),
})

// GET: Fetch clearance requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const clearanceType = searchParams.get('clearanceType')

    // Build where clause
    const where: any = {}

    if (session.user.role === 'STUDENT') {
      where.userId = session.user.id
    } else if (userId && session.user.role === 'ADMIN') {
      where.userId = userId
    }

    if (status) {
      where.status = status
    }

    if (clearanceType) {
      where.clearanceType = clearanceType
    }

    const requests = await prisma.clearanceRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                studentId: true,
                program: true,
                yearOfStudy: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: requests
    })

  } catch (error) {
    console.error('Error fetching clearance requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create clearance request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only students can request clearance
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Only students can request clearance' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createClearanceRequestSchema.parse(body)

    // Check if user has a pending clearance request
    const existingRequest = await prisma.clearanceRequest.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending clearance request' },
        { status: 400 }
      )
    }

    // Create the clearance request with default clearance items
    const clearanceRequest = await prisma.clearanceRequest.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        status: 'PENDING',
        clearanceItems: JSON.stringify([
          {
            departmentId: 'library',
            status: 'PENDING',
            notes: 'Library clearance required'
          },
          {
            departmentId: 'finance',
            status: 'PENDING',
            notes: 'Financial clearance required'
          },
          {
            departmentId: 'academic',
            status: 'PENDING',
            notes: 'Academic clearance required'
          },
          {
            departmentId: 'hostel',
            status: 'PENDING',
            notes: 'Hostel clearance required'
          }
        ])
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                studentId: true,
                program: true,
                yearOfStudy: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Clearance request submitted successfully',
      data: clearanceRequest
    })

  } catch (error) {
    console.error('Error creating clearance request:', error)
    
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
