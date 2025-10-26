import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = session.user.id

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: {
        user: true
      }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Get all academic records with course details
    const academicRecords = await prisma.academicRecord.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            lecturer: true
          }
        }
      },
      orderBy: [
        { academicYear: 'desc' },
        { semester: 'asc' }
      ]
    })

    // Calculate GPA
    let totalPoints = 0
    let totalCredits = 0

    academicRecords.forEach(record => {
      if (record.grade !== null && record.grade !== undefined) {
        const credits = record.course.credits
        const gradeValue = typeof record.grade === 'string' ? parseFloat(record.grade) : record.grade
        const gradePoints = calculateGradePoints(gradeValue)
        totalPoints += gradePoints * credits
        totalCredits += credits
      }
    })

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0

    // Get student's level/program details
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: true
      },
      distinct: ['courseId']
    })

    const totalCreditsEarned = enrollments.reduce((sum, enrollment) => {
      const record = academicRecords.find(r => r.courseId === enrollment.courseId)
      if (record && record.status === 'PASSED' && record.grade !== null) {
        return sum + enrollment.course.credits
      }
      return sum
    }, 0)

    // Return transcript data
    return NextResponse.json({
      success: true,
      data: {
        student: {
          studentId: studentProfile.studentId,
          name: `${studentProfile.firstName} ${studentProfile.middleName || ''} ${studentProfile.lastName}`.trim(),
          programme: studentProfile.programme || 'N/A',
          level: studentProfile.level || 'N/A',
          gpa: gpa.toFixed(2),
          totalCreditsEarned,
          totalCreditsAttempted: totalCredits
        },
        records: academicRecords.map(record => ({
          courseCode: record.course.code,
          courseTitle: record.course.title,
          credits: record.course.credits,
          grade: record.grade !== null ? record.grade : 'N/A',
          letterGrade: record.grade !== null ? getLetterGrade(record.grade) : 'N/A',
          semester: record.semester,
          academicYear: record.academicYear,
          status: record.status
        }))
      }
    })

  } catch (error) {
    console.error('Error generating transcript:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateGradePoints(grade: number): number {
  if (grade >= 80) return 4.0
  if (grade >= 75) return 3.75
  if (grade >= 70) return 3.5
  if (grade >= 65) return 3.0
  if (grade >= 60) return 2.5
  if (grade >= 55) return 2.0
  if (grade >= 50) return 1.5
  if (grade >= 45) return 1.0
  return 0.0
}

function getLetterGrade(grade: number): string {
  if (grade >= 80) return 'A'
  if (grade >= 75) return 'B+'
  if (grade >= 70) return 'B'
  if (grade >= 65) return 'C+'
  if (grade >= 60) return 'C'
  if (grade >= 55) return 'D+'
  if (grade >= 50) return 'D'
  if (grade >= 45) return 'E'
  return 'F'
}

