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

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          courses: [],
          assignments: [],
          announcements: [],
          students: [],
          total: 0
        }
      })
    }

    const searchTerm = query.trim().toLowerCase()
    const results: any = {
      courses: [],
      assignments: [],
      announcements: [],
      students: [],
      total: 0
    }

    // Search courses
    if (type === 'all' || type === 'courses') {
      const courses = await prisma.course.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              OR: [
                { title: { contains: searchTerm } },
                { code: { contains: searchTerm } },
                { description: { contains: searchTerm } }
              ]
            }
          ]
        },
        include: {
          lecturer: true,
          enrollments: session.user.role === 'STUDENT' ? {
            where: { studentId: session.user.id }
          } : false
        },
        take: 10
      })

      results.courses = courses.map(course => ({
        id: course.id,
        type: 'course',
        title: course.title,
        code: course.code,
        description: course.description,
        lecturer: course.lecturer.name,
        isEnrolled: session.user.role === 'STUDENT' ? course.enrollments.length > 0 : false,
        url: `/courses/${course.id}`
      }))
    }

    // Search assignments
    if (type === 'all' || type === 'assignments') {
      const assignments = await prisma.assignment.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm } },
                { description: { contains: searchTerm } }
              ]
            },
            session.user.role === 'STUDENT' ? {
              course: {
                enrollments: {
                  some: { studentId: session.user.id }
                }
              }
            } : session.user.role === 'LECTURER' ? {
              course: {
                lecturerId: session.user.id
              }
            } : {}
          ]
        },
        include: {
          course: true,
          submissions: session.user.role === 'STUDENT' ? {
            where: { studentId: session.user.id }
          } : false
        },
        take: 10
      })

      results.assignments = assignments.map(assignment => ({
        id: assignment.id,
        type: 'assignment',
        title: assignment.title,
        description: assignment.description,
        course: assignment.course.title,
        dueDate: assignment.dueDate,
        isSubmitted: session.user.role === 'STUDENT' ? assignment.submissions.length > 0 : false,
        url: `/assignments/${assignment.id}`
      }))
    }

    // Search announcements
    if (type === 'all' || type === 'announcements') {
      const announcements = await prisma.announcement.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchTerm } },
                { content: { contains: searchTerm } }
              ]
            },
            {
              OR: [
                { targetAudience: 'ALL' },
                { targetAudience: session.user.role }
              ]
            }
          ]
        },
        include: {
          author: true
        },
        take: 10
      })

      results.announcements = announcements.map(announcement => ({
        id: announcement.id,
        type: 'announcement',
        title: announcement.title,
        content: announcement.content,
        author: announcement.author.name,
        createdAt: announcement.createdAt,
        url: '/announcements'
      }))
    }

    // Search students (for lecturers and admins)
    if ((type === 'all' || type === 'students') && (session.user.role === 'LECTURER' || session.user.role === 'ADMIN')) {
      const students = await prisma.user.findMany({
        where: {
          AND: [
            { role: 'STUDENT' },
            {
              OR: [
                { name: { contains: searchTerm } },
                { email: { contains: searchTerm } },
                { indexNumber: { contains: searchTerm } }
              ]
            }
          ]
        },
        include: {
          studentProfile: true
        },
        take: 10
      })

      results.students = students.map(student => ({
        id: student.id,
        type: 'student',
        name: student.name,
        email: student.email,
        indexNumber: student.indexNumber,
        programme: student.studentProfile?.programme,
        level: student.studentProfile?.level,
        url: `/students/${student.id}`
      }))
    }

    // Calculate total results
    results.total = results.courses.length + results.assignments.length + results.announcements.length + results.students.length

    return NextResponse.json({
      success: true,
      data: results
    })

  } catch (error) {
    console.error('Error performing search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
