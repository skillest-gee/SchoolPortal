import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkStatusSchema = z.object({
  email: z.string().email('Invalid email address'),
  applicationNumber: z.string().min(1, 'Application number is required')
})

// POST: Check application status (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = checkStatusSchema.parse(body)

    // Find application by email and application number
    const application = await prisma.application.findFirst({
      where: {
        email: validatedData.email,
        applicationNumber: validatedData.applicationNumber
      },
      include: {
        programme: true
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found. Please check your email and application number.' },
        { status: 404 }
      )
    }

    // Return application data (excluding sensitive information)
    const responseData = {
      id: application.id,
      applicationNumber: application.applicationNumber,
      firstName: application.firstName,
      middleName: application.middleName,
      lastName: application.lastName,
      email: application.email,
      phoneNumber: application.phoneNumber,
      dateOfBirth: application.dateOfBirth,
      gender: application.gender,
      nationality: application.nationality,
      address: application.address,
      city: application.city,
      state: application.state,
      previousSchool: application.previousSchool,
      graduationYear: application.graduationYear,
      previousGrade: application.previousGrade,
      status: application.status,
      adminNotes: application.adminNotes,
      generatedStudentId: application.generatedStudentId,
      createdAt: application.createdAt,
      reviewedAt: application.reviewedAt,
      programme: {
        id: application.programme.id,
        code: application.programme.code,
        name: application.programme.name,
        department: application.programme.department
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData
    })

  } catch (error) {
    console.error('Error checking application status:', error)
    
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
