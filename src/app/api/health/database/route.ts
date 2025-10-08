import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseConnection, getConnectionInfo } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const isConnected = await checkDatabaseConnection()
    const connectionInfo = getConnectionInfo()
    
    if (!isConnected) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Database connection failed',
          details: connectionInfo
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Database connection successful',
      details: connectionInfo,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
