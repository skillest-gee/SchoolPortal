import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().min(1, 'Email or Student ID is required'),
  password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = loginSchema.parse(body)

    // Find user based on email/student ID
    let user
    if (validatedData.email.includes('STU')) {
      // Student ID login for students
      const studentId = validatedData.email.toUpperCase()
      
      // Find user by student profile
      const studentProfile = await prisma.studentProfile.findUnique({
        where: { studentId: studentId },
        include: { user: true }
      })
      
      if (studentProfile) {
        user = studentProfile.user
      }
    } else {
      // Email login for admin/lecturer
      user = await prisma.user.findFirst({
        where: {
          email: validatedData.email.toLowerCase(),
          role: { not: 'STUDENT' },
          isActive: true
        },
        include: {
          lecturerProfile: true
        }
      })
    }

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.passwordHash)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Update last login
    // Update last login time (if field exists in schema)
    // await prisma.user.update({
    //   where: { id: user.id },
    //   data: { lastLoginAt: new Date() }
    // })

    // Return user data (without password hash)
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
      indexNumber: user.indexNumber,
      isActive: user.isActive,
      // lastLoginAt: user.lastLoginAt
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userData
    })

  } catch (error) {
    console.error('Login API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET: Check current session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: session.user
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
