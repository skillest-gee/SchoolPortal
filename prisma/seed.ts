import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

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

  // Create student user
  const studentPassword = await bcrypt.hash('student123', 12)
  const student = await prisma.user.upsert({
    where: { email: 'student@school.edu' },
    update: {},
    create: {
      email: 'student@school.edu',
      name: 'Clement Onibiyo Arthur',
      passwordHash: studentPassword,
      role: 'STUDENT',
      indexNumber: 'CS/ITC/21/0001', // Sample index number
      isActive: true,
    },
  })

  // Create comprehensive student profile
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      studentId: 'STU2024001',
      
      // Personal Information (set by admin)
      title: 'MR.',
      firstName: 'CLEMENT',
      middleName: 'ONIBIYO',
      surname: 'ARTHUR',
      gender: 'M',
      dateOfBirth: new Date('2004-01-23'),
      
      // Academic Information (set by admin)
      programme: 'BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)',
      currentMajor: 'INFORMATION TECHNOLOGY',
      level: '400',
      hall: 'VALCO HALL',
      gpa: 0.0, // New students start with 0.00 GPA
      yearOfStudy: '4th Year',
      
      // Contact Information (editable by student)
      institutionalEmail: 'student@school.edu',
      roomNo: 'Room 205',
      personalEmail: 'clement.arthur@gmail.com',
      campusAddress: 'KWAPROW',
      gpsAddress: 'CC-114-5709',
      cellphone: '0249780093',
      homePhone: '055507769',
      
      // Address Information (editable by student)
      homeAddress: 'EN 78 EYIFUA ESTATE CAPE COAST',
      postalAddress: 'JULIANA AGGREY GRA P.O.BOX CT958 CAPE COAST',
      postalTown: 'CAPE COAST',
      placeOfBirth: 'EKUMFI ASAAFA',
      hometown: 'EKUMFI ASAAFA',
      
      // Legacy fields
      address: 'EN 78 EYIFUA ESTATE CAPE COAST',
      phone: '0249780093',
      program: 'INFORMATION TECHNOLOGY',
    },
  })

  // Create courses
  const course1 = await prisma.course.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      code: 'CS101',
      title: 'Introduction to Programming',
      description: 'Basic programming concepts and problem solving',
      credits: 3,
      department: 'Computer Science',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id,
      isActive: true,
    },
  })

  const course2 = await prisma.course.upsert({
    where: { code: 'CS201' },
    update: {},
    create: {
      code: 'CS201',
      title: 'Data Structures and Algorithms',
      description: 'Advanced programming concepts and algorithm design',
      credits: 4,
      department: 'Computer Science',
      level: '200',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id,
      isActive: true,
    },
  })

  // Create more courses for students to choose from
  const course3 = await prisma.course.upsert({
    where: { code: 'CS301' },
    update: {},
    create: {
      code: 'CS301',
      title: 'Database Systems',
      description: 'Introduction to database design and management',
      credits: 3,
      department: 'Computer Science',
      level: '300',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id,
      isActive: true,
    },
  })

  const course4 = await prisma.course.upsert({
    where: { code: 'CS401' },
    update: {},
    create: {
      code: 'CS401',
      title: 'Software Engineering',
      description: 'Software development methodologies and practices',
      credits: 4,
      department: 'Computer Science',
      level: '400',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id,
      isActive: true,
    },
  })

  const course5 = await prisma.course.upsert({
    where: { code: 'MATH101' },
    update: {},
    create: {
      code: 'MATH101',
      title: 'Calculus I',
      description: 'Introduction to differential and integral calculus',
      credits: 4,
      department: 'Mathematics',
      level: '100',
      semester: 'First Semester',
      academicYear: '2024/2025',
      lecturerId: lecturer.id,
      isActive: true,
    },
  })

  // Note: Student is NOT enrolled in any courses initially
  // They must register for courses through the course registration system

  // Note: No assignments created initially
  // Assignments will be created by lecturers for their courses

  // Create some books
  await prisma.book.upsert({
    where: { isbn: '978-0134685991' },
    update: {},
    create: {
      title: 'Effective Java',
      author: 'Joshua Bloch',
      isbn: '978-0134685991',
      publisher: 'Addison-Wesley',
      publicationYear: 2017,
      category: 'Computer Science',
      description: 'A comprehensive guide to Java programming best practices',
      totalCopies: 5,
      availableCopies: 5,
      location: 'Library Section A',
    },
  })

  await prisma.book.upsert({
    where: { isbn: '978-0132350884' },
    update: {},
    create: {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      publisher: 'Prentice Hall',
      publicationYear: 2008,
      category: 'Computer Science',
      description: 'A handbook of agile software craftsmanship',
      totalCopies: 3,
      availableCopies: 3,
      location: 'Library Section A',
    },
  })

  // Create an announcement
  await prisma.announcement.upsert({
    where: { id: 'announcement1' },
    update: {},
    create: {
      id: 'announcement1',
      title: 'Welcome to the New Academic Year',
      content: 'We are excited to welcome all students to the new academic year. Please check your course schedules and assignments regularly.',
      authorId: admin.id,
      targetAudience: 'ALL',
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log('👤 Admin: admin@school.edu / admin123')
  console.log('👨‍🏫 Lecturer: lecturer@school.edu / lecturer123')
  console.log('👨‍🎓 Student: student@school.edu / student123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })