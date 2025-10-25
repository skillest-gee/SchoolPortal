import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email-service'

// GET: Comprehensive health check
export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: {},
        email: {},
        storage: {},
        fileUpload: {},
        statistics: {},
        environment: {}
      }
    }

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`
      health.services.database = {
        status: 'healthy',
        message: 'Database connection successful'
      }
    } catch (error) {
      health.services.database = {
        status: 'unhealthy',
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      health.status = 'degraded'
    }

    // Test email service
    try {
      const testEmail = {
        to: 'test@example.com',
        subject: 'Health Check Test',
        html: '<p>This is a test email</p>',
        text: 'This is a test email'
      }
      
      // We'll just test the email service setup without actually sending
      if (process.env.RESEND_API_KEY || process.env.EMAIL_SERVER_PASSWORD) {
        health.services.email = {
          status: 'healthy',
          message: 'Email service configured (Resend)'
        }
      } else {
        health.services.email = {
          status: 'unhealthy',
          message: 'Email service not configured'
        }
        health.status = 'degraded'
      }
    } catch (error) {
      health.services.email = {
        status: 'unhealthy',
        message: `Email service error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      health.status = 'degraded'
    }

    // Test file upload directory
    try {
      const fs = await import('fs')
      const path = await import('path')
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      
      if (fs.existsSync(uploadDir)) {
        health.services.fileUpload = {
          status: 'healthy',
          message: 'Upload directory exists'
        }
      } else {
        health.services.fileUpload = {
          status: 'warning',
          message: 'Upload directory does not exist (will be created on first upload)'
        }
      }
    } catch (error) {
      health.services.fileUpload = {
        status: 'unhealthy',
        message: `File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
      health.status = 'degraded'
    }

    // Get system statistics
    try {
      const [userCount, courseCount, applicationCount] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.application.count()
      ])

      health.services.statistics = {
        status: 'healthy',
        message: 'System statistics retrieved',
        data: {
          totalUsers: userCount,
          totalCourses: courseCount,
          totalApplications: applicationCount
        }
      }
    } catch (error) {
      health.services.statistics = {
        status: 'unhealthy',
        message: `Statistics error: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }

    // Environment check
    health.services.environment = {
      status: 'healthy',
      message: 'Environment variables checked',
      data: {
        nodeEnv: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
        nextAuthUrl: process.env.NEXTAUTH_URL ? 'configured' : 'missing',
        nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
        emailService: process.env.RESEND_API_KEY ? 'Resend configured' : 'not configured',
        maxFileSize: process.env.MAX_FILE_SIZE || '10MB (default)'
      }
    }

    const statusCode = health.status === 'healthy' ? 200 : 503

    return NextResponse.json(health, { status: statusCode })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST: Test email sending
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, message } = body

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    const testEmail = {
      to,
      subject,
      html: `<p>${message}</p>`,
      text: message
    }

    const result = await sendEmail(testEmail)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
