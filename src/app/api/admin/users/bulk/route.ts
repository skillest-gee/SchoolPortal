import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkActionSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user ID is required'),
  action: z.enum(['activate', 'deactivate', 'delete']),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = bulkActionSchema.parse(body)

    const { userIds, action } = validatedData

    // Prevent deleting the current admin user
    if (action === 'delete' && userIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    let result
    let message

    switch (action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds }
          },
          data: {
            isActive: true
          }
        })
        message = `${result.count} users activated successfully`
        break

      case 'deactivate':
        result = await prisma.user.updateMany({
          where: {
            id: { in: userIds }
          },
          data: {
            isActive: false
          }
        })
        message = `${result.count} users deactivated successfully`
        break

      case 'delete':
        // Check if any users have related data that would prevent deletion
        const usersWithRelations = await prisma.user.findMany({
          where: {
            id: { in: userIds }
          },
          include: {
            _count: {
              select: {
                academicRecords: true,
                announcements: true,
                attendance: true,
                borrowings: true,
                certificateRequests: true,
                clearanceRequests: true,
                courses: true,
                enrollments: true,
                fees: true,
                notifications: true,
                payments: true,
                quizAttempts: true,
              }
            }
          }
        })

        const usersWithData = usersWithRelations.filter(user => {
          const counts = user._count
          return Object.values(counts).some(count => count > 0)
        })

        if (usersWithData.length > 0) {
          return NextResponse.json(
            { 
              error: 'Cannot delete users with existing data',
              details: usersWithData.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email
              }))
            },
            { status: 400 }
          )
        }

        result = await prisma.user.deleteMany({
          where: {
            id: { in: userIds }
          }
        })
        message = `${result.count} users deleted successfully`
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message,
      count: result.count,
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
