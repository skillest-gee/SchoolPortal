import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { markNotificationAsRead } from '@/lib/notifications'
import { prisma } from '@/lib/prisma'

// GET: Get specific notification
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: notification
    })

  } catch (error) {
    console.error('Error fetching notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Mark notification as read
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await markNotificationAsRead(params.id, session.user.id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Delete notification (only if it belongs to the user)
    const deleted = await prisma.notification.deleteMany({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted'
    })

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
