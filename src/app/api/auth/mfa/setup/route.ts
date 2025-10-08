import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { setupMFA } from '@/lib/mfa'
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
    
    const mfaSetup = await setupMFA(session.user.id)
    
    return NextResponse.json({
      success: true,
      data: mfaSetup
    })
  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    )
  }
})
