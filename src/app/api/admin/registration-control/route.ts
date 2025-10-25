import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registrationControlSchema = z.object({
  action: z.enum(['OPEN', 'CLOSE']),
  academicYear: z.string(),
  semester: z.string(),
  message: z.string().optional()
})

// POST: Control course registration (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = registrationControlSchema.parse(body)

    // Find existing registration period
    let registrationPeriod = await prisma.courseRegistrationPeriod.findFirst({
      where: {
        academicYear: validatedData.academicYear,
        semester: validatedData.semester
      }
    })

    if (registrationPeriod) {
      // Update existing period
      registrationPeriod = await prisma.courseRegistrationPeriod.update({
        where: { id: registrationPeriod.id },
        data: {
          isActive: validatedData.action === 'OPEN',
          updatedAt: new Date()
        }
      })
    } else {
      // Create new period
      registrationPeriod = await prisma.courseRegistrationPeriod.create({
        data: {
          name: `${validatedData.academicYear} ${validatedData.semester} Registration`,
          description: `Course registration period for ${validatedData.academicYear} ${validatedData.semester}`,
          academicYear: validatedData.academicYear,
          semester: validatedData.semester,
          isActive: validatedData.action === 'OPEN',
          startDate: validatedData.action === 'OPEN' ? new Date() : new Date('2024-01-01'),
          endDate: validatedData.action === 'OPEN' ? new Date('2025-06-30') : new Date('2024-01-01')
        }
      })
    }

    // Create notification for all students
    if (validatedData.message) {
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' }
      })

      const notificationPromises = students.map(student =>
        prisma.notification.create({
          data: {
            userId: student.id,
            title: `Course Registration ${validatedData.action === 'OPEN' ? 'Opened' : 'Closed'}`,
            content: validatedData.message || `Course registration has been ${validatedData.action === 'OPEN' ? 'opened' : 'closed'} for ${validatedData.academicYear} ${validatedData.semester}.`,
            type: validatedData.action === 'OPEN' ? 'SUCCESS' : 'WARNING'
          }
        })
      )

      await Promise.all(notificationPromises)
    }

    return NextResponse.json({
      success: true,
      message: `Course registration ${validatedData.action === 'OPEN' ? 'opened' : 'closed'} successfully`,
      data: registrationPeriod
    })

  } catch (error) {
    console.error('Error controlling registration:', error)
    
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

// GET: Get current registration status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear') || '2024/2025'
    const semester = searchParams.get('semester') || '1st Semester'

    const registrationPeriod = await prisma.courseRegistrationPeriod.findFirst({
      where: {
        academicYear: academicYear,
        semester: semester
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        isOpen: registrationPeriod?.isActive || false,
        academicYear: academicYear,
        semester: semester,
        startDate: registrationPeriod?.startDate,
        endDate: registrationPeriod?.endDate
      }
    })

  } catch (error) {
    console.error('Error fetching registration status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}