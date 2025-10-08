import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const returnBookSchema = z.object({
  borrowingId: z.string().min(1, 'Borrowing ID is required'),
  condition: z.enum(['EXCELLENT', 'GOOD', 'FAIR', 'POOR']).default('GOOD'),
  notes: z.string().optional(),
})

// POST: Return a book
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = returnBookSchema.parse(body)

    // Verify borrowing record exists
    const borrowing = await prisma.borrowing.findUnique({
      where: { id: validatedData.borrowingId },
      include: {
        book: true,
        user: true
      }
    })

    if (!borrowing) {
      return NextResponse.json(
        { error: 'Borrowing record not found' },
        { status: 404 }
      )
    }

    // Check if book is already returned
    if (borrowing.returnDate) {
      return NextResponse.json(
        { error: 'This book has already been returned' },
        { status: 400 }
      )
    }

    // Check if user has permission to return this book
    if (session.user.role === 'STUDENT' && borrowing.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only return books you have borrowed' },
        { status: 403 }
      )
    }

    // Use transaction to return book and update availability
    const result = await prisma.$transaction(async (tx) => {
      // Update borrowing record
      const updatedBorrowing = await tx.borrowing.update({
        where: { id: validatedData.borrowingId },
        data: {
          returnDate: new Date(),
          condition: validatedData.condition,
          notes: validatedData.notes
        },
        include: {
          book: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Update book availability
      await tx.book.update({
        where: { id: borrowing.bookId },
        data: {
          availableCopies: {
            increment: 1
          }
        }
      })

      return updatedBorrowing
    })

    return NextResponse.json({
      success: true,
      message: 'Book returned successfully',
      data: result
    })

  } catch (error) {
    console.error('Error returning book:', error)
    
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
