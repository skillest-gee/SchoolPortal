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

// GET: Generate acceptance letter for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can generate acceptance letters
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can generate acceptance letters' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    // Get student details
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

    const programme = student.studentProfile?.programme
    if (!programme) {
      return NextResponse.json(
        { error: 'Student has no programme assigned' },
        { status: 400 }
      )
    }

    const fees = programmeFees[programme as keyof typeof programmeFees]
    if (!fees) {
      return NextResponse.json(
        { error: 'No fee structure defined for this programme' },
        { status: 400 }
      )
    }

    // Generate acceptance letter
    const acceptanceLetter = {
      student: {
        name: student.name,
        email: student.email,
        indexNumber: student.indexNumber,
        programme: programme
      },
      fees: fees,
      letterContent: generateLetterContent(student.name || 'Student', programme, fees, student.indexNumber || '')
    }

    return NextResponse.json({
      success: true,
      data: acceptanceLetter
    })

  } catch (error) {
    console.error('Error generating acceptance letter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateLetterContent(studentName: string, programme: string, fees: any, indexNumber: string) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
Dear ${studentName},

CONGRATULATIONS ON YOUR ADMISSION!

We are pleased to inform you that you have been accepted into our ${programme} programme for the 2024/2025 academic year.

PROGRAMME FEE STRUCTURE:

📚 Programme: ${programme}
💰 Total Programme Fee: $${fees.total.toLocaleString()}

BREAKDOWN OF FEES:
• Admission Fee: $${fees.admission.toLocaleString()} (Required before login credentials)
• Tuition Fee: $${fees.tuition.toLocaleString()} (Main academic fee)
• Accommodation Fee: $${fees.accommodation.toLocaleString()} (Housing and meals)
• Library Fee: $${fees.library.toLocaleString()} (Library access and resources)
${fees.laboratory ? `• Laboratory Fee: $${fees.laboratory.toLocaleString()} (Laboratory access and materials)` : ''}
• Examination Fee: $${fees.examination.toLocaleString()} (Examination and assessment)

PAYMENT INSTRUCTIONS:

1. IMMEDIATE PAYMENT REQUIRED:
   - Admission Fee: $${fees.admission.toLocaleString()}
   - Payment Method: Bank Transfer
   - Account Details: [Bank details will be provided separately]

2. REMAINING FEES:
   - Due Date: October 1, 2024
   - Payment can be made through the student portal after login
   - Installment plans available upon request

3. LOGIN CREDENTIALS:
   - Index Number: ${indexNumber}
   - Password: [Secure password will be provided separately via secure email]
   - Login URL: https://your-school-portal.com/auth/login
   - You can use either your email or index number to login

NEXT STEPS:
1. Pay the admission fee of $${fees.admission.toLocaleString()}
2. Send payment confirmation to admissions@school.edu
3. Receive your login credentials
4. Access the student portal to view and pay remaining fees

IMPORTANT DATES:
• Admission Fee Due: September 1, 2024
• Remaining Fees Due: October 1, 2024
• Classes Begin: September 15, 2024

If you have any questions regarding fees or payment, please contact our finance office at finance@school.edu or call +1-234-567-8900.

We look forward to welcoming you to our institution!

Best regards,
Admissions Office
School Portal - Tertiary Institution
${currentDate}
  `.trim()
}
