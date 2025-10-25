import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { generateAdmissionEmail, sendEmail } from '@/lib/email-service'

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

// Function to create programme-specific fees
async function createProgrammeFees(studentId: string, programme: string) {
  // Try exact match first
  let fees = programmeFees[programme as keyof typeof programmeFees]
  
  // If no exact match, try partial matching for common programme names
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
    console.log(`⚠️ No fee structure defined for programme: ${programme}`)
    console.log(`Available programmes: ${Object.keys(programmeFees).join(', ')}`)
    return
  }

  console.log(`💰 Creating fees for programme: ${programme}`)

  // 1. ADMISSION FEE (Must be paid before getting login credentials)
  await prisma.fee.create({
    data: {
      studentId: studentId,
      amount: fees.admission,
      description: `Admission Fee - ${programme}`,
      dueDate: new Date('2024-09-01'),
      isPaid: false
    }
  })

  // 2. TUITION FEE (Main academic fee)
  await prisma.fee.create({
    data: {
      studentId: studentId,
      amount: fees.tuition,
      description: `Tuition Fee - ${programme} - First Semester 2024/2025`,
      dueDate: new Date('2024-10-01'),
      isPaid: false
    }
  })

  // 3. ACCOMMODATION FEE
  await prisma.fee.create({
    data: {
      studentId: studentId,
      amount: fees.accommodation,
      description: `Accommodation Fee - ${programme} - First Semester 2024/2025`,
      dueDate: new Date('2024-10-15'),
      isPaid: false
    }
  })

  // 4. LIBRARY FEE
  await prisma.fee.create({
    data: {
      studentId: studentId,
      amount: fees.library,
      description: `Library Fee - ${programme} - First Semester 2024/2025`,
      dueDate: new Date('2024-10-20'),
      isPaid: false
    }
  })

  // 5. LABORATORY FEE (For IT/CS/SE programmes)
  if ('laboratory' in fees && fees.laboratory) {
    await prisma.fee.create({
      data: {
        studentId: studentId,
        amount: fees.laboratory,
        description: `Laboratory Fee - ${programme} - First Semester 2024/2025`,
        dueDate: new Date('2024-10-25'),
        isPaid: false
      }
    })
  }

  // 6. EXAMINATION FEE
  await prisma.fee.create({
    data: {
      studentId: studentId,
      amount: fees.examination,
      description: `Examination Fee - ${programme} - First Semester 2024/2025`,
      dueDate: new Date('2024-11-01'),
      isPaid: false
    }
  })

  console.log(`✅ Created ${Object.keys(fees).length} fees for programme: ${programme}`)
}

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
      await createProgrammeFees(user.id, application.programme.name)

      // Send admission email with fees and payment instructions
      const fees = programmeFees[application.programme.name as keyof typeof programmeFees]
      if (fees) {
        const admissionEmail = generateAdmissionEmail({
          studentName: `${application.firstName} ${application.lastName}`,
          email: application.email,
          indexNumber: generatedStudentId,
          programme: application.programme.name,
          fees: fees,
          paymentInstructions: `
            Payment Methods:
            • Bank Transfer: Account details will be provided separately
            • Mobile Money: +1-234-567-8900
            • Cash Payment: Visit our finance office
            
            Payment Reference: ${generatedStudentId}
            Please include your index number in all payment references.
            
            IMPORTANT: You must pay ALL fees ($${fees.total.toLocaleString()}) before you can access the student portal.
            Login credentials will only be provided after complete payment.
          `
        })

        const emailResult = await sendEmail(admissionEmail)
        if (emailResult.success) {
          console.log(`📧 Admission email sent successfully to ${application.email}`)
        } else {
          console.error(`❌ Failed to send admission email: ${emailResult.error}`)
        }
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
          indexNumber: generatedStudentId,
          programme: application.programme.name,
          fees: programmeFees[application.programme.name as keyof typeof programmeFees] || programmeFees['BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)'],
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