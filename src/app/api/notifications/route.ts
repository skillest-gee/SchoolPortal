import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withAPIRateLimit } from '@/lib/rate-limit'
import { handleError, handleDatabaseError } from '@/lib/error-handling'
import { z } from 'zod'

const notificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(1000),
  type: z.enum(['INFO', 'WARNING', 'ERROR', 'SUCCESS']).optional(),
  data: z.string().optional() // JSON string for additional data
})

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
    const isRead = searchParams.get('isRead')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build where clause
    let whereClause: any = {
      userId: session.user.id
    }
    
    if (isRead !== null) {
      whereClause.isRead = isRead === 'true'
    }
    
    if (type) {
      whereClause.type = type
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const total = await prisma.notification.count({ where: whereClause })

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    return handleError(error, '/api/notifications')
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

    // Only admins can create notifications for other users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validation = notificationSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      )
    }

    const notificationData = validation.data

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: notificationData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type || 'INFO',
        data: notificationData.data
      }
    })

    return NextResponse.json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    }, { status: 201 })
  } catch (error) {
    return handleError(handleDatabaseError(error), '/api/notifications')
  }
})