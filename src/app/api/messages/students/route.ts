import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get all students for messaging (like WhatsApp contacts)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Allow all roles to see students (for messaging purposes)
    // For students: see other students
    // For lecturers/admin: see students for messaging

    // Get all students except the current user
    const students = await prisma.user.findMany({
      where: {
        role: 'STUDENT',
        id: { not: session.user.id }
      },
      include: {
        studentProfile: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Transform the data
    const studentsList = students.map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      studentId: student.studentProfile?.studentId,
      profileImage: student.image,
      profile: {
        firstName: student.studentProfile?.firstName,
        surname: student.studentProfile?.surname,
        programme: student.studentProfile?.programme,
        yearOfStudy: student.studentProfile?.yearOfStudy
      }
    }))

    return NextResponse.json({
      success: true,
      data: studentsList
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
