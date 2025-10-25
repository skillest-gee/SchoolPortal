import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const paymentSchema = z.object({
  feeId: z.string(),
  amount: z.number().min(0.01),
  paymentMethod: z.string(),
  reference: z.string().optional(),
  notes: z.string().optional()
})

// POST: Record payment for fee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // Check if fee exists and belongs to student
    const fee = await prisma.fee.findFirst({
      where: {
        id: validatedData.feeId,
        studentId: session.user.id
      }
    })

    if (!fee) {
      return NextResponse.json({ error: 'Fee not found' }, { status: 404 })
    }

    // Check if payment amount is valid
    const existingPayments = await prisma.payment.findMany({
      where: {
        feeId: validatedData.feeId,
        status: 'COMPLETED'
      }
    })

    const totalPaid = existingPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const remainingAmount = fee.amount - totalPaid

    if (validatedData.amount > remainingAmount) {
      return NextResponse.json(
        { error: `Payment amount cannot exceed remaining balance of $${remainingAmount.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        feeId: validatedData.feeId,
        studentId: session.user.id,
        amount: validatedData.amount,
        paymentMethod: validatedData.paymentMethod,
        reference: validatedData.reference || `PAY-${Date.now()}`,
        notes: validatedData.notes,
        status: 'COMPLETED', // For now, auto-approve payments
      }
    })

    // Check if fee is now fully paid
    const newTotalPaid = totalPaid + validatedData.amount
    const isFullyPaid = newTotalPaid >= fee.amount

    if (isFullyPaid) {
      // Update fee status
      await prisma.fee.update({
        where: { id: validatedData.feeId },
        data: { status: 'PAID' }
      })

      // Create notification
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          title: 'Payment Completed',
          content: `Your payment of $${validatedData.amount.toFixed(2)} for ${fee.description} has been processed successfully.`,
          type: 'SUCCESS'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment,
        isFullyPaid,
        remainingAmount: fee.amount - newTotalPaid
      }
    })

  } catch (error) {
    console.error('Error recording payment:', error)
    
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

// GET: Get payment history for student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const feeId = searchParams.get('feeId')

    let whereClause: any = {
      studentId: session.user.id
    }

    if (feeId) {
      whereClause.feeId = feeId
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        fee: {
          select: {
            description: true,
            amount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        reference: payment.reference,
        status: payment.status,
        createdAt: payment.createdAt,
        fee: payment.fee
      }))
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}