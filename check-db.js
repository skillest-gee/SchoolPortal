const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== DATABASE STATUS ===');
    
    // Check users
    const users = await prisma.user.findMany({
      include: { studentProfile: true }
    });
    console.log('Users:', users.length);
    users.forEach(u => console.log('-', u.name, u.role, u.indexNumber));
    
    // Check announcements
    const announcements = await prisma.announcement.findMany();
    console.log('Announcements:', announcements.length);
    
    // Check courses
    const courses = await prisma.course.findMany();
    console.log('Courses:', courses.length);
    
    // Check messages
    const messages = await prisma.message.findMany();
    console.log('Messages:', messages.length);
    
    // Check enrollments
    const enrollments = await prisma.enrollment.findMany();
    console.log('Enrollments:', enrollments.length);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
