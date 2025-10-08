import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { enableMFA, verifyMFACode } from '@/lib/mfa'
import { withAuthRateLimit } from '@/lib/rate-limit'

export const POST = withAuthRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const { code, action } = await request.json()
    
    if (!code) {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      )
    }
    
    if (action === 'enable') {
      const success = await enableMFA(session.user.id, code)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'MFA enabled successfully'
      })
    } else {
      const verification = await verifyMFACode(session.user.id, code)
      
      if (!verification.isValid) {
        return NextResponse.json(
          { error: 'Invalid verification code' },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        success: true,
        data: {
          isValid: true,
          isBackupCode: verification.isBackupCode
        }
      })
    }
  } catch (error) {
    console.error('MFA verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify MFA code' },
      { status: 500 }
    )
  }
})
