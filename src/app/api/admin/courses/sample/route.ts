import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST: Create sample courses for testing
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get a lecturer to assign courses to
    const lecturer = await prisma.user.findFirst({
      where: { role: 'LECTURER' }
    })

    if (!lecturer) {
      return NextResponse.json({ error: 'No lecturer found to assign courses' }, { status: 404 })
    }

    // Sample courses for different programs
    const sampleCourses = [
      // Computer Science Courses
      {
        code: 'CS101',
        title: 'Introduction to Computer Science',
        description: 'Fundamental concepts of computer science and programming',
        credits: 3,
        department: 'Computer Science',
        level: '100',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'CS102',
        title: 'Programming Fundamentals',
        description: 'Basic programming concepts using Python and Java',
        credits: 4,
        department: 'Computer Science',
        level: '100',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'CS201',
        title: 'Data Structures and Algorithms',
        description: 'Advanced data structures and algorithm design',
        credits: 4,
        department: 'Computer Science',
        level: '200',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'CS301',
        title: 'Software Engineering',
        description: 'Software development methodologies and practices',
        credits: 3,
        department: 'Computer Science',
        level: '300',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'CS401',
        title: 'Database Systems',
        description: 'Database design, implementation, and management',
        credits: 3,
        department: 'Computer Science',
        level: '400',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      
      // Information Technology Courses
      {
        code: 'IT101',
        title: 'Introduction to Information Technology',
        description: 'Overview of IT systems and technologies',
        credits: 3,
        department: 'Information Technology',
        level: '100',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'IT201',
        title: 'Network Administration',
        description: 'Computer networks and system administration',
        credits: 4,
        department: 'Information Technology',
        level: '200',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'IT301',
        title: 'Web Development',
        description: 'Modern web development technologies and frameworks',
        credits: 3,
        department: 'Information Technology',
        level: '300',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      
      // Business Administration Courses
      {
        code: 'BA101',
        title: 'Introduction to Business',
        description: 'Fundamental concepts of business and management',
        credits: 3,
        department: 'Business Administration',
        level: '100',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'BA201',
        title: 'Principles of Management',
        description: 'Management theories and practices',
        credits: 3,
        department: 'Business Administration',
        level: '200',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'BA301',
        title: 'Marketing Management',
        description: 'Marketing strategies and consumer behavior',
        credits: 3,
        department: 'Business Administration',
        level: '300',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      
      // General Education Courses
      {
        code: 'GE101',
        title: 'English Communication',
        description: 'English language and communication skills',
        credits: 2,
        department: 'General Education',
        level: '100',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'GE102',
        title: 'Mathematics for Computing',
        description: 'Mathematical concepts for computer science',
        credits: 3,
        department: 'General Education',
        level: '100',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      },
      {
        code: 'GE201',
        title: 'Research Methods',
        description: 'Research methodologies and academic writing',
        credits: 2,
        department: 'General Education',
        level: '200',
        semester: '1st Semester',
        academicYear: '2024/2025',
        lecturerId: lecturer.id
      }
    ]

    // Create courses
    const createdCourses = []
    for (const courseData of sampleCourses) {
      try {
        const course = await prisma.course.create({
          data: courseData
        })
        createdCourses.push(course)
      } catch (error) {
        console.log(`Course ${courseData.code} might already exist, skipping...`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCourses.length} courses successfully`,
      data: {
        coursesCreated: createdCourses.length,
        courses: createdCourses.map(course => ({
          id: course.id,
          code: course.code,
          title: course.title,
          credits: course.credits,
          department: course.department,
          level: course.level
        }))
      }
    })

  } catch (error) {
    console.error('Error creating sample courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: List all courses
export async function GET(request: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        lecturer: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: courses.map(course => ({
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        credits: course.credits,
        department: course.department,
        level: course.level,
        semester: course.semester,
        academicYear: course.academicYear,
        lecturer: course.lecturer,
        enrollmentCount: course._count.enrollments,
        isActive: course.isActive
      }))
    })

  } catch (error) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
