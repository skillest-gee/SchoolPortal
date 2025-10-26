import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
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
      }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Check access permissions
    if (session.user.role === 'STUDENT' && payment.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Return receipt data
    return NextResponse.json({
      success: true,
      data: {
        receiptNumber: `RCP${payment.id.substring(0, 8).toUpperCase()}`,
        paymentDate: payment.createdAt,
        student: {
          name: payment.fee.student.studentProfile 
            ? `${payment.fee.student.studentProfile.firstName} ${payment.fee.student.studentProfile.lastName}`
            : payment.fee.student.name,
          studentId: payment.fee.student.studentProfile?.studentId || 'N/A',
          email: payment.fee.student.email
        },
        paymentDetails: {
          amount: payment.amount,
          method: payment.paymentMethod,
          reference: payment.reference,
          status: payment.status
        },
        feeDetails: {
          type: payment.fee.description,
          amount: payment.fee.amount,
        },
        notes: payment.notes
      }
    })

  } catch (error) {
    console.error('Error fetching receipt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

