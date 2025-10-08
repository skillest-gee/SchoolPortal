import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createFeeSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  amount: z.number().min(0, 'Amount must be non-negative'),
  description: z.string().min(1, 'Description is required'),
  dueDate: z.string().transform((str) => new Date(str)),
})

// GET: Fetch fees
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
    const academicYear = searchParams.get('academicYear')
    const feeType = searchParams.get('feeType')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {}
    
    if (studentId) {
      where.studentId = studentId
    }
    if (academicYear) {
      where.academicYear = academicYear
    }
    if (feeType) {
      where.feeType = feeType
    }
    if (status) {
      where.status = status
    }

    // For students, only show their own fees
    if (session.user.role === 'STUDENT') {
      where.studentId = session.user.id
    }

    const fees = await prisma.fee.findMany({
      where,
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        payments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    // Calculate payment status for each fee
    const feesWithStatus = fees.map(fee => {
      const totalPaid = fee.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const remaining = fee.amount - totalPaid
      const isPaid = remaining <= 0
      const isOverdue = new Date() > fee.dueDate && !isPaid

      return {
        ...fee,
        totalPaid,
        remaining,
        isPaid,
        isOverdue,
        paymentStatus: isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      data: feesWithStatus
    })

  } catch (error) {
    console.error('Error fetching fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new fee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins and finance staff can create fees
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can create fees' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createFeeSchema.parse(body)

    // Verify student exists
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId },
      include: { studentProfile: true }
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Create the fee
    const fee = await prisma.fee.create({
      data: {
        ...validatedData,
        isPaid: false
      },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Fee created successfully',
      data: fee
    })

  } catch (error) {
    console.error('Error creating fee:', error)
    
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
