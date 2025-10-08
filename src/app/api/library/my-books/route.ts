import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch user's borrowed books
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'returned', 'all'
    const userId = searchParams.get('userId') // For admin to view any user's books

    // Determine which user's books to fetch
    const targetUserId = userId && session.user.role === 'ADMIN' ? userId : session.user.id

    // Build where clause
    const where: any = {
      userId: targetUserId
    }

    if (status === 'active') {
      where.returnDate = null
    } else if (status === 'returned') {
      where.returnDate = { not: null }
    }

    const borrowings = await prisma.borrowing.findMany({
      where,
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentProfile: {
              select: {
                studentId: true
              }
            }
          }
        }
      },
      orderBy: {
        borrowDate: 'desc'
      }
    })

    // Calculate additional information
    const borrowingsWithInfo = borrowings.map(borrowing => {
      const isOverdue = borrowing.returnDate === null && new Date() > borrowing.dueDate
      const daysOverdue = isOverdue ? Math.ceil((new Date().getTime() - borrowing.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
      
      return {
        ...borrowing,
        isOverdue,
        daysOverdue,
        status: borrowing.returnDate ? 'returned' : isOverdue ? 'overdue' : 'active'
      }
    })

    // Calculate statistics
    const stats = {
      totalBorrowed: borrowings.length,
      activeBorrowings: borrowings.filter(b => b.returnDate === null).length,
      overdueBorrowings: borrowingsWithInfo.filter(b => b.isOverdue).length,
      returnedBorrowings: borrowings.filter(b => b.returnDate !== null).length
    }

    return NextResponse.json({
      success: true,
      data: borrowingsWithInfo,
      stats
    })

  } catch (error) {
    console.error('Error fetching user books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
