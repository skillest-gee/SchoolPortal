import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all active courses with lecturer information
    const courses = await prisma.course.findMany({
      where: {
        isActive: true
      },
      include: {
        lecturer: {
          include: {
            lecturerProfile: true
          }
        },
        enrollments: {
          where: {
            studentId: session.user.id
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Transform the data to include lecturer name and enrollment status
    const coursesWithLecturerInfo = courses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.title,
      description: course.description,
      credits: course.credits,
      isActive: course.isActive,
      lecturer: {
        id: course.lecturer.id,
        name: course.lecturer.name,
        email: course.lecturer.email,
        profile: course.lecturer.lecturerProfile
      },
      isEnrolled: course.enrollments.length > 0,
      enrollmentId: course.enrollments[0]?.id || null,
      enrollmentStatus: course.enrollments[0]?.status || null,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: coursesWithLecturerInfo
    })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
