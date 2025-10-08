import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { feeSchema, validateData } from '@/lib/validation'
import { withAPIRateLimit } from '@/lib/rate-limit'
import { handleError, handleDatabaseError } from '@/lib/error-handling'

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

    // For students, only show their own fees
    if (session.user.role === 'STUDENT') {
      whereClause.studentId = session.user.id
    }

    const fees = await prisma.fee.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { dueDate: 'asc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.fee.count({ where: whereClause })

    // Calculate summary statistics
    const totalFees = await prisma.fee.aggregate({
      where: whereClause,
      _sum: { amount: true }
    })

    const paidFees = await prisma.fee.aggregate({
      where: { ...whereClause, isPaid: true },
      _sum: { amount: true }
    })

    const unpaidFees = await prisma.fee.aggregate({
      where: { ...whereClause, isPaid: false },
      _sum: { amount: true }
    })

    return NextResponse.json({
      success: true,
      data: fees,
      summary: {
        totalFees: totalFees._sum.amount || 0,
        paidFees: paidFees._sum.amount || 0,
        unpaidFees: unpaidFees._sum.amount || 0
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleError(error, '/api/fees')
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

    // Only admins can create fees
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = validateData(feeSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const feeData = validation.data!

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: feeData.studentId },
      include: { studentProfile: true }
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    const fee = await prisma.fee.create({
      data: {
        studentId: feeData.studentId,
        amount: feeData.amount,
        description: feeData.description,
        dueDate: new Date(feeData.dueDate),
        isPaid: feeData.isPaid || false,
        paymentDate: feeData.paymentDate ? new Date(feeData.paymentDate) : null,
        status: feeData.isPaid ? 'PAID' : 'PENDING'
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
      data: fee,
      message: 'Fee created successfully'
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), '/api/fees')
  }
})
