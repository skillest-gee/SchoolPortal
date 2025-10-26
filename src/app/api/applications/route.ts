import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email-service'

const createApplicationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().transform((str) => new Date(str)),
  gender: z.enum(['M', 'F']),
  nationality: z.string().min(2, 'Nationality is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().optional(),
  
  // Academic Information
  programmeId: z.string().min(1, 'Please select a programme'),
  previousSchool: z.string().min(2, 'Previous school is required'),
  graduationYear: z.number().min(1990).max(2024),
  previousGrade: z.number().min(0).max(4).optional().nullable(),
  
  // Additional Academic Information
  qualificationType: z.string().min(1, 'Please select your qualification type'),
  entryLevel: z.string().min(1, 'Please select your entry level'),
  studyMode: z.string().min(1, 'Please select your preferred study mode'),
  academicYear: z.string().min(1, 'Please select the academic year'),
  
  // Emergency Contact Information
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().min(2, 'Relationship is required'),
  emergencyContactAddress: z.string().min(10, 'Emergency contact address is required'),
  
  // Additional Information
  specialNeeds: z.string().optional(),
  previousUniversity: z.string().optional(),
  workExperience: z.string().optional(),
  motivationStatement: z.string().min(50, 'Motivation statement must be at least 50 characters'),
  
  // Documents
  resultDocument: z.string().optional(),
  passportPhoto: z.string().optional(),
  birthCertificate: z.string().optional(),
})

// GET: Fetch applications (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view applications
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const programmeId = searchParams.get('programmeId')
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (status) {
      where.status = status
    }
    if (programmeId) {
      where.programmeId = programmeId
    }

    // Get total count and paginated data
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          programme: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.application.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createApplicationSchema.parse(body)

    // Check if email already exists in applications
    const existingApplication = await prisma.application.findFirst({
      where: {
        email: validatedData.email
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'An application with this email already exists' },
        { status: 400 }
      )
    }

    // Generate application number
    const year = new Date().getFullYear()
    const count = await prisma.application.count({
      where: {
        createdAt: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      }
    })
    const applicationNumber = `APP${year}${String(count + 1).padStart(4, '0')}`

    // Create the application
    const application = await prisma.application.create({
      data: {
        ...validatedData,
        applicationNumber,
        status: 'PENDING'
      },
      include: {
        programme: true
      }
    })

    // Send confirmation email to student
    try {
      const confirmationEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            ✓ Application Received!
          </h1>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Dear <strong>${application.firstName} ${application.lastName}</strong>,</p>
            
            <div style="background: #e8f4fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <h3 style="margin-top: 0;">📝 Your Application Has Been Received!</h3>
              <p>Thank you for applying to our institution. We have successfully received your application and it is now under review.</p>
            </div>

            <h3>📋 Application Details:</h3>
            <ul>
              <li><strong>Application Number:</strong> <span style="color: #2196F3; font-weight: bold;">${application.applicationNumber}</span></li>
              <li><strong>Programme:</strong> ${application.programme.name}</li>
              <li><strong>Department:</strong> ${application.programme.department}</li>
              <li><strong>Academic Year:</strong> ${validatedData.academicYear}</li>
              <li><strong>Status:</strong> Pending Review</li>
            </ul>

            <h3>🔍 Track Your Application Status:</h3>
            <p>You can check the status of your application at any time by visiting:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${process.env.NEXTAUTH_URL}/application-status" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Check Application Status
              </a>
            </p>
            
            <p>You will need to provide:</p>
            <ul>
              <li>Email: ${application.email}</li>
              <li>Application Number: ${application.applicationNumber}</li>
            </ul>

            <h3>⏱️ What Happens Next?</h3>
            <p>Our admissions team will review your application. This process typically takes 5-7 business days. You will receive an email notification once a decision has been made.</p>

            <p>Best regards,<br>
            <strong>Admissions Team</strong></p>
          </div>
        </div>
      `

      const emailResult = await sendEmail({
        to: application.email,
        subject: `Application Received - ${application.applicationNumber}`,
        html: confirmationEmailHtml,
        text: confirmationEmailHtml.replace(/<[^>]*>/g, '')
      })

      if (emailResult.success) {
        console.log(`✅ Confirmation email sent to ${application.email}`)
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    })

  } catch (error) {
    console.error('Error creating application:', error)
    
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