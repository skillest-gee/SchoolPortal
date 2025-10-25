import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateLoginCredentialsEmail, sendEmail } from '@/lib/email-service'
import bcrypt from 'bcryptjs'

const sendCredentialsSchema = z.object({
  studentId: z.string(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  hallOfResidence: z.string().optional(),
  notes: z.string().optional()
})

// POST: Send login credentials to student (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = sendCredentialsSchema.parse(body)

    // Get student details
    const student = await prisma.user.findUnique({
      where: { id: validatedData.studentId },
      include: {
        studentProfile: true
      }
    })

    if (!student || student.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Generate password if not provided
    const password = validatedData.password || generateRandomPassword()
    const passwordHash = await bcrypt.hash(password, 12)

    // Update student password
    await prisma.user.update({
      where: { id: validatedData.studentId },
      data: {
        passwordHash: passwordHash
      }
    })

    // Update hall of residence if provided
    if (validatedData.hallOfResidence) {
      await prisma.studentProfile.update({
        where: { userId: validatedData.studentId },
        data: {
          hall: validatedData.hallOfResidence
        }
      })
    }

    // Generate login credentials email
    const loginCredentialsEmail = generateLoginCredentialsEmail({
      studentName: student.name || `${student.studentProfile.firstName} ${student.studentProfile.lastName}`,
      email: student.email,
      studentId: student.studentProfile?.studentId || 'N/A',
      password: password,
      hallOfResidence: validatedData.hallOfResidence || 'To be assigned',
      loginUrl: `${process.env.NEXTAUTH_URL}/auth/login`,
      courseRegistrationInstructions: `
        <p><strong>Course Registration is now OPEN!</strong></p>
        <p>You can now register for courses for the 2024/2025 academic year. Here's how:</p>
        <ol>
          <li>Login to your student portal using the credentials above</li>
          <li>Navigate to "Course Registration" in the menu</li>
          <li>Select courses based on your program: <strong>${student.studentProfile.program}</strong></li>
          <li>Review your selections and submit</li>
          <li>Check your timetable after registration</li>
        </ol>
        <p><strong>Important:</strong> Course registration is open to all students who have made payments. Make sure to register before the deadline!</p>
      `
    })

    // Send email
    const emailResult = await sendEmail(loginCredentialsEmail)

    if (!emailResult.success) {
      return NextResponse.json(
        { error: `Failed to send email: ${emailResult.error}` },
        { status: 500 }
      )
    }

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: validatedData.studentId,
        title: 'Portal Access Granted',
        content: 'Your student portal login credentials have been sent to your email. You can now access the portal and register for courses.',
        type: 'SUCCESS'
      }
    })

    // Log the action
    console.log(`✅ Login credentials sent to student: ${student.email}`)
    console.log(`   Student ID: ${student.studentProfile?.studentId}`)
    console.log(`   Email ID: ${emailResult.messageId}`)

    return NextResponse.json({
      success: true,
      message: 'Login credentials sent successfully',
      data: {
        studentEmail: student.email,
        studentId: student.studentProfile?.studentId,
        emailId: emailResult.messageId,
        hallOfResidence: validatedData.hallOfResidence || 'To be assigned'
      }
    })

  } catch (error) {
    console.error('Error sending login credentials:', error)
    
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

// Helper function to generate random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// GET: Get students who need login credentials
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    let whereClause: any = {
      role: 'STUDENT'
    }

    if (status === 'needs_credentials') {
      whereClause.passwordHash = null
    } else if (status === 'has_credentials') {
      whereClause.passwordHash = { not: null }
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        studentProfile: true,
        fees: {
          include: {
            payments: {
              where: {
                status: 'COMPLETED'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter students who have made payments
    const studentsWithPayments = students.filter(student => {
      const hasPayments = student.fees.some(fee => fee.payments.length > 0)
      return hasPayments
    })

    const formattedStudents = studentsWithPayments.map(student => {
      const totalFees = student.fees.reduce((sum, fee) => sum + fee.amount, 0)
      const totalPaid = student.fees.reduce((sum, fee) => 
        sum + fee.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0
      )

      return {
        id: student.id,
        name: student.name || `${student.studentProfile?.firstName} ${student.studentProfile?.lastName}`,
        email: student.email,
        indexNumber: student.indexNumber || student.studentProfile?.studentId,
        program: student.studentProfile?.program,
        hallOfResidence: student.studentProfile?.hall,
        hasCredentials: !!student.passwordHash,
        totalFees: totalFees,
        totalPaid: totalPaid,
        paymentStatus: totalPaid >= totalFees ? 'FULLY_PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'NOT_PAID',
        createdAt: student.createdAt
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        students: formattedStudents,
        summary: {
          total: formattedStudents.length,
          needsCredentials: formattedStudents.filter(s => !s.hasCredentials).length,
          hasCredentials: formattedStudents.filter(s => s.hasCredentials).length,
          fullyPaid: formattedStudents.filter(s => s.paymentStatus === 'FULLY_PAID').length,
          partiallyPaid: formattedStudents.filter(s => s.paymentStatus === 'PARTIALLY_PAID').length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
