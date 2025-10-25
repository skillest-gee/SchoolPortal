import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for updating grades
const updateGradeSchema = z.object({
  studentId: z.string(),
  courseId: z.string(),
  grade: z.number().min(0).max(100),
  semester: z.string(),
  academicYear: z.string()
})

// GET: Fetch grades for lecturer's courses
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
    const semester = searchParams.get('semester')
    const academicYear = searchParams.get('academicYear')

    // Build where clause for academic records
    const whereClause: any = {
      course: {
        lecturerId: lecturerId
      }
    }

    if (courseId) {
      whereClause.courseId = courseId
    }

    if (semester) {
      whereClause.semester = semester
    }

    if (academicYear) {
      whereClause.academicYear = academicYear
    }

    // Get academic records with related data
    const academicRecords = await prisma.academicRecord.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            credits: true,
            department: true,
            level: true
          }
        }
      },
      orderBy: [
        { course: { code: 'asc' } },
        { student: { name: 'asc' } }
      ]
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

    // Format grades data
    const formattedGrades = academicRecords.map(record => ({
      id: record.id,
      studentId: record.studentId,
      studentName: record.student.name,
      studentEmail: record.student.email,
      studentIdNumber: record.student.studentProfile?.studentId || 'N/A',
      courseId: record.courseId,
      courseCode: record.course.code,
      courseTitle: record.course.title,
      courseCredits: record.course.credits,
      courseDepartment: record.course.department,
      courseLevel: record.course.level,
      grade: record.grade ? parseFloat(record.grade) : null,
      semester: record.semester,
      academicYear: record.academicYear,
      status: record.grade ? 'graded' : 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // Calculate summary statistics
    const totalRecords = academicRecords.length
    const gradedRecords = academicRecords.filter(record => record.grade).length
    const pendingRecords = totalRecords - gradedRecords
    const averageGrade = gradedRecords > 0 
      ? (academicRecords
          .filter(record => record.grade)
          .reduce((sum, record) => sum + (parseFloat(record.grade || '0') || 0), 0) / gradedRecords)
          .toFixed(1)
      : 'N/A'

    const summaryStats = {
      totalRecords,
      gradedRecords,
      pendingRecords,
      averageGrade,
      totalCourses: courses.length
    }

    return NextResponse.json({
      success: true,
      data: {
        grades: formattedGrades,
        courses: courses,
        summary: summaryStats
      }
    })

  } catch (error) {
    console.error('Error fetching lecturer grades:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}

// POST: Update or create grades
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const lecturerId = session.user.id
    const body = await request.json()
    const validatedData = updateGradeSchema.parse(body)

    // Verify the course belongs to the lecturer
    const course = await prisma.course.findFirst({
      where: {
        id: validatedData.courseId,
        lecturerId: lecturerId
      }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found or access denied' },
        { status: 404 }
      )
    }

    // Verify the student is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: validatedData.studentId,
        courseId: validatedData.courseId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Student not enrolled in this course' },
        { status: 400 }
      )
    }

    // Update or create academic record
    const academicRecord = await prisma.academicRecord.upsert({
      where: {
        studentId_courseId_semester_academicYear: {
          studentId: validatedData.studentId,
          courseId: validatedData.courseId,
          semester: validatedData.semester,
          academicYear: validatedData.academicYear
        }
      },
      update: {
        grade: validatedData.grade.toString(),
      },
      create: {
        studentId: validatedData.studentId,
        courseId: validatedData.courseId,
        semester: validatedData.semester,
        academicYear: validatedData.academicYear,
        grade: validatedData.grade.toString()
      },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        course: {
          select: {
            code: true,
            title: true
          }
        }
      }
    })

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: validatedData.studentId,
        title: 'Grade Updated',
        content: `Your grade for ${academicRecord.course.code} - ${academicRecord.course.title} has been updated to ${validatedData.grade}%.`,
        type: 'INFO'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
      data: {
        id: academicRecord.id,
        studentName: academicRecord.student.name,
        courseCode: academicRecord.course.code,
        courseTitle: academicRecord.course.title,
        grade: validatedData.grade,
        semester: validatedData.semester,
        academicYear: validatedData.academicYear
      }
    })

  } catch (error) {
    console.error('Error updating grade:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update grade' },
      { status: 500 }
    )
  }
}
