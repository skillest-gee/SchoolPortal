import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  type: z.enum(['GENERAL', 'ACADEMIC', 'FINANCIAL', 'EVENT', 'URGENT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'LECTURERS', 'ADMIN']),
  isActive: z.boolean().default(true)
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const priority = searchParams.get('priority')
    const targetAudience = searchParams.get('targetAudience')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = {}
    
    if (type) where.type = type
    if (priority) where.priority = priority
    if (targetAudience) where.targetAudience = targetAudience
    if (isActive !== null) where.isActive = isActive === 'true'
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return NextResponse.json({ announcements })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAnnouncementSchema.parse(body)

    const announcement = await prisma.announcement.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        type: validatedData.type,
        priority: validatedData.priority,
        targetAudience: validatedData.targetAudience,
        isActive: validatedData.isActive,
        authorId: session.user.id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create notifications for target audience
    if (validatedData.isActive) {
      const targetUsers = await prisma.user.findMany({
        where: {
          OR: [
            validatedData.targetAudience === 'ALL' ? {} : {},
            validatedData.targetAudience === 'STUDENTS' ? { role: 'student' } : {},
            validatedData.targetAudience === 'LECTURERS' ? { role: 'lecturer' } : {},
            validatedData.targetAudience === 'ADMIN' ? { role: 'admin' } : {}
          ]
        },
        select: { id: true }
      })

      if (targetUsers.length > 0) {
        await prisma.notification.createMany({
          data: targetUsers.map(user => ({
            userId: user.id,
            title: 'New Announcement',
            content: validatedData.title,
            type: 'ANNOUNCEMENT',
            data: JSON.stringify({ announcementId: announcement.id })
          }))
        })
      }
    }

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}

