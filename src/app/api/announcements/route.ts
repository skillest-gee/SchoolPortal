import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get announcements based on user role
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { targetAudience: 'ALL' },
          { targetAudience: session.user.role }
        ]
      },
      include: {
        author: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data
    const announcementsList = announcements.map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      author: announcement.author.name,
      targetAudience: announcement.targetAudience,
      createdAt: announcement.createdAt,
      updatedAt: announcement.updatedAt
    }))

    return NextResponse.json({
      success: true,
      data: announcementsList
    })

  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}