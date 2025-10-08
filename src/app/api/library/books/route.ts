import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createBookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().min(1, 'ISBN is required'),
  publisher: z.string().min(1, 'Publisher is required'),
  publicationYear: z.number().min(1000, 'Invalid publication year').max(new Date().getFullYear() + 1),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  totalCopies: z.number().min(1, 'At least one copy is required'),
  availableCopies: z.number().min(0, 'Available copies cannot be negative'),
  location: z.string().min(1, 'Location is required'),
  coverImageUrl: z.string().optional(),
})

// GET: Fetch books
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
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const author = searchParams.get('author')
    const isbn = searchParams.get('isbn')
    const available = searchParams.get('available')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { isbn: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (category) {
      where.category = category
    }

    if (author) {
      where.author = { contains: author, mode: 'insensitive' }
    }

    if (isbn) {
      where.isbn = { contains: isbn, mode: 'insensitive' }
    }

    if (available === 'true') {
      where.availableCopies = { gt: 0 }
    }

    const books = await prisma.book.findMany({
      where,
      include: {
        borrowings: {
          where: {
            returnDate: null
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        title: 'asc'
      },
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
    })

    // Calculate availability status
    const booksWithStatus = books.map(book => ({
      ...book,
      isAvailable: book.availableCopies > 0,
      borrowedBy: book.borrowings.map(borrowing => ({
        id: borrowing.user.id,
        name: borrowing.user.name,
        email: borrowing.user.email,
        borrowDate: borrowing.borrowDate
      }))
    }))

    return NextResponse.json({
      success: true,
      data: booksWithStatus
    })

  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new book
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins and librarians can create books
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can add books' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createBookSchema.parse(body)

    // Check if book with same ISBN already exists
    const existingBook = await prisma.book.findFirst({
      where: { isbn: validatedData.isbn }
    })

    if (existingBook) {
      return NextResponse.json(
        { error: 'A book with this ISBN already exists' },
        { status: 400 }
      )
    }

    // Create the book
    const book = await prisma.book.create({
      data: validatedData,
      include: {
        borrowings: {
          where: {
            returnDate: null
          },
          include: {
            user: {
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
      message: 'Book added successfully',
      data: book
    })

  } catch (error) {
    console.error('Error creating book:', error)
    
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
