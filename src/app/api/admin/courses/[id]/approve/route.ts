import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const approveCourseSchema = z.object({
  action: z.enum(['approve', 'reject']),
  rejectionReason: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = approveCourseSchema.parse(body)

    const courseId = params.id

    // Find the course
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (course.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Course has already been processed' },
        { status: 400 }
      )
    }

    // Update course status
    const updateData: any = {
      status: validatedData.action === 'approve' ? 'APPROVED' : 'REJECTED',
      approvedBy: session.user.id,
      approvedAt: new Date(),
    }

    if (validatedData.action === 'reject') {
      if (!validatedData.rejectionReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        )
      }
      updateData.rejectionReason = validatedData.rejectionReason
      updateData.isActive = false
    } else {
      updateData.isActive = true
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Create notification for the lecturer
    await prisma.notification.create({
      data: {
        userId: course.lecturer.id,
        title: `Course ${validatedData.action === 'approve' ? 'Approved' : 'Rejected'}`,
        content: `Your course "${course.title}" (${course.code}) has been ${validatedData.action === 'approve' ? 'approved and is now available for student enrollment' : 'rejected'}.${validatedData.action === 'reject' && validatedData.rejectionReason ? ` Reason: ${validatedData.rejectionReason}` : ''}`,
        type: validatedData.action === 'approve' ? 'SUCCESS' : 'WARNING',
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedCourse,
    })
  } catch (error) {
    console.error('Error processing course approval:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process course approval' },
      { status: 500 }
    )
  }
}
