import { prisma } from './prisma'
import { sendEmail } from './email-service'

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'assignment' | 'grade' | 'payment' | 'announcement' | 'system'
  actionUrl?: string
  metadata?: Record<string, any>
}

export interface EmailNotificationData extends NotificationData {
  emailSubject: string
  emailTemplate?: 'assignment' | 'grade' | 'payment' | 'announcement' | 'system'
  emailData?: Record<string, any>
}

/**
 * Create an in-app notification
 */
export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        content: data.message || '',
        message: data.message,
        type: data.type,
        data: data.metadata ? JSON.stringify(data.metadata) : null,
        isRead: false
      }
    })

    return { success: true, notification }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Create an email notification
 */
export async function createEmailNotification(data: EmailNotificationData) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { email: true, name: true }
    })

    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Create in-app notification
    const notificationResult = await createNotification(data)
    if (!notificationResult.success) {
      return notificationResult
    }

    // Send email
    const emailResult = await sendEmail({
      to: user.email,
      subject: data.emailSubject,
      html: generateEmailTemplate(data.emailTemplate || 'system', {
        userName: user.name || 'User',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        ...data.emailData
      }),
      text: generateEmailTextTemplate(data.emailTemplate || 'system', {
        userName: user.name || 'User',
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        ...data.emailData
      })
    })

    return { 
      success: true, 
      notification: notificationResult.notification,
      emailSent: emailResult.success
    }
  } catch (error) {
    console.error('Error creating email notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Generate email HTML template
 */
function generateEmailTemplate(template: string, data: any): string {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
      .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
      .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border: 1px solid #e1e5e9; border-top: none; }
      .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .alert { padding: 15px; border-radius: 5px; margin: 20px 0; }
      .alert-info { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
      .alert-success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
      .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
      .alert-error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
    </style>
  `

  switch (template) {
    case 'assignment':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>📝 New Assignment</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>You have a new assignment:</p>
            <div class="alert alert-info">
              <h3>${data.title}</h3>
              <p>${data.message}</p>
              ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
              ${data.courseName ? `<p><strong>Course:</strong> ${data.courseName}</p>` : ''}
            </div>
            ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Assignment</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from your school portal.</p>
          </div>
        </div>
      `

    case 'grade':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>📊 Grade Posted</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Your grade has been posted:</p>
            <div class="alert alert-success">
              <h3>${data.title}</h3>
              <p>${data.message}</p>
              ${data.grade ? `<p><strong>Grade:</strong> ${data.grade}</p>` : ''}
              ${data.courseName ? `<p><strong>Course:</strong> ${data.courseName}</p>` : ''}
            </div>
            ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Grade</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from your school portal.</p>
          </div>
        </div>
      `

    case 'payment':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>💳 Payment Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>Payment information:</p>
            <div class="alert alert-info">
              <h3>${data.title}</h3>
              <p>${data.message}</p>
              ${data.amount ? `<p><strong>Amount:</strong> $${data.amount}</p>` : ''}
              ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
            </div>
            ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Payment</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from your school portal.</p>
          </div>
        </div>
      `

    case 'announcement':
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>📢 Important Announcement</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <p>New announcement:</p>
            <div class="alert alert-warning">
              <h3>${data.title}</h3>
              <p>${data.message}</p>
            </div>
            ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">Read More</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from your school portal.</p>
          </div>
        </div>
      `

    default:
      return `
        ${baseStyles}
        <div class="container">
          <div class="header">
            <h1>🔔 Notification</h1>
          </div>
          <div class="content">
            <h2>Hello ${data.userName}!</h2>
            <div class="alert alert-info">
              <h3>${data.title}</h3>
              <p>${data.message}</p>
            </div>
            ${data.actionUrl ? `<a href="${data.actionUrl}" class="button">View Details</a>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from your school portal.</p>
          </div>
        </div>
      `
  }
}

/**
 * Generate email text template
 */
function generateEmailTextTemplate(template: string, data: any): string {
  switch (template) {
    case 'assignment':
      return `
Hello ${data.userName}!

You have a new assignment:

${data.title}
${data.message}

${data.dueDate ? `Due Date: ${data.dueDate}` : ''}
${data.courseName ? `Course: ${data.courseName}` : ''}

${data.actionUrl ? `View Assignment: ${data.actionUrl}` : ''}

This is an automated message from your school portal.
      `

    case 'grade':
      return `
Hello ${data.userName}!

Your grade has been posted:

${data.title}
${data.message}

${data.grade ? `Grade: ${data.grade}` : ''}
${data.courseName ? `Course: ${data.courseName}` : ''}

${data.actionUrl ? `View Grade: ${data.actionUrl}` : ''}

This is an automated message from your school portal.
      `

    case 'payment':
      return `
Hello ${data.userName}!

Payment information:

${data.title}
${data.message}

${data.amount ? `Amount: $${data.amount}` : ''}
${data.dueDate ? `Due Date: ${data.dueDate}` : ''}

${data.actionUrl ? `View Payment: ${data.actionUrl}` : ''}

This is an automated message from your school portal.
      `

    case 'announcement':
      return `
Hello ${data.userName}!

New announcement:

${data.title}
${data.message}

${data.actionUrl ? `Read More: ${data.actionUrl}` : ''}

This is an automated message from your school portal.
      `

    default:
      return `
Hello ${data.userName}!

${data.title}
${data.message}

${data.actionUrl ? `View Details: ${data.actionUrl}` : ''}

This is an automated message from your school portal.
      `
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotification(
  userIds: string[],
  data: Omit<NotificationData, 'userId'>
) {
  const results = await Promise.allSettled(
    userIds.map(userId => createNotification({ ...data, userId }))
  )

  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length

  return {
    success: true,
    total: userIds.length,
    successful,
    failed: userIds.length - successful
  }
}

/**
 * Send email notification to multiple users
 */
export async function sendBulkEmailNotification(
  userIds: string[],
  data: Omit<EmailNotificationData, 'userId'>
) {
  const results = await Promise.allSettled(
    userIds.map(userId => createEmailNotification({ ...data, userId }))
  )

  const successful = results.filter(result => 
    result.status === 'fulfilled' && result.value.success
  ).length

  return {
    success: true,
    total: userIds.length,
    successful,
    failed: userIds.length - successful
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(
  userId: string,
  limit = 50,
  offset = 0,
  unreadOnly = false
) {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        ...(unreadOnly && { isRead: false })
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    })

    const unreadCount = await prisma.notification.count({
      where: {
        userId: userId,
        isRead: false
      }
    })

    return {
      success: true,
      notifications,
      unreadCount
    }
  } catch (error) {
    console.error('Error getting user notifications:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
