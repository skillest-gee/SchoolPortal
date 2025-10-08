const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSampleData() {
  try {
    console.log('Adding sample data...');
    
    // Get student users
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { studentProfile: true }
    });
    
    console.log('Found students:', students.length);
    
    if (students.length >= 2) {
      // Add some sample messages between students
      const student1 = students[0];
      const student2 = students[1];
      
      const messages = [
        {
          senderId: student1.id,
          recipientId: student2.id,
          content: "Hey! How are you doing with the assignments?",
          isRead: false,
          type: 'TEXT'
        },
        {
          senderId: student2.id,
          recipientId: student1.id,
          content: "Hi! I'm doing well, thanks. Just finished the math assignment. How about you?",
          isRead: false,
          type: 'TEXT'
        },
        {
          senderId: student1.id,
          recipientId: student2.id,
          content: "Great! I'm working on the programming project. It's quite challenging.",
          isRead: true,
          type: 'TEXT'
        }
      ];
      
      for (const message of messages) {
        await prisma.message.create({ data: message });
      }
      
      console.log('Added sample messages');
    }
    
    // Add some sample notifications
    const notifications = [
      {
        userId: students[0].id,
        title: "Welcome to the Portal",
        content: "Welcome to the university portal! Please complete your course registration.",
        type: 'INFO',
        isRead: false
      },
      {
        userId: students[0].id,
        title: "New Assignment Posted",
        content: "A new assignment has been posted for your course. Check the assignments page.",
        type: 'WARNING',
        isRead: false
      }
    ];
    
    for (const notification of notifications) {
      await prisma.notification.create({ data: notification });
    }
    
    console.log('Added sample notifications');
    console.log('Sample data added successfully!');
    
  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSampleData();
