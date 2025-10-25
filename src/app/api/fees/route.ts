import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createFeeSchema = z.object({
  studentId: z.string(),
  type: z.string(),
  description: z.string(),
  amount: z.number().min(0),
  academicYear: z.string().optional(),
  semester: z.string().optional()
})

// POST: Create fee for student (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createFeeSchema.parse(body)

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId },
      include: { studentProfile: true }
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Create fee
    const fee = await prisma.fee.create({
      data: {
        studentId: validatedData.studentId,
        description: validatedData.description,
        amount: validatedData.amount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'PENDING'
      }
    })

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: validatedData.studentId,
        title: 'New Fee Added',
        content: `A new ${validatedData.type.toLowerCase()} fee of $${validatedData.amount.toFixed(2)} has been added to your account. Please check your finance portal for payment details.`,
        type: 'INFO'
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

// GET: Get fees for student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId') || session.user.id
    const academicYear = searchParams.get('academicYear') || '2024/2025'
    const semester = searchParams.get('semester') || '1st Semester'

    // Check if user can view fees (student can only view their own, admin can view any)
    if (session.user.role === 'STUDENT' && studentId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get student's fees
    const fees = await prisma.fee.findMany({
      where: {
        studentId: studentId
      },
      include: {
        payments: {
          where: {
            status: 'COMPLETED'
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    })

    // Calculate fee summary
    const summary = {
      totalFees: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      fees: [] as any[]
    }

    for (const fee of fees) {
      const paidAmount = fee.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const outstandingAmount = fee.amount - paidAmount

      summary.totalFees += fee.amount
      summary.paidAmount += paidAmount
      summary.outstandingAmount += outstandingAmount

      summary.fees.push({
        id: fee.id,
        description: fee.description,
        amount: fee.amount,
        paidAmount: paidAmount,
        outstandingAmount: outstandingAmount,
        dueDate: fee.dueDate,
        status: fee.status,
        payments: fee.payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt
        }))
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        academicYear,
        semester
      }
    })

  } catch (error) {
    console.error('Error fetching fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}