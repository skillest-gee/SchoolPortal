import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting course seed...')

  // Get the lecturer user
  const lecturer = await prisma.user.findFirst({
    where: { role: 'LECTURER' }
  })

  if (!lecturer) {
    console.error('❌ Lecturer not found. Please run the main seed first.')
    return
  }

  // Create courses for Computer Science programme
  const csCourses = [
    {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      description: 'Fundamental concepts of computer science and programming',
      credits: 3,
      department: 'Computer Science',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'CS102',
      title: 'Programming Fundamentals',
      description: 'Basic programming concepts using Python',
      credits: 4,
      department: 'Computer Science',
      level: '100',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'CS201',
      title: 'Data Structures and Algorithms',
      description: 'Study of fundamental data structures and algorithm design',
      credits: 4,
      department: 'Computer Science',
      level: '200',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'CS202',
      title: 'Object-Oriented Programming',
      description: 'Advanced OOP concepts using Java',
      credits: 3,
      department: 'Computer Science',
      level: '200',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'CS301',
      title: 'Database Systems',
      description: 'Introduction to database design and SQL',
      credits: 3,
      department: 'Computer Science',
      level: '300',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'CS302',
      title: 'Web Development',
      description: 'Full-stack web development with modern frameworks',
      credits: 4,
      department: 'Computer Science',
      level: '300',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'CS401',
      title: 'Software Engineering',
      description: 'Software development methodologies and practices',
      credits: 3,
      department: 'Computer Science',
      level: '400',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'CS402',
      title: 'Computer Networks',
      description: 'Network protocols and distributed systems',
      credits: 3,
      department: 'Computer Science',
      level: '400',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    }
  ]

  // Create courses for Information Technology programme
  const itCourses = [
    {
      code: 'IT101',
      title: 'Introduction to Information Technology',
      description: 'Overview of IT systems and technologies',
      credits: 3,
      department: 'Information Technology',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'IT102',
      title: 'System Analysis and Design',
      description: 'Methods for analyzing and designing information systems',
      credits: 3,
      department: 'Information Technology',
      level: '100',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'IT201',
      title: 'Network Administration',
      description: 'Network setup, configuration, and management',
      credits: 4,
      department: 'Information Technology',
      level: '200',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'IT202',
      title: 'Database Management',
      description: 'Database administration and optimization',
      credits: 3,
      department: 'Information Technology',
      level: '200',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'IT301',
      title: 'Cybersecurity Fundamentals',
      description: 'Introduction to information security and cyber threats',
      credits: 3,
      department: 'Information Technology',
      level: '300',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'IT302',
      title: 'Cloud Computing',
      description: 'Cloud platforms and services',
      credits: 3,
      department: 'Information Technology',
      level: '300',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'IT401',
      title: 'IT Project Management',
      description: 'Managing IT projects and teams',
      credits: 3,
      department: 'Information Technology',
      level: '400',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'IT402',
      title: 'Enterprise Systems',
      description: 'Large-scale enterprise applications and integration',
      credits: 3,
      department: 'Information Technology',
      level: '400',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    }
  ]

  // Create courses for Engineering programme
  const engCourses = [
    {
      code: 'ENG101',
      title: 'Engineering Mathematics',
      description: 'Mathematical foundations for engineering',
      credits: 4,
      department: 'Engineering',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'ENG102',
      title: 'Engineering Physics',
      description: 'Physics principles in engineering applications',
      credits: 3,
      department: 'Engineering',
      level: '100',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'ENG201',
      title: 'Engineering Design',
      description: 'Design principles and methodologies',
      credits: 3,
      department: 'Engineering',
      level: '200',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'ENG202',
      title: 'Materials Science',
      description: 'Properties and behavior of engineering materials',
      credits: 3,
      department: 'Engineering',
      level: '200',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'ENG301',
      title: 'Thermodynamics',
      description: 'Energy and heat transfer in engineering systems',
      credits: 3,
      department: 'Engineering',
      level: '300',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'ENG302',
      title: 'Fluid Mechanics',
      description: 'Behavior of fluids in engineering applications',
      credits: 3,
      department: 'Engineering',
      level: '300',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'ENG401',
      title: 'Engineering Ethics',
      description: 'Professional ethics and responsibility in engineering',
      credits: 2,
      department: 'Engineering',
      level: '400',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'ENG402',
      title: 'Project Management',
      description: 'Engineering project planning and execution',
      credits: 3,
      department: 'Engineering',
      level: '400',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    }
  ]

  // Create courses for Business Administration programme
  const busCourses = [
    {
      code: 'BUS101',
      title: 'Introduction to Business',
      description: 'Fundamental concepts of business and commerce',
      credits: 3,
      department: 'Business Administration',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'BUS102',
      title: 'Business Mathematics',
      description: 'Mathematical applications in business',
      credits: 3,
      department: 'Business Administration',
      level: '100',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'BUS201',
      title: 'Principles of Management',
      description: 'Management theories and practices',
      credits: 3,
      department: 'Business Administration',
      level: '200',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'BUS202',
      title: 'Marketing Principles',
      description: 'Fundamentals of marketing and consumer behavior',
      credits: 3,
      department: 'Business Administration',
      level: '200',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'BUS301',
      title: 'Financial Management',
      description: 'Corporate finance and investment analysis',
      credits: 3,
      department: 'Business Administration',
      level: '300',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'BUS302',
      title: 'Operations Management',
      description: 'Production and operations management',
      credits: 3,
      department: 'Business Administration',
      level: '300',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'BUS401',
      title: 'Strategic Management',
      description: 'Strategic planning and competitive analysis',
      credits: 3,
      department: 'Business Administration',
      level: '400',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'BUS402',
      title: 'Business Ethics',
      description: 'Ethical considerations in business decisions',
      credits: 2,
      department: 'Business Administration',
      level: '400',
      semester: 'Second Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    }
  ]

  // Combine all courses
  const allCourses = [...csCourses, ...itCourses, ...engCourses, ...busCourses]

  console.log('📚 Creating courses...')
  for (const courseData of allCourses) {
    await prisma.course.upsert({
      where: { code: courseData.code },
      update: {},
      create: courseData
    })
  }

  console.log(`✅ Created ${allCourses.length} courses successfully!`)
  console.log('📋 Courses available for registration:')
  console.log('   - Computer Science: 8 courses')
  console.log('   - Information Technology: 8 courses')
  console.log('   - Engineering: 8 courses')
  console.log('   - Business Administration: 8 courses')
}

main()
  .catch((e) => {
    console.error('❌ Course seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
