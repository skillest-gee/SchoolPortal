import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get messages between current user and another user (conversation)
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id
    const otherUserId = params.userId

    // Get all messages between the two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: currentUserId,
            recipientId: otherUserId
          },
          {
            senderId: otherUserId,
            recipientId: currentUserId
          }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
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
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Format messages for frontend
    const formattedMessages = messages.map(message => ({
      id: message.id,
      content: message.content,
      subject: message.subject,
      isFromMe: message.senderId === currentUserId,
      isRead: message.isRead,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        studentId: message.sender.studentProfile?.studentId,
        staffId: message.sender.lecturerProfile?.staffId
      }
    }))

    return NextResponse.json({
      success: true,
      data: formattedMessages
    })

  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Send a message in a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id
    const recipientId = params.userId
    const body = await request.json()
    const { content, subject } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    })

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: currentUserId,
        recipientId: recipientId,
        subject: subject || 'No subject',
        content: content.trim(),
        senderName: session.user.name || 'Unknown',
        senderRole: session.user.role || 'UNKNOWN',
        recipientName: recipient.name || 'Unknown',
        recipientRole: recipient.role || 'UNKNOWN'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
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
            email: true
          }
        }
      }
    })

    // Format response
    const formattedMessage = {
      id: message.id,
      content: message.content,
      subject: message.subject,
      isFromMe: true,
      isRead: false,
      createdAt: message.createdAt.toISOString(),
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        studentId: message.sender.studentProfile?.studentId,
        staffId: message.sender.lecturerProfile?.staffId
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedMessage
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

