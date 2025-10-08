import { prisma } from '@/lib/prisma'
import { generateMFASecret, generateTOTPCode, verifyTOTPCode, generateSecureToken } from './security'
import QRCode from 'qrcode'

export interface MFASetup {
  secret: string
  qrCode: string
  backupCodes: string[]
}

export interface MFAVerification {
  isValid: boolean
  isBackupCode?: boolean
}

// Setup MFA for a user
export async function setupMFA(userId: string): Promise<MFASetup> {
  try {
    const secret = generateMFASecret()
    const backupCodes = Array.from({ length: 10 }, () => generateSecureToken(8))
    
    // Generate QR code
    const qrCodeData = `otpauth://totp/SchoolPortal:${userId}?secret=${secret}&issuer=SchoolPortal`
    const qrCode = await QRCode.toDataURL(qrCodeData)
    
    // Store MFA secret in database (in production, encrypt this)
    await prisma.user.update({
      where: { id: userId },
      data: {
        // You'll need to add these fields to your User model
        mfaSecret: secret,
        mfaBackupCodes: JSON.stringify(backupCodes),
        mfaEnabled: false // Will be enabled after verification
      }
    })
    
    return {
      secret,
      qrCode,
      backupCodes
    }
  } catch (error) {
    console.error('Error setting up MFA:', error)
    throw new Error('Failed to setup MFA')
  }
}

// Verify MFA code
export async function verifyMFACode(userId: string, code: string): Promise<MFAVerification> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true, mfaBackupCodes: true }
    })
    
    if (!user || !user.mfaSecret) {
      return { isValid: false }
    }
    
    // Check if it's a backup code
    const backupCodes = JSON.parse(user.mfaBackupCodes || '[]')
    const isBackupCode = backupCodes.includes(code)
    
    if (isBackupCode) {
      // Remove used backup code
      const updatedBackupCodes = backupCodes.filter((c: string) => c !== code)
      await prisma.user.update({
        where: { id: userId },
        data: { mfaBackupCodes: JSON.stringify(updatedBackupCodes) }
      })
      
      return { isValid: true, isBackupCode: true }
    }
    
    // Verify TOTP code
    const isValid = verifyTOTPCode(user.mfaSecret, code)
    return { isValid, isBackupCode: false }
  } catch (error) {
    console.error('Error verifying MFA code:', error)
    return { isValid: false }
  }
}

// Enable MFA after verification
export async function enableMFA(userId: string, verificationCode: string): Promise<boolean> {
  try {
    const verification = await verifyMFACode(userId, verificationCode)
    
    if (!verification.isValid) {
      return false
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true }
    })
    
    return true
  } catch (error) {
    console.error('Error enabling MFA:', error)
    return false
  }
}

// Disable MFA
export async function disableMFA(userId: string, password: string): Promise<boolean> {
  try {
    // Verify password before disabling MFA
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    })
    
    if (!user || !user.passwordHash) {
      return false
    }
    
    // You'll need to import and use your password verification function
    // const isPasswordValid = await verifyPassword(password, user.passwordHash)
    // if (!isPasswordValid) return false
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaEnabled: false,
        mfaSecret: null,
        mfaBackupCodes: null
      }
    })
    
    return true
  } catch (error) {
    console.error('Error disabling MFA:', error)
    return false
  }
}

// Check if MFA is required for user
export async function isMFARequired(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaEnabled: true }
    })
    
    return user?.mfaEnabled || false
  } catch (error) {
    console.error('Error checking MFA requirement:', error)
    return false
  }
}

// Generate new backup codes
export async function generateNewBackupCodes(userId: string): Promise<string[]> {
  try {
    const backupCodes = Array.from({ length: 10 }, () => generateSecureToken(8))
    
    await prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: JSON.stringify(backupCodes) }
    })
    
    return backupCodes
  } catch (error) {
    console.error('Error generating backup codes:', error)
    throw new Error('Failed to generate backup codes')
  }
}

// Send MFA code via SMS (placeholder)
export async function sendMFACodeSMS(phoneNumber: string, code: string): Promise<boolean> {
  try {
    // In production, integrate with SMS service like Twilio
    console.log(`SMS MFA code for ${phoneNumber}: ${code}`)
    return true
  } catch (error) {
    console.error('Error sending SMS MFA code:', error)
    return false
  }
}

// Send MFA code via Email (placeholder)
export async function sendMFACodeEmail(email: string, code: string): Promise<boolean> {
  try {
    // In production, integrate with email service
    console.log(`Email MFA code for ${email}: ${code}`)
    return true
  } catch (error) {
    console.error('Error sending email MFA code:', error)
    return false
  }
}
