import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateTimetableSchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  room: z.string().optional(),
  semester: z.enum(['FIRST', 'SECOND', 'SUMMER']).optional(),
  academicYear: z.string().optional(),
  classType: z.enum(['LECTURE', 'TUTORIAL', 'LAB', 'SEMINAR', 'EXAM']).optional(),
  notes: z.string().optional(),
})

// GET: Fetch specific timetable entry
export async function GET(
  request: NextRequest,
  { params }: { params: { timetableId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const timetableEntry = await prisma.timetableEntry.findUnique({
      where: { id: params.timetableId },
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!timetableEntry) {
      return NextResponse.json(
        { error: 'Timetable entry not found' },
        { status: 404 }
      )
    }

    // Check if user has access to this timetable entry
    if (session.user.role === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: session.user.id,
          courseId: timetableEntry.courseId
        }
      })

      if (!enrollment) {
        return NextResponse.json(
          { error: 'Access denied to this timetable entry' },
          { status: 403 }
        )
      }
    } else if (session.user.role === 'LECTURER') {
      if (timetableEntry.course.lecturerId !== session.user.id) {
        return NextResponse.json(
          { error: 'Access denied to this timetable entry' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: timetableEntry
    })

  } catch (error) {
    console.error('Error fetching timetable entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT: Update timetable entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { timetableId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins and lecturers can update timetable entries
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators and lecturers can update timetable entries' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateTimetableSchema.parse(body)

    // Verify timetable entry exists
    const existingEntry = await prisma.timetableEntry.findUnique({
      where: { id: params.timetableId },
      include: { course: true }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Timetable entry not found' },
        { status: 404 }
      )
    }

    // Check if lecturer has access to this course
    if (session.user.role === 'LECTURER' && existingEntry.course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update timetables for your own courses' },
        { status: 403 }
      )
    }

    // Check for time conflicts if time or room is being updated
    if (validatedData.startTime || validatedData.endTime || validatedData.room || validatedData.dayOfWeek) {
      const dayOfWeek = validatedData.dayOfWeek || existingEntry.dayOfWeek
      const startTime = validatedData.startTime || existingEntry.startTime
      const endTime = validatedData.endTime || existingEntry.endTime
      const room = validatedData.room || existingEntry.room
      // academicYear and semester are not fields in TimetableEntry

      const conflictingEntry = await prisma.timetableEntry.findFirst({
        where: {
          id: { not: params.timetableId },
          dayOfWeek,
          room,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        }
      })

      if (conflictingEntry) {
        return NextResponse.json(
          { error: 'Time conflict detected. Another class is scheduled in the same room at this time.' },
          { status: 400 }
        )
      }
    }

    // Update the timetable entry
    const updatedEntry = await prisma.timetableEntry.update({
      where: { id: params.timetableId },
      data: validatedData,
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: updatedEntry
    })

  } catch (error) {
    console.error('Error updating timetable entry:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete timetable entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { timetableId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins and lecturers can delete timetable entries
    if (session.user.role !== 'ADMIN' && session.user.role !== 'LECTURER') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators and lecturers can delete timetable entries' },
        { status: 403 }
      )
    }

    // Verify timetable entry exists
    const existingEntry = await prisma.timetableEntry.findUnique({
      where: { id: params.timetableId },
      include: { course: true }
    })

    if (!existingEntry) {
      return NextResponse.json(
        { error: 'Timetable entry not found' },
        { status: 404 }
      )
    }

    // Check if lecturer has access to this course
    if (session.user.role === 'LECTURER' && existingEntry.course.lecturerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete timetables for your own courses' },
        { status: 403 }
      )
    }

    // Delete the timetable entry
    await prisma.timetableEntry.delete({
      where: { id: params.timetableId }
    })

    return NextResponse.json({
      success: true,
      message: 'Timetable entry deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting timetable entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
