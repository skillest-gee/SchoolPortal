import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for updating grades
const updateGradesSchema = z.object({
  grades: z.array(z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    grade: z.string().min(1, 'Grade is required'),
    points: z.number().optional(),
    comments: z.string().optional()
  }))
})

// GET: Fetch all students enrolled in the course with their grades
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify that the user is a lecturer
    if (session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { error: 'Only lecturers can access this endpoint' },
        { status: 403 }
      )
    }

    const courseId = params.courseId

    // Verify that the lecturer is teaching this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to access grades for this course' },
        { status: 403 }
      )
    }

    // Fetch all enrolled students with their grades
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        status: 'ENROLLED'
      },
      include: {
        student: {
          include: {
            studentProfile: true
          }
        }
      },
      orderBy: {
        student: {
          studentProfile: {
            studentId: 'asc'
          }
        }
      }
    })

    // Fetch academic records for these students
    const academicRecords = await prisma.academicRecord.findMany({
      where: {
        courseId,
        studentId: {
          in: enrollments.map(e => e.studentId)
        }
      }
    })

    // Combine enrollment and academic record data
    const studentsWithGrades = enrollments.map(enrollment => {
      const academicRecord = academicRecords.find(
        record => record.studentId === enrollment.studentId
      )

      return {
        enrollmentId: enrollment.id,
        studentId: enrollment.student.id,
        studentName: enrollment.student.name,
        studentEmail: enrollment.student.email,
        studentProfile: {
          studentId: enrollment.student.studentProfile?.studentId,
          program: enrollment.student.studentProfile?.program,
          yearOfStudy: enrollment.student.studentProfile?.yearOfStudy
        },
        enrollmentDate: enrollment.enrollmentDate,
        enrollmentStatus: enrollment.status,
        academicRecord: academicRecord ? {
          id: academicRecord.id,
          grade: academicRecord.grade,
          points: academicRecord.points,
          gpa: academicRecord.gpa,
          status: academicRecord.status,
          semester: academicRecord.semester,
          academicYear: academicRecord.academicYear
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        course: {
          id: course.id,
          code: course.code,
          title: course.title,
          credits: course.credits,
          semester: course.semester,
          academicYear: course.academicYear
        },
        students: studentsWithGrades
      }
    })

  } catch (error) {
    console.error('Error fetching course grades:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Update grades for students in the course
export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify that the user is a lecturer
    if (session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { error: 'Only lecturers can update grades' },
        { status: 403 }
      )
    }

    const courseId = params.courseId

    // Verify that the lecturer is teaching this course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: true
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to update grades for this course' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { grades } = updateGradesSchema.parse(body)

    // Validate that all students are enrolled in this course
    const studentIds = grades.map(g => g.studentId)
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        studentId: {
          in: studentIds
        }
      }
    })

    if (enrollments.length !== studentIds.length) {
      return NextResponse.json(
        { error: 'Some students are not enrolled in this course' },
        { status: 400 }
      )
    }

    // Update grades in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const updatedRecords = []

      for (const gradeData of grades) {
        // Update or create academic record
        const academicRecord = await tx.academicRecord.upsert({
          where: {
            studentId_courseId_semester_academicYear: {
              studentId: gradeData.studentId,
              courseId,
              semester: course.semester || 'First Semester',
              academicYear: course.academicYear || '2024/2025'
            }
          },
          update: {
            grade: gradeData.grade,
            points: gradeData.points,
            comments: gradeData.comments,
            status: 'COMPLETED'
          },
          create: {
            studentId: gradeData.studentId,
            courseId,
            semester: course.semester || 'First Semester',
            academicYear: course.academicYear || '2024/2025',
            grade: gradeData.grade,
            points: gradeData.points,
            comments: gradeData.comments,
            status: 'COMPLETED'
          }
        })

        // Update enrollment status if grade is provided
        if (gradeData.grade) {
          await tx.enrollment.update({
            where: {
              studentId_courseId: {
                studentId: gradeData.studentId,
                courseId
              }
            },
            data: {
              status: 'COMPLETED'
            }
          })
        }

        updatedRecords.push(academicRecord)
      }

      return updatedRecords
    })

    return NextResponse.json({
      success: true,
      message: 'Grades updated successfully',
      data: {
        updatedCount: results.length,
        records: results
      }
    })

  } catch (error) {
    console.error('Error updating grades:', error)
    
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
