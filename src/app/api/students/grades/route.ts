import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Get student's academic records (grades)
    const academicRecords = await prisma.academicRecord.findMany({
      where: { studentId: studentId },
      include: {
        course: {
          include: {
            lecturer: true
          }
        }
      },
      orderBy: [
        { academicYear: 'desc' },
        { semester: 'desc' },
        { course: { code: 'asc' } }
      ]
    })

    // Get student's enrollments to calculate GPA
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: studentId },
      include: {
        course: true
      }
    })

    // Calculate GPA
    let totalPoints = 0
    let totalCredits = 0
    let gpa = 0

    academicRecords.forEach(record => {
      if (record.grade && record.points && record.course.credits) {
        totalPoints += record.points * record.course.credits
        totalCredits += record.course.credits
      }
    })

    if (totalCredits > 0) {
      gpa = totalPoints / totalCredits
    }

    // Transform the data
    const grades = academicRecords.map(record => ({
      id: record.id,
      courseCode: record.course.code,
      courseName: record.course.title,
      semester: record.semester,
      academicYear: record.academicYear,
      grade: record.grade || '-', // Show '-' for ungraded courses
      points: record.points || 0,
      credits: record.course.credits,
      lecturer: record.course.lecturer.name,
      date: record.grade ? new Date().toISOString().split('T')[0] : null, // Only show date if graded
      isGraded: !!record.grade && record.grade !== ''
    }))

    // Group by semester and academic year
    const groupedGrades = grades.reduce((acc, grade) => {
      const key = `${grade.academicYear}-${grade.semester}`
      if (!acc[key]) {
        acc[key] = {
          academicYear: grade.academicYear,
          semester: grade.semester,
          grades: [],
          semesterGPA: 0,
          totalCredits: 0
        }
      }
      acc[key].grades.push(grade)
      acc[key].totalCredits += grade.credits
      return acc
    }, {} as Record<string, any>)

    // Calculate semester GPA for each group (only graded courses)
    Object.values(groupedGrades).forEach((group: any) => {
      let semesterPoints = 0
      let semesterCredits = 0
      let gradedCourses = 0
      
      group.grades.forEach((grade: any) => {
        if (grade.isGraded && grade.points > 0) {
          semesterPoints += grade.points * grade.credits
          semesterCredits += grade.credits
          gradedCourses++
        }
      })
      
      if (semesterCredits > 0) {
        group.semesterGPA = semesterPoints / semesterCredits
      } else {
        group.semesterGPA = 0.00 // No grades yet
      }
      
      group.gradedCourses = gradedCourses
      group.totalCourses = group.grades.length
    })

    return NextResponse.json({
      success: true,
      data: {
        grades,
        groupedGrades: Object.values(groupedGrades),
        overallGPA: gpa,
        totalCredits,
        totalCourses: academicRecords.length
      }
    })
  } catch (error) {
    console.error('Error fetching student grades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
