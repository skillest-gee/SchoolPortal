import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withAPIRateLimit } from '@/lib/rate-limit'
import { handleError, handleDatabaseError, NotFoundError, ValidationError } from '@/lib/error-handling'
import { z } from 'zod'

const paymentSchema = z.object({
  feeId: z.string().min(1, 'Fee ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD']),
  reference: z.string().min(1, 'Payment reference is required'),
  notes: z.string().max(500).optional()
})

export const GET = withAPIRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause based on user role and filters
    let whereClause: any = {}
    
    if (studentId) {
      whereClause.studentId = studentId
    }
    
    if (status) {
      whereClause.status = status
    }

    // For students, only show their own payments
    if (session.user.role === 'STUDENT') {
      whereClause.studentId = session.user.id
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        fee: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.payment.count({ where: whereClause })

    return NextResponse.json({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleError(error, '/api/payments')
  }
})

export const POST = withAPIRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = paymentSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const paymentData = validation.data

    // Check if fee exists
    const fee = await prisma.fee.findUnique({
      where: { id: paymentData.feeId },
      include: { student: true }
    })

    if (!fee) {
      throw new NotFoundError('Fee not found')
    }

    // Check if student owns the fee
    if (session.user.role === 'STUDENT' && fee.studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Check if fee is already paid
    if (fee.isPaid) {
      return NextResponse.json(
        { error: 'Fee is already paid' },
        { status: 400 }
      )
    }

    // Validate payment amount
    if (paymentData.amount > fee.amount) {
      throw new ValidationError('Payment amount cannot exceed fee amount')
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        feeId: paymentData.feeId,
        studentId: fee.studentId,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod,
        reference: paymentData.reference,
        notes: paymentData.notes,
        status: 'PENDING' // Will be updated after verification
      },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        fee: true
      }
    })

    // If payment amount equals fee amount, mark fee as paid
    if (paymentData.amount >= fee.amount) {
      await prisma.fee.update({
        where: { id: paymentData.feeId },
        data: {
          isPaid: true,
          paymentDate: new Date(),
          status: 'PAID'
        }
      })

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' }
      })
    }

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Payment processed successfully'
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), '/api/payments')
  }
})
