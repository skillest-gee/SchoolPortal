import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Helper function to categorize settings
function getCategoryForKey(key: string): string {
  if (key.includes('university') || key.includes('timezone') || key.includes('language')) {
    return 'GENERAL'
  } else if (key.includes('academic') || key.includes('semester') || key.includes('credits') || key.includes('enrollment')) {
    return 'ACADEMIC'
  } else if (key.includes('maintenance') || key.includes('registration') || key.includes('notifications')) {
    return 'SYSTEM'
  } else if (key.includes('password') || key.includes('session') || key.includes('auth')) {
    return 'SECURITY'
  } else if (key.includes('backup')) {
    return 'BACKUP'
  }
  return 'GENERAL'
}

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

const partialSystemSettingsSchema = systemSettingsSchema
  .partial()
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    { message: 'At least one setting must be provided' }
  )

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

    // Get settings from database
    const settings = await prisma.systemSettings.findMany({
      where: { isActive: true }
    })

    // Convert to object format
    const settingsObject = settings.reduce((acc, setting) => {
      // Parse value based on expected type
      let value: any = setting.value
      if (setting.key.includes('Credits') || setting.key.includes('Length') || setting.key.includes('Timeout') || setting.key.includes('Retention')) {
        value = parseInt(setting.value)
      } else if (setting.key.includes('Mode') || setting.key.includes('Open') || setting.key.includes('Notifications') || setting.key.includes('Auth') || setting.key.includes('Backup')) {
        value = setting.value === 'true'
      }
      
      acc[setting.key] = value
      return acc
    }, {} as any)

    // If no settings exist, create default settings
    if (Object.keys(settingsObject).length === 0) {
      const defaultSettings = [
        { key: 'universityName', value: 'University of Technology', category: 'GENERAL' },
        { key: 'universityEmail', value: 'admin@university.edu', category: 'GENERAL' },
        { key: 'universityPhone', value: '+1 (555) 123-4567', category: 'GENERAL' },
        { key: 'universityAddress', value: '123 University Avenue, City, State 12345', category: 'GENERAL' },
        { key: 'timezone', value: 'UTC-5', category: 'GENERAL' },
        { key: 'language', value: 'en', category: 'GENERAL' },
        { key: 'academicYear', value: '2024/2025', category: 'ACADEMIC' },
        { key: 'semester', value: 'First Semester', category: 'ACADEMIC' },
        { key: 'maxCourseCredits', value: '18', category: 'ACADEMIC' },
        { key: 'minCourseCredits', value: '12', category: 'ACADEMIC' },
        { key: 'enrollmentDeadline', value: '2024-08-15', category: 'ACADEMIC' },
        { key: 'maintenanceMode', value: 'false', category: 'SYSTEM' },
        { key: 'registrationOpen', value: 'true', category: 'SYSTEM' },
        { key: 'emailNotifications', value: 'true', category: 'SYSTEM' },
        { key: 'smsNotifications', value: 'false', category: 'SYSTEM' },
        { key: 'passwordMinLength', value: '8', category: 'SECURITY' },
        { key: 'sessionTimeout', value: '30', category: 'SECURITY' },
        { key: 'twoFactorAuth', value: 'false', category: 'SECURITY' },
        { key: 'autoBackup', value: 'true', category: 'BACKUP' },
        { key: 'backupFrequency', value: 'daily', category: 'BACKUP' },
        { key: 'backupRetention', value: '30', category: 'BACKUP' }
      ]

      await prisma.systemSettings.createMany({
        data: defaultSettings.map(setting => ({
          key: setting.key,
          value: setting.value,
          category: setting.category,
          description: `Default ${setting.key} setting`
        }))
      })

      // Return default settings
      const defaultSettingsObject = {
        universityName: 'University of Technology',
        universityEmail: 'admin@university.edu',
        universityPhone: '+1 (555) 123-4567',
        universityAddress: '123 University Avenue, City, State 12345',
        timezone: 'UTC-5',
        language: 'en',
        academicYear: '2024/2025',
        semester: 'First Semester',
        maxCourseCredits: 18,
        minCourseCredits: 12,
        enrollmentDeadline: '2024-08-15',
        maintenanceMode: false,
        registrationOpen: true,
        emailNotifications: true,
        smsNotifications: false,
        passwordMinLength: 8,
        sessionTimeout: 30,
        twoFactorAuth: false,
        autoBackup: true,
        backupFrequency: 'daily',
        backupRetention: 30
      }

      return NextResponse.json({
        success: true,
        data: defaultSettingsObject
      })
    }

    return NextResponse.json({
      success: true,
      data: settingsObject
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
    const validatedData = partialSystemSettingsSchema.parse(body)
    const settingsEntries = Object.entries(validatedData).filter(
      ([, value]) => value !== undefined
    )

    if (settingsEntries.length === 0) {
      return NextResponse.json(
        { error: 'No settings provided to update' },
        { status: 400 }
      )
    }

    // Update settings in database
    const settingsToUpdate = settingsEntries.map(([key, value]) => ({
      key,
      value: String(value),
      category: getCategoryForKey(key)
    }))

    // Use upsert to update existing settings or create new ones
    await Promise.all(
      settingsToUpdate.map(setting =>
        prisma.systemSettings.upsert({
          where: { key: setting.key },
          update: { 
            value: setting.value,
            updatedAt: new Date()
          },
          create: {
            key: setting.key,
            value: setting.value,
            category: setting.category,
            description: `System setting for ${setting.key}`
          }
        })
      )
    )

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

