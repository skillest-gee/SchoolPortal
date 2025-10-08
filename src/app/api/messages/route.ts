import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { messageSchema, validateData } from '@/lib/validation'
import { withAPIRateLimit } from '@/lib/rate-limit'
import { handleError, handleDatabaseError, NotFoundError } from '@/lib/error-handling'

export const GET = withAPIRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'sent' or 'received'
    const isRead = searchParams.get('isRead')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause based on user role and filters
    let whereClause: any = {}
    
    if (type === 'sent') {
      whereClause.senderId = session.user.id
    } else if (type === 'received') {
      whereClause.recipientId = session.user.id
    } else {
      // Show both sent and received messages
      whereClause.OR = [
        { senderId: session.user.id },
        { recipientId: session.user.id }
      ]
    }
    
    if (isRead !== null) {
      whereClause.isRead = isRead === 'true'
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
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
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.message.count({ where: whereClause })

    // Get unread count
    const unreadCount = await prisma.message.count({
      where: {
        recipientId: session.user.id,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      data: messages,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleError(error, '/api/messages')
  }
})

export const POST = withAPIRateLimit(async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = validateData(messageSchema, body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const messageData = validation.data!

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: messageData.recipientId }
    })

    if (!recipient) {
      throw new NotFoundError('Recipient not found')
    }

    // Get sender and recipient names for display
    const sender = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: true,
        lecturerProfile: true
      }
    })

    const recipientProfile = await prisma.user.findUnique({
      where: { id: messageData.recipientId },
      include: {
        studentProfile: true,
        lecturerProfile: true
      }
    })

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId: messageData.recipientId,
        subject: messageData.subject,
        content: messageData.content,
        senderName: sender?.name || 'Unknown',
        senderRole: sender?.role || 'UNKNOWN',
        recipientName: recipientProfile?.name || 'Unknown',
        recipientRole: recipientProfile?.role || 'UNKNOWN'
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
      data: message,
      message: 'Message sent successfully'
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), '/api/messages')
  }
})