import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch specific message
export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            studentProfile: {
              select: {
                studentId: true
              }
            },
            lecturerProfile: {
              select: {
                staffId: true
              }
            }
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            studentProfile: {
              select: {
                studentId: true
              }
            },
            lecturerProfile: {
              select: {
                staffId: true
              }
            }
          }
        }
      }
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this message
    if (message.senderId !== session.user.id && message.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied to this message' },
        { status: 403 }
      )
    }

    // Mark as read if user is the recipient
    if (message.recipientId === session.user.id && !message.isRead) {
      await prisma.message.update({
        where: { id: params.messageId },
        data: { isRead: true }
      })
    }

    return NextResponse.json({
      success: true,
      data: message
    })

  } catch (error) {
    console.error('Error fetching message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update message (mark as read/unread, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { isRead, isArchived } = body

    // Verify message exists and user has access
    const message = await prisma.message.findUnique({
      where: { id: params.messageId }
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    if (message.senderId !== session.user.id && message.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied to this message' },
        { status: 403 }
      )
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: params.messageId },
      data: {
        ...(isRead !== undefined && { isRead }),
        ...(isArchived !== undefined && { isArchived })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully',
      data: updatedMessage
    })

  } catch (error) {
    console.error('Error updating message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify message exists and user has access
    const message = await prisma.message.findUnique({
      where: { id: params.messageId }
    })

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    if (message.senderId !== session.user.id && message.recipientId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied to this message' },
        { status: 403 }
      )
    }

    // Delete message
    await prisma.message.delete({
      where: { id: params.messageId }
    })

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
