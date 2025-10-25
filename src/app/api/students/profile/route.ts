import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user with student profile
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id
      },
      include: {
        studentProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If no profile exists, create a basic one
    if (!user.studentProfile) {
      const profile = await prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentId: `STU${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
          institutionalEmail: user.email,
          // Set default values that can be updated by admin
          title: 'MR.',
          firstName: user.name?.split(' ')[0] || '',
          surname: user.name?.split(' ').slice(-1)[0] || '',
          programme: 'BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)',
          currentMajor: 'INFORMATION TECHNOLOGY',
          level: '100',
          hall: 'NOT ASSIGNED',
          gpa: 0.0,
          yearOfStudy: '1st Year'
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            image: user.image
          },
          profile
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image
        },
        profile: user.studentProfile
      }
    })

  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Only allow updating editable fields
    const editableFields = {
      roomNo: body.roomNo,
      personalEmail: body.personalEmail,
      campusAddress: body.campusAddress,
      gpsAddress: body.gpsAddress,
      cellphone: body.cellphone,
      homePhone: body.homePhone,
      homeAddress: body.homeAddress,
      postalAddress: body.postalAddress,
      postalTown: body.postalTown,
      placeOfBirth: body.placeOfBirth,
      hometown: body.hometown
    }

    // Handle profile image update
    if (body.profileImage) {
      // Update user's image field
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: body.profileImage }
      })
    }

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(editableFields).filter(([_, value]) => value !== undefined)
    )

    const updatedProfile = await prisma.studentProfile.update({
      where: {
        userId: session.user.id
      },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      data: updatedProfile
    })

  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
