import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed for new students...')

  // Create programmes
  console.log('📚 Creating programmes...')
  const programmes = [
    {
      code: 'CS',
      name: 'Computer Science',
      department: 'ITC',
      description: 'Bachelor of Science in Computer Science',
      minGrade: 3.0
    },
    {
      code: 'IT',
      name: 'Information Technology',
      department: 'ITC',
      description: 'Bachelor of Science in Information Technology',
      minGrade: 2.8
    },
    {
      code: 'ENG',
      name: 'Engineering',
      department: 'ENG',
      description: 'Bachelor of Engineering',
      minGrade: 3.2
    },
    {
      code: 'BUS',
      name: 'Business Administration',
      department: 'BUS',
      description: 'Bachelor of Business Administration',
      minGrade: 2.5
    }
  ]

  for (const programmeData of programmes) {
    await prisma.programme.upsert({
      where: { code: programmeData.code },
      update: {},
      create: programmeData
    })
  }

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: {
      email: 'admin@school.edu',
      name: 'System Administrator',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  })

  // Create lecturer user
  const lecturerPassword = await bcrypt.hash('lecturer123', 12)
  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@school.edu' },
    update: {},
    create: {
      email: 'lecturer@school.edu',
      name: 'Dr. John Smith',
      passwordHash: lecturerPassword,
      role: 'LECTURER',
      isActive: true,
    },
  })

  // Create lecturer profile
  await prisma.lecturerProfile.upsert({
    where: { userId: lecturer.id },
    update: {},
    create: {
      userId: lecturer.id,
      staffId: 'LEC001',
      department: 'Computer Science',
      office: 'Room 101',
    },
  })

  // Create multiple NEW students (no previous data)
  console.log('👨‍🎓 Creating new students...')
  const students = [
    {
      email: 'student@school.edu',
      name: 'John Student',
      indexNumber: 'CS/ITC/21/0001',
      studentId: 'STU2024001',
      firstName: 'JOHN',
      middleName: 'MICHAEL',
      surname: 'STUDENT',
      programme: 'BACHELOR OF SCIENCE (COMPUTER SCIENCE)',
      currentMajor: 'COMPUTER SCIENCE',
      gender: 'M'
    },
    {
      email: 'alice.smith@school.edu',
      name: 'Alice Smith',
      indexNumber: 'IT/ITC/21/0002',
      studentId: 'STU2024002',
      firstName: 'ALICE',
      middleName: 'JANE',
      surname: 'SMITH',
      programme: 'BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)',
      currentMajor: 'INFORMATION TECHNOLOGY',
      gender: 'F'
    },
    {
      email: 'bob.johnson@school.edu',
      name: 'Bob Johnson',
      indexNumber: 'ENG/ENG/21/0003',
      studentId: 'STU2024003',
      firstName: 'BOB',
      middleName: 'DAVID',
      surname: 'JOHNSON',
      programme: 'BACHELOR OF ENGINEERING',
      currentMajor: 'ENGINEERING',
      gender: 'M'
    },
    {
      email: 'carol.williams@school.edu',
      name: 'Carol Williams',
      indexNumber: 'BUS/BUS/21/0004',
      studentId: 'STU2024004',
      firstName: 'CAROL',
      middleName: 'ELIZABETH',
      surname: 'WILLIAMS',
      programme: 'BACHELOR OF BUSINESS ADMINISTRATION',
      currentMajor: 'BUSINESS ADMINISTRATION',
      gender: 'F'
    },
    {
      email: 'david.brown@school.edu',
      name: 'David Brown',
      indexNumber: 'CS/ITC/21/0005',
      studentId: 'STU2024005',
      firstName: 'DAVID',
      middleName: 'ROBERT',
      surname: 'BROWN',
      programme: 'BACHELOR OF SCIENCE (COMPUTER SCIENCE)',
      currentMajor: 'COMPUTER SCIENCE',
      gender: 'M'
    }
  ]

  for (const studentData of students) {
    const student = await prisma.user.upsert({
      where: { email: studentData.email },
      update: {},
      create: {
        email: studentData.email,
        name: studentData.name,
        passwordHash: await bcrypt.hash('student123', 12),
        role: 'STUDENT',
        indexNumber: studentData.indexNumber,
        isActive: true,
      },
    })

    // Create student profile - NEW STUDENTS with NO previous data
    await prisma.studentProfile.upsert({
      where: { userId: student.id },
      update: {},
      create: {
        userId: student.id,
        studentId: studentData.studentId,
        
        // Personal Information (set by admin)
        title: 'MR.',
        firstName: studentData.firstName,
        middleName: studentData.middleName,
        surname: studentData.surname,
        gender: studentData.gender,
        dateOfBirth: new Date('2000-05-15'),
        
        // Academic Information (set by admin) - NEW STUDENT
        programme: studentData.programme,
        currentMajor: studentData.currentMajor,
        level: '100', // NEW STUDENTS start at level 100
        hall: 'UNIVERSITY HALL',
        gpa: 0.0, // NEW STUDENTS start with 0.00 GPA
        yearOfStudy: '1st Year', // NEW STUDENTS start in 1st year
        
        // Contact Information (editable by student)
        institutionalEmail: studentData.email,
        roomNo: 'A101',
        personalEmail: `${studentData.firstName.toLowerCase()}.${studentData.surname.toLowerCase()}@gmail.com`,
        campusAddress: 'University Hall, Room A101',
        gpsAddress: 'GPS-123456',
        cellphone: '+233241234567',
        homePhone: '+233241234567',
        
        // Address Information (editable by student)
        homeAddress: '123 Main Street, Accra',
        postalAddress: 'P.O. Box 123, Accra',
        postalTown: 'Accra',
        placeOfBirth: 'Accra',
        hometown: 'Accra',
        
        // Legacy fields
        address: '123 Main Street, Accra',
        phone: '+233241234567',
        program: studentData.currentMajor,
      },
    })
  }

  // Create some sample courses (but students are NOT enrolled yet)
  console.log('📖 Creating sample courses...')
  const courses = [
    {
      code: 'CS101',
      title: 'Introduction to Computer Science',
      description: 'Basic concepts of computer science',
      credits: 3,
      department: 'Computer Science',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'IT101',
      title: 'Introduction to Information Technology',
      description: 'Fundamentals of IT',
      credits: 3,
      department: 'Information Technology',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    },
    {
      code: 'MATH101',
      title: 'Calculus I',
      description: 'Differential and integral calculus',
      credits: 4,
      department: 'Mathematics',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id
    }
  ]

  for (const courseData of courses) {
    await prisma.course.upsert({
      where: { code: courseData.code },
      update: {},
      create: courseData
    })
  }

  // Create some sample announcements
  console.log('📢 Creating announcements...')
  const announcements = [
    {
      title: 'Welcome New Students!',
      content: 'Welcome to our university! Please complete your registration and attend the orientation session.',
      authorId: admin.id,
      targetAudience: 'STUDENT'
    },
    {
      title: 'Course Registration Opens',
      content: 'Course registration for the new semester is now open. Please register for your courses.',
      authorId: admin.id,
      targetAudience: 'STUDENT'
    }
  ]

  for (const announcementData of announcements) {
    await prisma.announcement.create({
      data: announcementData
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log('👤 Admin: admin@school.edu / admin123')
  console.log('👨‍🏫 Lecturer: lecturer@school.edu / lecturer123')
  console.log('👨‍🎓 Students (all use password: student123):')
  console.log('   - John Student: CS/ITC/21/0001')
  console.log('   - Alice Smith: IT/ITC/21/0002')
  console.log('   - Bob Johnson: ENG/ENG/21/0003')
  console.log('   - Carol Williams: BUS/BUS/21/0004')
  console.log('   - David Brown: CS/ITC/21/0005')
  console.log('')
  console.log('📝 Note: All students are NEW with no previous data:')
  console.log('   - No enrolled courses')
  console.log('   - No grades')
  console.log('   - No assignments')
  console.log('   - GPA starts at 0.00')
  console.log('   - Year of study: 1st Year')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
