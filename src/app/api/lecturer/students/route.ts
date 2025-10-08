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
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const search = searchParams.get('search')

    // Build where clause
    const whereClause: any = {
      enrollments: {
        some: {
          course: {
            lecturerId: lecturerId
          }
        }
      }
    }

    if (courseId) {
      whereClause.enrollments = {
        some: {
          courseId: courseId
        }
      }
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { studentProfile: { studentId: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get students enrolled in lecturer's courses
    const students = await prisma.user.findMany({
      where: whereClause,
      include: {
        studentProfile: true,
        enrollments: {
          where: {
            course: {
              lecturerId: lecturerId
            }
          },
          include: {
            course: {
              select: {
                id: true,
                code: true,
                title: true,
                department: true,
                level: true,
                semester: true,
                academicYear: true
              }
            }
          }
        },
        academicRecords: {
          where: {
            course: {
              lecturerId: lecturerId
            }
          },
          include: {
            course: {
              select: {
                code: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get lecturer's courses for filtering
    const courses = await prisma.course.findMany({
      where: {
        lecturerId: lecturerId
      },
      select: {
        id: true,
        code: true,
        title: true,
        department: true,
        level: true,
        semester: true,
        academicYear: true
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Format students data
    const formattedStudents = students.map(student => {
      const totalCourses = student.enrollments.length
      const averageGrade = student.academicRecords.length > 0
        ? (student.academicRecords.reduce((sum, record) => sum + (parseFloat(record.grade || '0') || 0), 0) / student.academicRecords.length).toFixed(1)
        : 'N/A'

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        studentId: student.studentProfile?.studentId || 'N/A',
        program: student.studentProfile?.program || 'N/A',
        yearOfStudy: student.studentProfile?.yearOfStudy || 'N/A',
        totalCourses: totalCourses,
        averageGrade: averageGrade,
        courses: student.enrollments.map(enrollment => ({
          id: enrollment.course.id,
          code: enrollment.course.code,
          title: enrollment.course.title,
          department: enrollment.course.department,
          level: enrollment.course.level,
          semester: enrollment.course.semester,
          academicYear: enrollment.course.academicYear,
          enrolledAt: enrollment.enrollmentDate
        })),
        academicRecords: student.academicRecords.map(record => ({
          id: record.id,
          courseCode: record.course.code,
          courseTitle: record.course.title,
          grade: parseFloat(record.grade || '0') || 0,
          semester: record.semester,
          academicYear: record.academicYear
        }))
      }
    })

    // Calculate summary statistics
    const totalStudents = students.length
    const totalEnrollments = students.reduce((sum, student) => sum + student.enrollments.length, 0)
    const averageCoursesPerStudent = totalStudents > 0 ? (totalEnrollments / totalStudents).toFixed(1) : '0'

    const summaryStats = {
      totalStudents,
      totalEnrollments,
      averageCoursesPerStudent,
      totalCourses: courses.length
    }

    return NextResponse.json({
      success: true,
      data: {
        students: formattedStudents,
        courses: courses,
        summary: summaryStats
      }
    })

  } catch (error) {
    console.error('Error fetching lecturer students:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
