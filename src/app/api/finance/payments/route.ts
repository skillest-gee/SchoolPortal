import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPaymentSchema = z.object({
  feeId: z.string().min(1, 'Fee ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'CHEQUE']),
  reference: z.string().min(1, 'Payment reference is required'),
  notes: z.string().optional(),
})

// GET: Fetch payments
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
    const studentId = searchParams.get('studentId')
    const feeId = searchParams.get('feeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (feeId) {
      where.feeId = feeId
    }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        fee: {
          include: {
            student: {
              include: {
                studentProfile: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter by student if specified or if user is a student
    let filteredPayments = payments
    if (studentId) {
      filteredPayments = payments.filter(p => p.fee.studentId === studentId)
    } else if (session.user.role === 'STUDENT') {
      filteredPayments = payments.filter(p => p.fee.studentId === session.user.id)
    }

    return NextResponse.json({
      success: true,
      data: filteredPayments
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new payment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createPaymentSchema.parse(body)

    // Verify fee exists
    const fee = await prisma.fee.findUnique({
      where: { id: validatedData.feeId },
      include: {
        student: true,
        payments: true
      }
    })

    if (!fee) {
      return NextResponse.json(
        { error: 'Fee not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this fee
    if (session.user.role === 'STUDENT' && fee.studentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied to this fee' },
        { status: 403 }
      )
    }

    // Calculate total paid amount
    const totalPaid = fee.payments.reduce((sum, payment) => sum + payment.amount, 0)
    const remaining = fee.amount - totalPaid

    // Check if payment amount exceeds remaining balance
    if (validatedData.amount > remaining) {
      return NextResponse.json(
        { error: `Payment amount exceeds remaining balance. Remaining: $${remaining.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Use transaction to create payment and update fee status
    const result = await prisma.$transaction(async (tx) => {
      // Create payment
      const payment = await tx.payment.create({
        data: {
          ...validatedData,
          studentId: fee.studentId
        }
      })

      // Calculate new total paid
      const newTotalPaid = totalPaid + validatedData.amount
      const newRemaining = fee.amount - newTotalPaid

      // Update fee status if fully paid
      if (newRemaining <= 0) {
        await tx.fee.update({
          where: { id: fee.id },
          data: {
            status: 'PAID',
            isPaid: true,
            paymentDate: new Date()
          }
        })
      }

      return payment
    })

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: result
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    
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
