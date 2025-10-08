import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters').optional(),
  type: z.enum(['GENERAL', 'ACADEMIC', 'FINANCIAL', 'EVENT', 'URGENT']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'LECTURERS', 'ADMIN']).optional(),
  isActive: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
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

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcement' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateAnnouncementSchema.parse(body)

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: params.id }
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.targetAudience !== undefined) updateData.targetAudience = validatedData.targetAudience
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
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

    // If announcement is being activated and wasn't active before, create notifications
    if (validatedData.isActive === true && !existingAnnouncement.isActive) {
      const targetUsers = await prisma.user.findMany({
        where: {
          OR: [
            announcement.targetAudience === 'ALL' ? {} : {},
            announcement.targetAudience === 'STUDENTS' ? { role: 'student' } : {},
            announcement.targetAudience === 'LECTURERS' ? { role: 'lecturer' } : {},
            announcement.targetAudience === 'ADMIN' ? { role: 'admin' } : {}
          ]
        },
        select: { id: true }
      })

      if (targetUsers.length > 0) {
        await prisma.notification.createMany({
          data: targetUsers.map(user => ({
            userId: user.id,
            title: 'New Announcement',
            content: announcement.title,
            type: 'ANNOUNCEMENT',
            data: JSON.stringify({ announcementId: announcement.id })
          }))
        })
      }
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Error updating announcement:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateAnnouncementSchema.parse(body)

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: params.id }
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validatedData.title !== undefined) updateData.title = validatedData.title
    if (validatedData.content !== undefined) updateData.content = validatedData.content
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
    if (validatedData.targetAudience !== undefined) updateData.targetAudience = validatedData.targetAudience
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive

    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
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

    // If announcement is being activated and wasn't active before, create notifications
    if (validatedData.isActive === true && !existingAnnouncement.isActive) {
      const targetUsers = await prisma.user.findMany({
        where: {
          OR: [
            announcement.targetAudience === 'ALL' ? {} : {},
            announcement.targetAudience === 'STUDENTS' ? { role: 'student' } : {},
            announcement.targetAudience === 'LECTURERS' ? { role: 'lecturer' } : {},
            announcement.targetAudience === 'ADMIN' ? { role: 'admin' } : {}
          ]
        },
        select: { id: true }
      })

      if (targetUsers.length > 0) {
        await prisma.notification.createMany({
          data: targetUsers.map(user => ({
            userId: user.id,
            title: 'New Announcement',
            content: announcement.title,
            type: 'ANNOUNCEMENT',
            data: JSON.stringify({ announcementId: announcement.id })
          }))
        })
      }
    }

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Error updating announcement:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if announcement exists
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: params.id }
    })

    if (!existingAnnouncement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    await prisma.announcement.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
}

