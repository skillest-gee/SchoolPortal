import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Programme-specific fee structures
const programmeFees = {
  'BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)': {
    admission: 5000,
    tuition: 18000,
    accommodation: 3500,
    library: 600,
    laboratory: 1200,
    examination: 800,
    total: 26100
  },
  'BACHELOR OF SCIENCE (COMPUTER SCIENCE)': {
    admission: 5000,
    tuition: 18000,
    accommodation: 3500,
    library: 600,
    laboratory: 1200,
    examination: 800,
    total: 26100
  },
  'BACHELOR OF SCIENCE (SOFTWARE ENGINEERING)': {
    admission: 5000,
    tuition: 20000,
    accommodation: 3500,
    library: 600,
    laboratory: 1500,
    examination: 800,
    total: 27400
  },
  'BACHELOR OF ARTS (BUSINESS ADMINISTRATION)': {
    admission: 5000,
    tuition: 15000,
    accommodation: 3500,
    library: 500,
    examination: 600,
    total: 21600
  },
  'BACHELOR OF SCIENCE (ACCOUNTING)': {
    admission: 5000,
    tuition: 16000,
    accommodation: 3500,
    library: 500,
    examination: 700,
    total: 21700
  }
}

// POST: Create fees for a student (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can create fees
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can create fees' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { studentId, programme } = body

    if (!studentId || !programme) {
      return NextResponse.json(
        { error: 'Student ID and programme are required' },
        { status: 400 }
      )
    }

    // Check if student exists
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: { studentProfile: true }
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Check if fees already exist
    const existingFees = await prisma.fee.findMany({
      where: { studentId: studentId }
    })

    if (existingFees.length > 0) {
      return NextResponse.json(
        { error: 'Fees already exist for this student' },
        { status: 400 }
      )
    }

    // Get fee structure
    let fees = programmeFees[programme as keyof typeof programmeFees]
    
    // If no exact match, try partial matching
    if (!fees) {
      const programmeUpper = programme.toUpperCase()
      
      if (programmeUpper.includes('COMPUTER SCIENCE') || programmeUpper.includes('CS')) {
        fees = programmeFees['BACHELOR OF SCIENCE (COMPUTER SCIENCE)']
      } else if (programmeUpper.includes('INFORMATION TECHNOLOGY') || programmeUpper.includes('IT')) {
        fees = programmeFees['BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)']
      } else if (programmeUpper.includes('SOFTWARE ENGINEERING') || programmeUpper.includes('SE')) {
        fees = programmeFees['BACHELOR OF SCIENCE (SOFTWARE ENGINEERING)']
      } else if (programmeUpper.includes('BUSINESS ADMINISTRATION') || programmeUpper.includes('BA')) {
        fees = programmeFees['BACHELOR OF ARTS (BUSINESS ADMINISTRATION)']
      } else if (programmeUpper.includes('ACCOUNTING')) {
        fees = programmeFees['BACHELOR OF SCIENCE (ACCOUNTING)']
      }
    }

    if (!fees) {
      return NextResponse.json(
        { error: 'No fee structure defined for this programme' },
        { status: 400 }
      )
    }

    // Create fees
    const createdFees = []

    // 1. ADMISSION FEE
    const admissionFee = await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.admission,
        description: `Admission Fee - ${programme}`,
        dueDate: new Date('2024-09-01'),
        isPaid: false
      }
    })
    createdFees.push(admissionFee)

    // 2. TUITION FEE
    const tuitionFee = await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.tuition,
        description: `Tuition Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-10-01'),
        isPaid: false
      }
    })
    createdFees.push(tuitionFee)

    // 3. ACCOMMODATION FEE
    const accommodationFee = await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.accommodation,
        description: `Accommodation Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-10-15'),
        isPaid: false
      }
    })
    createdFees.push(accommodationFee)

    // 4. LIBRARY FEE
    const libraryFee = await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.library,
        description: `Library Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-10-20'),
        isPaid: false
      }
    })
    createdFees.push(libraryFee)

    // 5. LABORATORY FEE (if applicable)
    if ('laboratory' in fees && fees.laboratory) {
      const laboratoryFee = await prisma.fee.create({
        data: {
          studentId: studentId,
          amount: fees.laboratory,
          description: `Laboratory Fee - ${programme} - First Semester 2024/2025`,
          dueDate: new Date('2024-10-25'),
          isPaid: false
        }
      })
      createdFees.push(laboratoryFee)
    }

    // 6. EXAMINATION FEE
    const examinationFee = await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.examination,
        description: `Examination Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-11-01'),
        isPaid: false
      }
    })
    createdFees.push(examinationFee)

    return NextResponse.json({
      success: true,
      message: `Created ${createdFees.length} fees for ${student.name}`,
      data: {
        student: {
          id: student.id,
          name: student.name,
          email: student.email
        },
        fees: createdFees,
        totalAmount: fees.total
      }
    })

  } catch (error) {
    console.error('Error creating fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
