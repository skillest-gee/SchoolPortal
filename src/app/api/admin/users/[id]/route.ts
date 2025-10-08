import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']).optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
  // Student specific fields
  studentId: z.string().optional(),
  program: z.string().optional(),
  yearOfStudy: z.number().optional(),
  // Lecturer specific fields
  staffId: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
})

const patchUserSchema = z.object({
  isActive: z.boolean(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        studentProfile: true,
        lecturerProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        studentProfile: true,
        lecturerProfile: true,
      },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        )
      }
    }

    // Hash password if provided
    let hashedPassword
    if (validatedData.password) {
      const bcrypt = await import('bcryptjs')
      hashedPassword = await bcrypt.hash(validatedData.password, 12)
    }

    // Update user
    const updateData: any = {
      email: validatedData.email,
      name: validatedData.name,
      role: validatedData.role,
      isActive: validatedData.isActive,
    }

    if (hashedPassword) {
      updateData.passwordHash = hashedPassword
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        studentProfile: true,
        lecturerProfile: true,
      },
    })

    // Update or create student profile if role is STUDENT
    if (validatedData.role === 'STUDENT' || existingUser.role === 'STUDENT') {
      if (validatedData.studentId || validatedData.program || validatedData.yearOfStudy) {
        await prisma.studentProfile.upsert({
          where: { userId: params.id },
          update: {
            studentId: validatedData.studentId,
            program: validatedData.program,
            yearOfStudy: validatedData.yearOfStudy?.toString() || '1',
          },
          create: {
            userId: params.id,
            studentId: validatedData.studentId || '',
            program: validatedData.program || '',
            yearOfStudy: validatedData.yearOfStudy?.toString() || '1',
          },
        })
      }
    }

    // Update or create lecturer profile if role is LECTURER
    if (validatedData.role === 'LECTURER' || existingUser.role === 'LECTURER') {
      if (validatedData.staffId || validatedData.department || validatedData.office) {
        await prisma.lecturerProfile.upsert({
          where: { userId: params.id },
          update: {
            staffId: validatedData.staffId,
            department: validatedData.department,
            office: validatedData.office,
          },
          create: {
            userId: params.id,
            staffId: validatedData.staffId || '',
            department: validatedData.department || '',
            office: validatedData.office,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = patchUserSchema.parse(body)

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: validatedData.isActive,
      },
      include: {
        studentProfile: true,
        lecturerProfile: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user status:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user status' },
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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the current admin user
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
