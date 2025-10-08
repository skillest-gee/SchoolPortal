import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // Student specific fields
  studentId: z.string().optional(),
  program: z.string().optional(),
  yearOfStudy: z.number().optional(),
  // Lecturer specific fields
  staffId: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
})

// GET: Fetch all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can view all users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can view users' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (role) {
      where.role = role
    }

    // Fetch users with their profiles
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          studentProfile: true,
          lecturerProfile: true,
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    // Remove password hashes from response
    const safeUsers = users.map(user => {
      const { passwordHash, ...safeUser } = user
      return safeUser
    })

    return NextResponse.json({
      success: true,
      data: safeUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admins can create users
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can create users' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // Create user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          name: validatedData.name,
          role: validatedData.role,
          passwordHash,
          emailVerified: new Date(),
          isActive: true,
        }
      })

      // Create appropriate profile based on role
      if (validatedData.role === 'STUDENT' && validatedData.studentId && validatedData.program) {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            studentId: validatedData.studentId,
            programme: validatedData.program,
            yearOfStudy: validatedData.yearOfStudy?.toString() || '1',
          }
        })
      } else if (validatedData.role === 'LECTURER' && validatedData.staffId && validatedData.department) {
        await tx.lecturerProfile.create({
          data: {
            userId: user.id,
            staffId: validatedData.staffId,
            department: validatedData.department,
            office: validatedData.office,
          }
        })
      }

      return user
    })

    // Remove password hash from response
    const { passwordHash: _, ...safeUser } = result

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: safeUser
    })

  } catch (error) {
    console.error('Error creating user:', error)
    
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
