import { createEmailNotification, sendBulkEmailNotification } from './notifications'

/**
 * Handle assignment creation event
 */
export async function handleAssignmentCreated(assignment: any) {
  try {
    // Get all students enrolled in the course
    const enrollments = await prisma.enrollment.findMany({
      where: {
        courseId: assignment.courseId,
        status: 'ACTIVE'
      },
      include: {
        student: true
      }
    })

    const studentIds = enrollments.map(enrollment => enrollment.student.id)

    if (studentIds.length === 0) return { success: true, message: 'No students to notify' }

    // Send notifications to all enrolled students
    const result = await sendBulkEmailNotification(studentIds, {
      title: `New Assignment: ${assignment.title}`,
      message: `A new assignment has been posted for ${assignment.course?.title || 'your course'}. Due: ${new Date(assignment.dueDate).toLocaleDateString()}`,
      type: 'info',
      category: 'assignment',
      actionUrl: `/student/assignments/${assignment.id}`,
      emailSubject: `New Assignment: ${assignment.title}`,
      emailTemplate: 'assignment',
      emailData: {
        courseName: assignment.course?.title,
        dueDate: new Date(assignment.dueDate).toLocaleDateString(),
        maxPoints: assignment.maxPoints
      }
    })

    return { ...result, success: true }
  } catch (error) {
    console.error('Error handling assignment created event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle grade posted event
 */
export async function handleGradePosted(submission: any) {
  try {
    const result = await createEmailNotification({
      userId: submission.studentId,
      title: `Grade Posted: ${submission.assignment?.title}`,
      message: `Your grade has been posted for ${submission.assignment?.title}. Grade: ${submission.mark}/${submission.assignment?.maxPoints}`,
      type: 'success',
      category: 'grade',
      actionUrl: `/student/assignments/${submission.assignmentId}`,
      emailSubject: `Grade Posted: ${submission.assignment?.title}`,
      emailTemplate: 'grade',
      emailData: {
        courseName: submission.assignment?.course?.title,
        grade: `${submission.mark}/${submission.assignment?.maxPoints}`,
        feedback: submission.feedback
      }
    })

    return result
  } catch (error) {
    console.error('Error handling grade posted event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle payment received event
 */
export async function handlePaymentReceived(payment: any) {
  try {
    const result = await createEmailNotification({
      userId: payment.studentId,
      title: `Payment Received: $${payment.amount}`,
      message: `Your payment of $${payment.amount} has been received and processed successfully.`,
      type: 'success',
      category: 'payment',
      actionUrl: `/student/finances`,
      emailSubject: `Payment Confirmation: $${payment.amount}`,
      emailTemplate: 'payment',
      emailData: {
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        reference: payment.reference
      }
    })

    return result
  } catch (error) {
    console.error('Error handling payment received event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle fee due event
 */
export async function handleFeeDue(fee: any) {
  try {
    const result = await createEmailNotification({
      userId: fee.studentId,
      title: `Fee Due: $${fee.amount}`,
      message: `Your ${fee.description} of $${fee.amount} is due on ${new Date(fee.dueDate).toLocaleDateString()}. Please make payment to avoid late fees.`,
      type: 'warning',
      category: 'payment',
      actionUrl: `/student/finances`,
      emailSubject: `Fee Due: $${fee.amount}`,
      emailTemplate: 'payment',
      emailData: {
        amount: fee.amount,
        dueDate: new Date(fee.dueDate).toLocaleDateString(),
        description: fee.description
      }
    })

    return result
  } catch (error) {
    console.error('Error handling fee due event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle announcement created event
 */
export async function handleAnnouncementCreated(announcement: any) {
  try {
    let userIds: string[] = []

    if (announcement.targetAudience === 'ALL') {
      // Get all active users
      const users = await prisma.user.findMany({
        where: {
          role: { in: ['STUDENT', 'LECTURER', 'ADMIN'] }
        },
        select: { id: true }
      })
      userIds = users.map(user => user.id)
    } else if (announcement.targetAudience === 'STUDENT') {
      // Get all students
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true }
      })
      userIds = students.map(student => student.id)
    } else if (announcement.targetAudience === 'LECTURER') {
      // Get all lecturers
      const lecturers = await prisma.user.findMany({
        where: { role: 'LECTURER' },
        select: { id: true }
      })
      userIds = lecturers.map(lecturer => lecturer.id)
    }

    if (userIds.length === 0) return { success: true, message: 'No users to notify' }

    // Send notifications to all target users
    const result = await sendBulkEmailNotification(userIds, {
      title: `New Announcement: ${announcement.title}`,
      message: announcement.content,
      type: 'info',
      category: 'announcement',
      actionUrl: '/announcements',
      emailSubject: `New Announcement: ${announcement.title}`,
      emailTemplate: 'announcement'
    })

    return { ...result, success: true }
  } catch (error) {
    console.error('Error handling announcement created event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle course enrollment event
 */
export async function handleCourseEnrolled(enrollment: any) {
  try {
    const result = await createEmailNotification({
      userId: enrollment.studentId,
      title: `Course Enrolled: ${enrollment.course?.title}`,
      message: `You have successfully enrolled in ${enrollment.course?.title} (${enrollment.course?.code}). Classes begin soon!`,
      type: 'success',
      category: 'system',
      actionUrl: `/student/courses`,
      emailSubject: `Course Enrolled: ${enrollment.course?.title}`,
      emailTemplate: 'system',
      emailData: {
        courseName: enrollment.course?.title,
        courseCode: enrollment.course?.code,
        credits: enrollment.course?.credits
      }
    })

    return result
  } catch (error) {
    console.error('Error handling course enrolled event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle application status change event
 */
export async function handleApplicationStatusChange(application: any) {
  try {
    const result = await createEmailNotification({
      userId: application.userId,
      title: `Application ${application.status}: ${application.programme?.name}`,
      message: `Your application for ${application.programme?.name} has been ${application.status.toLowerCase()}. ${application.status === 'APPROVED' ? 'Congratulations! You will receive further instructions via email.' : 'Please contact the admissions office for more information.'}`,
      type: application.status === 'APPROVED' ? 'success' : 'warning',
      category: 'system',
      actionUrl: application.status === 'APPROVED' ? '/student/dashboard' : '/auth/apply',
      emailSubject: `Application ${application.status}: ${application.programme?.name}`,
      emailTemplate: 'system',
      emailData: {
        programmeName: application.programme?.name,
        status: application.status
      }
    })

    return result
  } catch (error) {
    console.error('Error handling application status change event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle overdue assignment event
 */
export async function handleOverdueAssignment(assignment: any, studentId: string) {
  try {
    const result = await createEmailNotification({
      userId: studentId,
      title: `Assignment Overdue: ${assignment.title}`,
      message: `Your assignment "${assignment.title}" was due on ${new Date(assignment.dueDate).toLocaleDateString()} and is now overdue. Please submit as soon as possible.`,
      type: 'error',
      category: 'assignment',
      actionUrl: `/student/assignments/${assignment.id}`,
      emailSubject: `Assignment Overdue: ${assignment.title}`,
      emailTemplate: 'assignment',
      emailData: {
        courseName: assignment.course?.title,
        dueDate: new Date(assignment.dueDate).toLocaleDateString(),
        maxPoints: assignment.maxPoints
      }
    })

    return result
  } catch (error) {
    console.error('Error handling overdue assignment event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Handle system maintenance event
 */
export async function handleSystemMaintenance(maintenance: any) {
  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['STUDENT', 'LECTURER', 'ADMIN'] }
      },
      select: { id: true }
    })

    const userIds = users.map(user => user.id)

    if (userIds.length === 0) return { success: true, message: 'No users to notify' }

    // Send notifications to all users
    const result = await sendBulkEmailNotification(userIds, {
      title: `System Maintenance: ${maintenance.title}`,
      message: maintenance.message,
      type: 'warning',
      category: 'system',
      actionUrl: '/announcements',
      emailSubject: `System Maintenance: ${maintenance.title}`,
      emailTemplate: 'system',
      emailData: {
        startTime: maintenance.startTime,
        endTime: maintenance.endTime,
        affectedServices: maintenance.affectedServices
      }
    })

    return { ...result, success: true }
  } catch (error) {
    console.error('Error handling system maintenance event:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Import prisma
import { prisma } from './prisma'
