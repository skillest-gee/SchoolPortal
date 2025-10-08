import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createIdCardRequestSchema = z.object({
  requestType: z.enum(['NEW', 'REPLACEMENT', 'RENEWAL']),
  reason: z.string().min(1, 'Reason is required'),
  deliveryMethod: z.enum(['PICKUP', 'MAIL']).default('PICKUP'),
  deliveryAddress: z.string().optional(),
  additionalNotes: z.string().optional(),
  urgent: z.boolean().default(false),
})

// GET: Fetch ID card requests
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
    const requestType = searchParams.get('requestType')

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

    if (requestType) {
      where.requestType = requestType
    }

    const requests = await prisma.idCardRequest.findMany({
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
    console.error('Error fetching ID card requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create ID card request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only students can request ID cards
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Only students can request ID cards' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createIdCardRequestSchema.parse(body)

    // Check if user has a pending request
    const existingRequest = await prisma.idCardRequest.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending ID card request' },
        { status: 400 }
      )
    }

    // Create the ID card request
    const idCardRequest = await prisma.idCardRequest.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        status: 'PENDING'
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
      message: 'ID card request submitted successfully',
      data: idCardRequest
    })

  } catch (error) {
    console.error('Error creating ID card request:', error)
    
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
