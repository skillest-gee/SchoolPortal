import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const borrowBookSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  dueDate: z.string().transform((str) => new Date(str)),
  notes: z.string().optional(),
})

// POST: Borrow a book
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only students can borrow books
    if (session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Forbidden: Only students can borrow books' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = borrowBookSchema.parse(body)

    // Verify book exists
    const book = await prisma.book.findUnique({
      where: { id: validatedData.bookId }
    })

    if (!book) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    // Check if book is available
    if (book.availableCopies <= 0) {
      return NextResponse.json(
        { error: 'This book is currently not available' },
        { status: 400 }
      )
    }

    // Check if user already has this book borrowed
    const existingBorrowing = await prisma.borrowing.findFirst({
      where: {
        userId: session.user.id,
        bookId: validatedData.bookId,
        returnDate: null
      }
    })

    if (existingBorrowing) {
      return NextResponse.json(
        { error: 'You have already borrowed this book' },
        { status: 400 }
      )
    }

    // Check if user has reached borrowing limit (e.g., 5 books)
    const currentBorrowings = await prisma.borrowing.count({
      where: {
        userId: session.user.id,
        returnDate: null
      }
    })

    if (currentBorrowings >= 5) {
      return NextResponse.json(
        { error: 'You have reached the maximum borrowing limit (5 books)' },
        { status: 400 }
      )
    }

    // Use transaction to borrow book and update availability
    const result = await prisma.$transaction(async (tx) => {
      // Create borrowing record
      const borrowing = await tx.borrowing.create({
        data: {
          userId: session.user.id,
          bookId: validatedData.bookId,
          borrowDate: new Date(),
          dueDate: validatedData.dueDate,
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
        where: { id: validatedData.bookId },
        data: {
          availableCopies: {
            decrement: 1
          }
        }
      })

      return borrowing
    })

    return NextResponse.json({
      success: true,
      message: 'Book borrowed successfully',
      data: result
    })

  } catch (error) {
    console.error('Error borrowing book:', error)
    
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
