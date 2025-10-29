import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get all conversations for a student (like WhatsApp chat list)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.user.id

    // Get all messages where the current user is either sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { recipientId: currentUserId }
        ]
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Group messages by conversation (other user)
    const conversations = new Map()

    messages.forEach(message => {
      // Determine the other participant in the conversation
      const otherUserId = message.senderId === currentUserId ? message.recipientId : message.senderId
      const otherUser = message.senderId === currentUserId ? message.recipient : message.sender

      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          userId: otherUserId,
          name: otherUser.name,
          email: otherUser.email,
          role: otherUser.role,
          studentId: otherUser.studentProfile?.studentId,
          staffId: otherUser.lecturerProfile?.staffId,
          profileImage: otherUser.image,
          profile: {
            firstName: otherUser.studentProfile?.firstName,
            surname: otherUser.studentProfile?.surname,
            programme: otherUser.studentProfile?.programme,
            yearOfStudy: otherUser.studentProfile?.yearOfStudy,
            department: otherUser.lecturerProfile?.department
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
          subject: message.subject,
          isFromMe: message.senderId === currentUserId,
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
