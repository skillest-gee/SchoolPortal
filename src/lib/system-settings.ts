import { prisma } from './prisma'

export interface SystemSettings {
  universityName: string
  universityEmail: string
  universityPhone: string
  universityAddress: string
  timezone: string
  language: string
  academicYear: string
  semester: string
  maxCourseCredits: number
  minCourseCredits: number
  enrollmentDeadline: string
  maintenanceMode: boolean
  registrationOpen: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  passwordMinLength: number
  sessionTimeout: number
  twoFactorAuth: boolean
  autoBackup: boolean
  backupFrequency: string
  backupRetention: number
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const settings = await prisma.systemSettings.findMany({
      where: { isActive: true }
    })

    // Convert to object format
    const settingsObject = settings.reduce((acc, setting) => {
      // Parse value based on expected type
      let value = setting.value
      if (setting.key.includes('Credits') || setting.key.includes('Length') || setting.key.includes('Timeout') || setting.key.includes('Retention')) {
        value = parseInt(setting.value)
      } else if (setting.key.includes('Mode') || setting.key.includes('Open') || setting.key.includes('Notifications') || setting.key.includes('Auth') || setting.key.includes('Backup')) {
        value = setting.value === 'true'
      }
      
      acc[setting.key] = value
      return acc
    }, {} as any)

    // If no settings exist, return default settings
    if (Object.keys(settingsObject).length === 0) {
      return {
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
    }

    return settingsObject as SystemSettings
  } catch (error) {
    console.error('Error fetching system settings:', error)
    // Return default settings on error
    return {
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
  }
}

export async function getSystemSetting(key: string): Promise<string | boolean | number | null> {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key }
    })

    if (!setting) return null

    // Parse value based on expected type
    if (key.includes('Credits') || key.includes('Length') || key.includes('Timeout') || key.includes('Retention')) {
      return parseInt(setting.value)
    } else if (key.includes('Mode') || key.includes('Open') || key.includes('Notifications') || key.includes('Auth') || key.includes('Backup')) {
      return setting.value === 'true'
    }
    
    return setting.value
  } catch (error) {
    console.error(`Error fetching system setting ${key}:`, error)
    return null
  }
}
