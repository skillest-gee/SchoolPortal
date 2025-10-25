import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Check if student has paid required fees for course registration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = session.user.id
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear') || '2024/2025'
    const semester = searchParams.get('semester') || '1st Semester'

    // Get student's fees for the academic year
    const studentFees = await prisma.fee.findMany({
      where: {
        studentId: studentId
      },
      include: {
        payments: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    })

    // Calculate fee status
    const feeAnalysis = {
      totalFees: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      fees: [] as any[],
      canRegister: false,
      missingPayments: [] as any[]
    }

    for (const fee of studentFees) {
      const paidAmount = fee.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const outstandingAmount = fee.amount - paidAmount

      feeAnalysis.totalFees += fee.amount
      feeAnalysis.paidAmount += paidAmount
      feeAnalysis.outstandingAmount += outstandingAmount

      feeAnalysis.fees.push({
        id: fee.id,
        description: fee.description,
        amount: fee.amount,
        paidAmount: paidAmount,
        outstandingAmount: outstandingAmount,
        dueDate: fee.dueDate,
        status: outstandingAmount <= 0 ? 'PAID' : 'OUTSTANDING'
      })

      // Check if this is a required fee for registration
      if (fee.description.includes('Tuition') || fee.description.includes('Admission')) {
        if (outstandingAmount > 0) {
          feeAnalysis.missingPayments.push({
            amount: outstandingAmount,
            dueDate: fee.dueDate
          })
        }
      }
    }

    // Determine if student can register
    // Student can register if they have paid tuition fees (at least 50% of total tuition)
    const tuitionFees = studentFees.filter(fee => fee.description.includes('Tuition'))
    const totalTuition = tuitionFees.reduce((sum, fee) => sum + fee.amount, 0)
    const paidTuition = tuitionFees.reduce((sum, fee) => 
      sum + fee.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0
    )

    // Allow registration if at least 50% of tuition is paid
    feeAnalysis.canRegister = totalTuition > 0 && (paidTuition / totalTuition) >= 0.5

    // If no tuition fees exist, check for admission fees
    if (totalTuition === 0) {
      const admissionFees = studentFees.filter(fee => fee.description.includes('Admission'))
      const totalAdmission = admissionFees.reduce((sum, fee) => sum + fee.amount, 0)
      const paidAdmission = admissionFees.reduce((sum, fee) => 
        sum + fee.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0
      )
      
      feeAnalysis.canRegister = totalAdmission > 0 && paidAdmission >= totalAdmission
    }

    return NextResponse.json({
      success: true,
      data: feeAnalysis
    })

  } catch (error) {
    console.error('Error checking fee status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create sample fees for testing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { studentId, academicYear = '2024/2025', semester = '1st Semester' } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { studentProfile: true }
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Create sample fees for the student
    const sampleFees = [
      {
        studentId: studentId,
        type: 'TUITION',
        description: 'Tuition Fee',
        amount: 18000,
        dueDate: new Date('2024-09-30'),
        academicYear: academicYear,
        semester: semester,
        status: 'ACTIVE'
      },
      {
        studentId: studentId,
        type: 'ACCOMMODATION',
        description: 'Accommodation Fee',
        amount: 3500,
        dueDate: new Date('2024-09-30'),
        academicYear: academicYear,
        semester: semester,
        status: 'ACTIVE'
      },
      {
        studentId: studentId,
        type: 'LIBRARY',
        description: 'Library Fee',
        amount: 600,
        dueDate: new Date('2024-09-30'),
        academicYear: academicYear,
        semester: semester,
        status: 'ACTIVE'
      },
      {
        studentId: studentId,
        type: 'EXAMINATION',
        description: 'Examination Fee',
        amount: 800,
        dueDate: new Date('2024-09-30'),
        academicYear: academicYear,
        semester: semester,
        status: 'ACTIVE'
      }
    ]

    const createdFees = []
    for (const feeData of sampleFees) {
      try {
        const fee = await prisma.fee.create({
          data: feeData
        })
        createdFees.push(fee)
      } catch (error) {
        console.log(`Fee ${feeData.type} might already exist for student ${studentId}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdFees.length} fees for student`,
      data: {
        student: {
          id: student.id,
          name: student.name,
          studentId: student.studentProfile?.studentId,
        },
        fees: createdFees.map(fee => ({
          id: fee.id,
          description: fee.description,
          amount: fee.amount,
          dueDate: fee.dueDate
        }))
      }
    })

  } catch (error) {
    console.error('Error creating sample fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
