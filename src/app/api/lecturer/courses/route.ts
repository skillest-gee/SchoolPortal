import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lecturerId = session.user.id

    // Get lecturer's courses with enrollment counts
    const courses = await prisma.course.findMany({
      where: {
        lecturerId: lecturerId
      },
      include: {
        _count: {
          select: {
            enrollments: true
          }
        },
        lecturer: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Format courses data
    const formattedCourses = courses.map(course => ({
      id: course.id,
      code: course.code,
      title: course.title,
      description: course.description || '',
      credits: course.credits,
      department: course.department,
      level: course.level,
      semester: course.semester,
      academicYear: course.academicYear,
      enrolledStudents: course._count.enrollments,
      totalCapacity: 50, // Default capacity, can be made configurable
      status: course.isActive ? 'active' : 'inactive',
      createdAt: course.createdAt,
      lecturer: course.lecturer
    }))

    // Calculate summary statistics
    const totalCourses = courses.length
    const totalStudents = courses.reduce((sum, course) => sum + course._count.enrollments, 0)
    const activeCourses = courses.filter(course => course.isActive).length
    const averageEnrollment = totalCourses > 0 ? Math.round(totalStudents / totalCourses) : 0

    const summaryStats = {
      totalCourses,
      totalStudents,
      activeCourses,
      averageEnrollment
    }

    return NextResponse.json({
      success: true,
      data: {
        courses: formattedCourses,
        summary: summaryStats
      }
    })

  } catch (error) {
    console.error('Error fetching lecturer courses:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}