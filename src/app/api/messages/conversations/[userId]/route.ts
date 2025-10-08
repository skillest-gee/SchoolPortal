import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get messages in a conversation with a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
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
          include: {
            studentProfile: true
          }
        },
        recipient: {
          include: {
            studentProfile: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        recipientId: currentUserId,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    // Transform the data
    const messagesList = messages.map(message => ({
      id: message.id,
      content: message.content,
      isFromMe: message.senderId === currentUserId,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        indexNumber: message.sender.indexNumber
      }
    }))

    return NextResponse.json({
      success: true,
      data: messagesList
    })

  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Send a message to a specific user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id
    const recipientId = params.userId
    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    // Verify the recipient exists and is a student
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: { studentProfile: true }
    })

    if (!recipient || recipient.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      )
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: currentUserId,
        recipientId: recipientId,
        subject: 'Message',
        content: content.trim(),
        isRead: false
      },
      include: {
        sender: {
          include: {
            studentProfile: true
          }
        },
        recipient: {
          include: {
            studentProfile: true
          }
        }
      }
    })

    // Create notification for the recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        title: 'New Message',
        content: `You have a new message from ${session.user.name}`,
        type: 'MESSAGE',
        isRead: false,
        data: JSON.stringify({
          messageId: message.id,
          senderId: currentUserId
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        isFromMe: true,
        isRead: message.isRead,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          name: message.sender.name,
          indexNumber: message.sender.indexNumber
        }
      }
    })

  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
