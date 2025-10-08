import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    let session
    try {
      session = await getServerSession(authOptions)
    } catch (error) {
      console.error('Session error:', error)
      return NextResponse.json({ error: 'Session error' }, { status: 401 })
    }
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const studentId = session.user.id

    // Get student profile
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
      include: { user: true }
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Get enrolled courses
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: studentId },
      include: {
        course: {
          include: {
            lecturer: true
          }
        }
      }
    })

    // Get recent announcements
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetAudience: 'ALL' },
          { targetAudience: 'STUDENT' }
        ]
      },
      include: {
        author: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    // Get recent assignments
    const recentAssignments = await prisma.assignment.findMany({
      where: {
        course: {
          enrollments: {
            some: { studentId: studentId }
          }
        }
      },
      include: {
        course: true,
        submissions: {
          where: { studentId: studentId }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    })

    // Get recent grades
    const recentGrades = await prisma.academicRecord.findMany({
      where: { studentId: studentId },
      include: {
        course: true
      },
      orderBy: { id: 'desc' },
      take: 5
    })

    // Calculate statistics
    const totalCourses = enrollments.length
    const totalCredits = enrollments.reduce((sum, enrollment) => sum + enrollment.course.credits, 0)
    
    // For new students, GPA should be 0.00 until they complete courses
    // Only calculate GPA if student has completed courses with grades
    const completedCoursesWithGrades = recentGrades.filter(grade => grade.grade && grade.grade !== '')
    const currentGPA = completedCoursesWithGrades.length > 0 ? (studentProfile.gpa || 0) : 0
    
    const pendingAssignments = recentAssignments.filter(assignment => 
      !assignment.submissions.some(submission => submission.studentId === studentId)
    ).length

    // Get recent activity (combine assignments, grades, announcements)
    const recentActivity = [
      ...recentAssignments.map(assignment => ({
        id: `assignment-${assignment.id}`,
        type: 'assignment' as const,
        title: `New Assignment: ${assignment.title}`,
        description: assignment.description,
        date: assignment.createdAt,
        course: assignment.course.title,
        status: assignment.submissions.length > 0 ? 'completed' : 'pending'
      })),
      ...recentGrades.map(grade => ({
        id: `grade-${grade.id}`,
        type: 'grade' as const,
        title: `Grade Posted: ${grade.course.title}`,
        description: `You received a grade of ${grade.grade}`,
        date: new Date(), // Use current date since AcademicRecord doesn't have timestamps
        course: grade.course.title,
        status: 'completed'
      })),
      ...announcements.map(announcement => ({
        id: `announcement-${announcement.id}`,
        type: 'announcement' as const,
        title: announcement.title,
        description: announcement.content,
        date: announcement.createdAt,
        course: 'General',
        status: 'completed'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: studentProfile.studentId,
          name: studentProfile.user.name,
          gpa: currentGPA,
          level: studentProfile.level,
          programme: studentProfile.programme
        },
        stats: {
          totalCourses,
          totalCredits,
          currentGPA,
          pendingAssignments
        },
        announcements: announcements.map(announcement => ({
          id: announcement.id,
          title: announcement.title,
          content: announcement.content,
          date: announcement.createdAt.toISOString().split('T')[0],
          author: announcement.author.name,
          priority: 'medium' // Default priority since it's not in the schema
        })),
        recentActivity,
        enrollments: enrollments.map(enrollment => ({
          id: enrollment.id,
          course: {
            id: enrollment.course.id,
            code: enrollment.course.code,
            title: enrollment.course.title,
            credits: enrollment.course.credits,
            lecturer: enrollment.course.lecturer.name
          },
          enrollmentDate: enrollment.enrollmentDate,
          grade: enrollment.grade
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching student dashboard data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
