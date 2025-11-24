import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSystemSetting } from '@/lib/system-settings'

interface MaintenanceOptions {
  allowAdminsBypass?: boolean
}

export function withMaintenanceCheck(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: MaintenanceOptions = { allowAdminsBypass: true }
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const maintenance = await getSystemSetting('maintenanceMode')
      const isMaintenance = typeof maintenance === 'boolean' ? maintenance : false

      if (!isMaintenance) {
        return handler(req)
      }

      const session = await getServerSession(authOptions)

      if (options.allowAdminsBypass && session?.user?.role === 'ADMIN') {
        return handler(req)
      }

      return NextResponse.json(
        {
          error: 'Service Unavailable',
          message: 'The system is under maintenance. Please try again later.'
        },
        { status: 503 }
      )
    } catch (err) {
      // On error, fail open to avoid blocking critical flows
      return handler(req)
    }
  }
}