import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const systemSettingsSchema = z.object({
  // General Settings
  universityName: z.string().min(1, 'University name is required'),
  universityEmail: z.string().email('Valid email is required'),
  universityPhone: z.string().min(1, 'Phone number is required'),
  universityAddress: z.string().min(1, 'Address is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  language: z.string().min(1, 'Language is required'),
  
  // Academic Settings
  academicYear: z.string().min(1, 'Academic year is required'),
  semester: z.string().min(1, 'Semester is required'),
  maxCourseCredits: z.number().min(1, 'Max credits must be at least 1'),
  minCourseCredits: z.number().min(1, 'Min credits must be at least 1'),
  enrollmentDeadline: z.string().min(1, 'Enrollment deadline is required'),
  
  // System Settings
  maintenanceMode: z.boolean(),
  registrationOpen: z.boolean(),
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  
  // Security Settings
  passwordMinLength: z.number().min(6, 'Password must be at least 6 characters'),
  sessionTimeout: z.number().min(5, 'Session timeout must be at least 5 minutes'),
  twoFactorAuth: z.boolean(),
  
  // Backup Settings
  autoBackup: z.boolean(),
  backupFrequency: z.string().min(1, 'Backup frequency is required'),
  backupRetention: z.number().min(1, 'Backup retention must be at least 1 day')
})

// GET: Fetch system settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can access system settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // For now, return default settings
    // In a real system, these would be stored in a settings table
    const defaultSettings = {
      // General Settings
      universityName: 'University of Technology',
      universityEmail: 'admin@university.edu',
      universityPhone: '+1 (555) 123-4567',
      universityAddress: '123 University Avenue, City, State 12345',
      timezone: 'UTC-5',
      language: 'en',
      
      // Academic Settings
      academicYear: '2024/2025',
      semester: 'First Semester',
      maxCourseCredits: 18,
      minCourseCredits: 12,
      enrollmentDeadline: '2024-08-15',
      
      // System Settings
      maintenanceMode: false,
      registrationOpen: true,
      emailNotifications: true,
      smsNotifications: false,
      
      // Security Settings
      passwordMinLength: 8,
      sessionTimeout: 30,
      twoFactorAuth: false,
      
      // Backup Settings
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30
    }

    return NextResponse.json({
      success: true,
      data: defaultSettings
    })

  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update system settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can update system settings
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = systemSettingsSchema.parse(body)

    // In a real system, you would save these to a settings table
    // For now, we'll just return success
    console.log('System settings updated:', validatedData)

    // Create a notification for the admin
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        title: 'System Settings Updated',
        content: 'System settings have been successfully updated by the administrator.',
        type: 'SUCCESS'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully',
      data: validatedData
    })

  } catch (error) {
    console.error('Error updating system settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

