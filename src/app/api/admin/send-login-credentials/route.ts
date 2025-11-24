import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateLoginCredentialsEmail, sendEmail, generatePasswordResetToken } from '@/lib/email-service'
import { handleAPIError } from '@/lib/api-response'
import { generateSecurePassword } from '@/lib/password-validation'
import { createProgrammeFees } from '@/lib/fee-utils'
import bcrypt from 'bcryptjs'
import { requireRole } from '@/lib/rbac'
import { withMaintenanceCheck } from '@/lib/maintenance'
import { UserRole } from '@/types/roles'

const sendCredentialsSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  hallOfResidence: z.string().min(1, 'Hall of residence is required'),
  courseRegistrationInstructions: z.string().optional()
})

// POST: Send login credentials to student after payment confirmation
async function POSTHandler(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

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

    // Check if student has fees, if not, create them automatically
    let allFees = await prisma.fee.findMany({
      where: {
        studentId: student.id
      }
    })

    if (allFees.length === 0) {
      // Auto-create fees if they don't exist
      const programme = student.studentProfile?.programme
      if (programme) {
        console.log(`⚠️  No fees found for student. Auto-creating fees for programme: ${programme}`)
        
        // Create fees automatically
        const feeResult = await createProgrammeFees(student.id, programme)
        
        if (!feeResult.success) {
          // If fee creation fails, still allow credentials to be sent (with warning)
          console.warn(`⚠️  Failed to create fees: ${feeResult.error}. Proceeding with credential sending anyway.`)
        } else {
          // Re-fetch fees
          allFees = await prisma.fee.findMany({
            where: {
              studentId: student.id
            }
          })
          console.log(`✅ Created ${allFees.length} fees for student`)
        }
      } else {
        // No programme assigned - allow credentials anyway but warn admin
        console.warn(`⚠️  No fees found and no programme assigned. Sending credentials anyway.`)
      }
    }

    // Note: Allow sending credentials even if fees aren't paid (for initial setup)
    // Admin can enforce payment requirement later if needed
    const unpaidFees = allFees.filter(fee => !fee.isPaid)
    
    if (unpaidFees.length > 0) {
      // Warn but don't block - allow credentials to be sent
      console.log(`⚠️  Student has ${unpaidFees.length} unpaid fees, but sending credentials anyway`)
      const unpaidFeeNames = unpaidFees.map(fee => fee.description).join(', ')
      const totalUnpaid = unpaidFees.reduce((sum, fee) => sum + fee.amount, 0)
      console.log(`   Unpaid fees: ${unpaidFeeNames} (Total: $${totalUnpaid})`)
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

    // Generate password reset token and send login email with setup link
    const token = await generatePasswordResetToken(student.email)
    const baseUrl = process.env.APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`

    const loginEmail = generateLoginCredentialsEmail({
      studentName: student.name || 'Student',
      email: student.email,
      studentId: student.studentProfile?.studentId || 'N/A',
      password: newPassword,
      hallOfResidence: validatedData.hallOfResidence,
      loginUrl: `${baseUrl}/auth/login`,
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
      `,
      resetLink
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
    console.log(`   Reset Link: ${resetLink}`)
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
    return handleAPIError(error)
  }
}

export const POST = withMaintenanceCheck(requireRole(UserRole.ADMIN, POSTHandler));
