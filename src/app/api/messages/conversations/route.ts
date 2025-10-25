import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get all conversations for a student (like WhatsApp chat list)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const studentId = session.user.id

    // Get all messages where the student is either sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: studentId },
          { recipientId: studentId }
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
        createdAt: 'desc'
      }
    })

    // Group messages by conversation (other student)
    const conversations = new Map()

    messages.forEach(message => {
      // Determine the other participant in the conversation
      const otherUserId = message.senderId === studentId ? message.recipientId : message.senderId
      const otherUser = message.senderId === studentId ? message.recipient : message.sender

      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          userId: otherUserId,
          name: otherUser.name,
          studentId: otherUser.studentProfile?.studentId,
          profileImage: otherUser.image,
          profile: {
            firstName: otherUser.studentProfile?.firstName,
            surname: otherUser.studentProfile?.surname,
            programme: otherUser.studentProfile?.programme,
            yearOfStudy: otherUser.studentProfile?.yearOfStudy
          },
          lastMessage: null,
          unreadCount: 0,
          lastMessageTime: null
        })
      }

      const conversation = conversations.get(otherUserId)

      // Set the most recent message as the last message
      if (!conversation.lastMessage || message.createdAt > conversation.lastMessageTime) {
        conversation.lastMessage = {
          id: message.id,
          content: message.content,
          isFromMe: message.senderId === studentId,
          createdAt: message.createdAt
        }
        conversation.lastMessageTime = message.createdAt
      }

      // Count unread messages from the other user
      if (message.senderId === otherUserId && !message.isRead) {
        conversation.unreadCount++
      }
    })

    // Convert to array and sort by last message time
    const conversationsList = Array.from(conversations.values()).sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    )

    return NextResponse.json({
      success: true,
      data: conversationsList
    })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
