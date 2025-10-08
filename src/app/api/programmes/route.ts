import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const programmes = await prisma.programme.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: programmes
    })
  } catch (error) {
    console.error('Error fetching programmes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
