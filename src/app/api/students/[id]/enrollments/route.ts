import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Check if user is accessing their own enrollments or is an admin
    if (session.user.id !== params.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch student enrollments with course details
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: params.id
      },
      include: {
        course: {
          include: {
            lecturer: {
              include: {
                lecturerProfile: true
              }
            }
          }
        }
      },
      orderBy: {
        enrollmentDate: 'desc'
      }
    })

    // Transform the data
    const enrollmentsWithDetails = enrollments.map(enrollment => ({
      id: enrollment.id,
      enrollmentDate: enrollment.enrollmentDate.toISOString(),
      status: enrollment.status,
      course: {
        id: enrollment.course.id,
        code: enrollment.course.code,
        title: enrollment.course.title,
        description: enrollment.course.description,
        credits: enrollment.course.credits,
        isActive: enrollment.course.isActive,
        lecturer: {
          id: enrollment.course.lecturer.id,
          name: enrollment.course.lecturer.name,
          email: enrollment.course.lecturer.email,
          profile: enrollment.course.lecturer.lecturerProfile
        }
      }
    }))

    return NextResponse.json({
      success: true,
      data: enrollmentsWithDetails
    })

  } catch (error) {
    console.error('Error fetching enrollments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}