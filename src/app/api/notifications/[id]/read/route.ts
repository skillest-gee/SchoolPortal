import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleError, handleDatabaseError, NotFoundError } from '@/lib/error-handling'

export const PUT = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    })

    if (!notification) {
      throw new NotFoundError('Notification not found')
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Mark notification as read
    const updatedNotification = await prisma.notification.update({
      where: { id: params.id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification marked as read'
    })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/notifications/${params.id}/read`)
  }
})
