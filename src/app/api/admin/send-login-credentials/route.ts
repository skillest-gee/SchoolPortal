import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateLoginCredentialsEmail, sendEmail } from '@/lib/email-service'
import { generateSecurePassword } from '@/lib/password-validation'
import bcrypt from 'bcryptjs'

const sendCredentialsSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  hallOfResidence: z.string().min(1, 'Hall of residence is required'),
  courseRegistrationInstructions: z.string().optional()
})

// POST: Send login credentials to student after payment confirmation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can send login credentials
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can send login credentials' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = sendCredentialsSchema.parse(body)

    // Get student details
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

    // Check if student has paid ALL fees
    const allFees = await prisma.fee.findMany({
      where: {
        studentId: student.id
      }
    })

    if (allFees.length === 0) {
      return NextResponse.json(
        { error: 'No fees found for this student' },
        { status: 400 }
      )
    }

    const unpaidFees = allFees.filter(fee => !fee.isPaid)
    
    if (unpaidFees.length > 0) {
      const unpaidFeeNames = unpaidFees.map(fee => fee.description).join(', ')
      const totalUnpaid = unpaidFees.reduce((sum, fee) => sum + fee.amount, 0)
      
      return NextResponse.json(
        { 
          error: 'Student has not paid all fees yet',
          details: {
            unpaidFees: unpaidFeeNames,
            totalUnpaid: totalUnpaid,
            unpaidCount: unpaidFees.length,
            totalFees: allFees.length
          }
        },
        { status: 400 }
      )
    }

    // Generate new secure password
    const newPassword = generateSecurePassword(12)
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update student password
    await prisma.user.update({
      where: { id: student.id },
      data: { passwordHash: hashedPassword }
    })

    // Update student profile with hall assignment
    if (student.studentProfile) {
      await prisma.studentProfile.update({
        where: { id: student.studentProfile.id },
        data: { hall: validatedData.hallOfResidence }
      })
    }

    // Generate and send login credentials email
    const loginEmail = generateLoginCredentialsEmail({
      studentName: student.name || 'Student',
      email: student.email,
      studentId: student.studentProfile?.studentId || 'N/A',
      password: newPassword,
      hallOfResidence: validatedData.hallOfResidence,
      loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/login`,
      courseRegistrationInstructions: validatedData.courseRegistrationInstructions || `
        Course Registration Instructions:
        1. Login to the student portal using your credentials
        2. Navigate to "Course Registration" in the sidebar
        3. Select courses for your programme and level
        4. Submit your course selection
        5. Wait for approval from your academic advisor
        
        Important Notes:
        • Course registration is open from September 1-15, 2024
        • You must register for at least 15 credit hours
        • Some courses may have prerequisites
        • Contact your academic advisor for course selection guidance
      `
    })

    const emailResult = await sendEmail(loginEmail)
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Failed to send login credentials email', details: emailResult.error },
        { status: 500 }
      )
    }

    // Create notification for admin
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'Login Credentials Sent',
        content: `Login credentials sent to ${student.name} (${student.studentProfile?.studentId}). Hall assigned: ${validatedData.hallOfResidence}`,
        type: 'SUCCESS'
      }
    })

    // Log the credentials for admin reference
    console.log(`🔐 LOGIN CREDENTIALS SENT:`)
    console.log(`   Student: ${student.name} (${student.studentProfile?.studentId})`)
    console.log(`   Email: ${student.email}`)
    console.log(`   Password: ${newPassword}`)
    console.log(`   Hall: ${validatedData.hallOfResidence}`)

    return NextResponse.json({
      success: true,
      message: 'Login credentials sent successfully',
      data: {
        studentId: student.id,
        studentName: student.name,
        studentIdNumber: student.studentProfile?.studentId,
        email: student.email,
        hallOfResidence: validatedData.hallOfResidence,
        emailMessageId: emailResult.messageId
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
