import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withAPIRateLimit } from '@/lib/rate-limit'
import { handleError, handleDatabaseError, NotFoundError } from '@/lib/error-handling'

export const PUT = withAPIRateLimit(async (
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

    // Check if message exists and user is the recipient
    const message = await prisma.message.findUnique({
      where: { id: params.id },
      include: {
        sender: {
          include: {
            studentProfile: true,
            lecturerProfile: true
          }
        },
        recipient: {
          include: {
            studentProfile: true,
            lecturerProfile: true
          }
        }
      }
    })

    if (!message) {
      throw new NotFoundError('Message not found')
    }

    if (message.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Mark message as read
    const updatedMessage = await prisma.message.update({
      where: { id: params.id },
      data: {
        isRead: true,
        readAt: new Date()
      },
      include: {
        sender: {
          include: {
            studentProfile: true,
            lecturerProfile: true
          }
        },
        recipient: {
          include: {
            studentProfile: true,
            lecturerProfile: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedMessage,
      message: 'Message marked as read'
    })
  } catch (error) {
    return handleError(handleDatabaseError(error), `/api/messages/${params.id}/read`)
  }
})
