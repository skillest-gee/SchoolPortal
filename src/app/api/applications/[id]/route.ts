import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateAdmissionEmail, sendEmail } from '@/lib/email-service'
import { createProgrammeFees, programmeFees, findFeeStructure } from '@/lib/fee-utils'

const reviewApplicationSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'APPROVED', 'REJECTED']),
  adminNotes: z.string().optional(),
})

// GET: Fetch single application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view individual applications
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        programme: true
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: application
    })

  } catch (error) {
    console.error('Error fetching application:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Review application (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can review applications
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = reviewApplicationSchema.parse(body)

    // Get the application
    const application = await prisma.application.findUnique({
      where: { id: params.id },
      include: {
        programme: true
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // If approving, generate student ID and create user account
    let generatedStudentId = null
    if (validatedData.status === 'APPROVED') {
      // Generate unique student ID in format STU2024004
      const year = '2024'
      const existingStudents = await prisma.studentProfile.count({
        where: {
          studentId: {
            startsWith: `STU${year}`
          }
        }
      })
      const nextNumber = existingStudents + 1
      generatedStudentId = `STU${year}${nextNumber.toString().padStart(3, '0')}`
      
      // Create user account with secure password
      const bcrypt = await import('bcryptjs')
      const { generateSecurePassword } = await import('@/lib/password-validation')
      const securePassword = generateSecurePassword(12)
      const defaultPassword = await bcrypt.hash(securePassword, 12)
      
      const user = await prisma.user.create({
        data: {
          name: `${application.firstName} ${application.lastName}`,
          email: application.email,
          passwordHash: defaultPassword,
          role: 'STUDENT',
          isActive: true
        }
      })
      
      // Create student profile
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentId: generatedStudentId,
          firstName: application.firstName,
          middleName: application.middleName,
          lastName: application.lastName,
          gender: application.gender,
          dateOfBirth: application.dateOfBirth,
          programme: application.programme.name,
          currentMajor: application.programme.name,
          level: '100', // First year
          institutionalEmail: application.email,
          personalEmail: application.email,
          cellphone: application.phoneNumber,
          homeAddress: application.address,
          postalTown: application.city,
          hometown: application.city,
          address: application.address,
          phone: application.phoneNumber,
          program: application.programme.name,
          gpa: 0.0 // New students start with 0.00 GPA
        }
      })

      // Create programme-specific fees automatically
      const feeResult = await createProgrammeFees(user.id, application.programme.name)
      if (!feeResult.success) {
        console.warn(`⚠️ Failed to create fees during approval: ${feeResult.error}`)
      }

      // Send admission notification (Email/SMS)
      try {
        // Create notification for admin about new admission
        await prisma.notification.create({
          data: {
            userId: session.user.id,
            title: 'New Student Admitted',
            content: `${application.firstName} ${application.lastName} has been admitted with ID: ${generatedStudentId}. Admission fee of $5,000.00 has been created. Secure password generated.`,
            type: 'SUCCESS'
          }
        })

        // Send admission email to student
        const admissionEmail = generateAdmissionEmail({
          studentName: `${application.firstName} ${application.lastName}`,
          email: application.email,
          studentId: generatedStudentId,
          programme: application.programme.name,
          fees: findFeeStructure(application.programme.name) || programmeFees['BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)'],
          paymentInstructions: `
            Payment Instructions:
            1. Login to the student portal using your credentials
            2. Navigate to "Fees & Payments" in the sidebar
            3. View your admission fee of $5,000.00
            4. Make payment through the available payment methods
            5. Upload payment receipt for verification
            
            Important Notes:
            • Payment must be completed within 30 days of admission
            • Late payments may incur additional charges
            • Contact the finance office for payment assistance
            • Keep your payment receipt for records
          `
        })

        const emailResult = await sendEmail(admissionEmail)
        
        if (!emailResult.success) {
          console.error('Failed to send admission email:', emailResult.error)
        } else {
          console.log('✅ Admission email sent successfully:', emailResult.messageId)
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError)
      }
    }

    // Handle rejection - send email to student
    if (validatedData.status === 'REJECTED') {
      try {
        const rejectionEmail = {
          to: application.email,
          subject: `Application ${application.applicationNumber} - Update`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                Application Update
              </h1>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Dear <strong>${application.firstName} ${application.lastName}</strong>,</p>
                
                <p>Thank you for your interest in our institution and for submitting your application (${application.applicationNumber}).</p>
                
                <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                  <h3 style="margin-top: 0;">Application Status: Rejected</h3>
                  <p>After careful consideration, we regret to inform you that your application has not been successful at this time.</p>
                </div>

                ${validatedData.adminNotes ? `
                  <h3>Comments from Admissions Committee:</h3>
                  <div style="background: #e8f4fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
                    <p style="margin: 0;">${validatedData.adminNotes}</p>
                  </div>
                ` : ''}

                <h3>Next Steps:</h3>
                <ul>
                  <li>You may reapply in the next application period</li>
                  <li>Consider reaching out to our admissions office for feedback</li>
                  <li>Review the admission requirements on our website</li>
                </ul>

                <p>If you have any questions, please don't hesitate to contact our admissions office:</p>
                <ul>
                  <li>Email: <a href="mailto:admissions@university.edu">admissions@university.edu</a></li>
                  <li>Phone: +1-234-567-8900</li>
                </ul>

                <p>Thank you again for your interest in our institution. We wish you the best in your academic pursuits.</p>

                <p>Best regards,<br>
                <strong>Admissions Committee</strong><br>
                ${process.env.UNIVERSITY_NAME || 'University'}</p>
              </div>
            </div>
          `,
          text: `
Application Update - ${application.applicationNumber}

Dear ${application.firstName} ${application.lastName},

Thank you for your interest in our institution.

Application Status: Rejected

After careful consideration, we regret to inform you that your application has not been successful at this time.

${validatedData.adminNotes ? `Comments: ${validatedData.adminNotes}` : ''}

Next Steps:
- You may reapply in the next application period
- Consider reaching out for feedback
- Review admission requirements

Contact: admissions@university.edu

Best regards,
Admissions Committee
          `
        }

        const emailResult = await sendEmail(rejectionEmail)
        
        if (emailResult.success) {
          console.log(`✅ Rejection email sent successfully to ${application.email}`)
        } else {
          console.error('Failed to send rejection email:', emailResult.error)
        }
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError)
      }
    }

    // Update application
    const updatedApplication = await prisma.application.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
        adminNotes: validatedData.adminNotes,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        generatedStudentId
      },
      include: {
        programme: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Application ${validatedData.status.toLowerCase()} successfully`,
      data: updatedApplication
    })

  } catch (error) {
    console.error('Error reviewing application:', error)
    
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