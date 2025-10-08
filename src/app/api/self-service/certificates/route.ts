import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCertificateRequestSchema = z.object({
  certificateType: z.enum(['TRANSCRIPT', 'DEGREE_CERTIFICATE', 'ENROLLMENT_CERTIFICATE', 'GOOD_STANDING', 'OTHER']),
  purpose: z.string().min(1, 'Purpose is required'),
  deliveryMethod: z.enum(['PICKUP', 'EMAIL', 'MAIL']).default('PICKUP'),
  deliveryAddress: z.string().optional(),
  additionalNotes: z.string().optional(),
  urgent: z.boolean().default(false),
})

// GET: Fetch certificate requests
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
    const certificateType = searchParams.get('certificateType')

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

    if (certificateType) {
      where.certificateType = certificateType
    }

    const requests = await prisma.certificateRequest.findMany({
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
    console.error('Error fetching certificate requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create certificate request
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only students can request certificates
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Only students can request certificates' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createCertificateRequestSchema.parse(body)

    // Check if user has a pending request for the same certificate type
    const existingRequest = await prisma.certificateRequest.findFirst({
      where: {
        userId: session.user.id,
        certificateType: validatedData.certificateType,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    })

    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this certificate type' },
        { status: 400 }
      )
    }

    // Create the certificate request
    const certificateRequest = await prisma.certificateRequest.create({
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
      message: 'Certificate request submitted successfully',
      data: certificateRequest
    })

  } catch (error) {
    console.error('Error creating certificate request:', error)
    
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
