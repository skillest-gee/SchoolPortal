import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registrationSchema = z.object({
  courseIds: z.array(z.string()).min(1, 'At least one course must be selected')
})

// GET: Fetch available courses for registration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = session.user.id
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear') || '2024/2025'
    const semester = searchParams.get('semester') || '1st Semester'

    // Check if registration is open
    const registrationPeriod = await prisma.courseRegistrationPeriod.findFirst({
      where: {
        academicYear: academicYear,
        semester: semester,
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const isRegistrationOpen = registrationPeriod ? 
      new Date() >= registrationPeriod.startDate && new Date() <= registrationPeriod.endDate : false

    // Check student's fee status - simplified check
    const studentFees = await prisma.fee.findMany({
      where: {
        studentId: studentId
      },
      include: {
        payments: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    })

    // Simple fee check - student can register if they have any payment history
    const hasAnyPayments = studentFees.some(fee => fee.payments.length > 0)
    const feeAnalysis = {
      canRegister: hasAnyPayments,
      outstandingAmount: studentFees.reduce((sum, fee) => {
        const paidAmount = fee.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
        return sum + (fee.amount - paidAmount)
      }, 0),
      missingPayments: studentFees.filter(fee => {
        const paidAmount = fee.payments.reduce((sum, payment) => sum + payment.amount, 0)
        return fee.amount > paidAmount
      }).map(fee => ({
        description: fee.description,
        amount: fee.amount - fee.payments.reduce((sum, payment) => sum + payment.amount, 0),
        dueDate: fee.dueDate
      }))
    }

    // Get student profile to determine program
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Get all active courses
    const courses = await prisma.course.findMany({
      where: {
        isActive: true
      },
      include: {
        lecturer: true,
        enrollments: {
          where: {
            studentId: studentId
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Check if student has already registered for this semester
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId,
        status: 'ACTIVE'
      }
    })

    const hasRegistered = existingEnrollments.length > 0

    // Transform courses data
    const coursesWithEnrollmentStatus = courses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.title,
      description: course.description,
      credits: course.credits,
      department: course.department,
      level: course.level,
      lecturer: {
        name: course.lecturer.name || 'TBA'
      },
      isEnrolled: course.enrollments.length > 0
    }))

    // Determine registration status
    let registrationStatus: 'OPEN' | 'CLOSED' | 'COMPLETED' | 'FEES_OUTSTANDING' = 'CLOSED'
    let canRegister = false
    let registrationMessage = ''

    if (hasRegistered) {
      registrationStatus = 'COMPLETED'
      registrationMessage = 'You have already registered for this semester'
    } else if (!isRegistrationOpen) {
      registrationStatus = 'CLOSED'
      registrationMessage = 'Course registration is currently closed'
    } else if (!feeAnalysis.canRegister) {
      registrationStatus = 'FEES_OUTSTANDING'
      registrationMessage = `You have outstanding fees of $${feeAnalysis.outstandingAmount.toFixed(2)}. Please pay your fees before registering for courses.`
    } else {
      registrationStatus = 'OPEN'
      canRegister = true
      registrationMessage = 'Course registration is open. You can register for courses.'
    }

    return NextResponse.json({
      success: true,
      data: {
        courses: coursesWithEnrollmentStatus,
        registrationStatus,
        canRegister,
        registrationMessage,
        feeStatus: {
          canRegister: feeAnalysis.canRegister,
          outstandingAmount: feeAnalysis.outstandingAmount,
          missingPayments: feeAnalysis.missingPayments,
          totalFees: 0,
          paidAmount: 0
        },
        registrationPeriod: registrationPeriod ? {
          name: registrationPeriod.name,
          startDate: registrationPeriod.startDate,
          endDate: registrationPeriod.endDate,
          description: registrationPeriod.description
        } : null,
        studentProfile: {
          program: studentProfile.program,
          yearOfStudy: studentProfile.yearOfStudy
        }
      }
    })

  } catch (error) {
    console.error('Error fetching course registration data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Register for courses
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { courseIds } = registrationSchema.parse(body)

    const studentId = session.user.id
    const academicYear = '2024/2025'
    const semester = '1st Semester'

    // Check if registration is open
    const registrationPeriod = await prisma.courseRegistrationPeriod.findFirst({
      where: {
        academicYear: academicYear,
        semester: semester,
        isActive: true
      }
    })

    const isRegistrationOpen = registrationPeriod ? 
      new Date() >= registrationPeriod.startDate && new Date() <= registrationPeriod.endDate : false

    if (!isRegistrationOpen) {
      return NextResponse.json(
        { error: 'Course registration is currently closed' },
        { status: 400 }
      )
    }

    // Check student's fee status
    const studentFees = await prisma.fee.findMany({
      where: {
        studentId: studentId
      },
      include: {
        payments: {
          where: {
            status: 'COMPLETED'
          }
        }
      }
    })

    // Calculate fee status
    const tuitionFees = studentFees.filter(fee => fee.description.includes('Tuition'))
    const totalTuition = tuitionFees.reduce((sum, fee) => sum + fee.amount, 0)
    const paidTuition = tuitionFees.reduce((sum, fee) => 
      sum + fee.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0), 0
    )

    const canRegister = totalTuition > 0 && (paidTuition / totalTuition) >= 0.5

    if (!canRegister) {
      return NextResponse.json(
        { error: 'You must pay at least 50% of your tuition fees before registering for courses' },
        { status: 400 }
      )
    }

    // Check if student has already registered
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        studentId: studentId,
        status: 'ACTIVE'
      }
    })

    if (existingEnrollments.length > 0) {
      return NextResponse.json(
        { error: 'You have already registered for this semester' },
        { status: 400 }
      )
    }

    // Validate courses exist and are active
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        isActive: true
      }
    })

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'One or more courses are invalid or inactive' },
        { status: 400 }
      )
    }

    // Calculate total credits
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0)

    if (totalCredits < 12 || totalCredits > 18) {
      return NextResponse.json(
        { error: 'Total credits must be between 12 and 18' },
        { status: 400 }
      )
    }

    // Create enrollments
    const enrollments = await Promise.all(
      courseIds.map(courseId =>
        prisma.enrollment.create({
          data: {
            studentId: studentId,
            courseId: courseId,
            status: 'ACTIVE',
            enrollmentDate: new Date()
          }
        })
      )
    )

    // Create academic records for each course
    await Promise.all(
      courseIds.map(courseId =>
        prisma.academicRecord.create({
          data: {
            studentId: studentId,
            courseId: courseId,
            semester: semester,
            academicYear: academicYear,
            grade: null, // No grade yet
            points: null
          }
        })
      )
    )

    // Create notification for successful registration
    await prisma.notification.create({
      data: {
        userId: studentId,
        title: 'Course Registration Successful',
        content: `You have successfully registered for ${courseIds.length} courses (${totalCredits} credits) for the ${semester} ${academicYear}.`,
        type: 'SUCCESS'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Course registration completed successfully',
      data: {
        enrollments: enrollments.length,
        totalCredits,
        courses: courses.map(course => ({
          code: course.code,
          title: course.title,
          credits: course.credits
        }))
      }
    })

  } catch (error) {
    console.error('Error registering for courses:', error)
    
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