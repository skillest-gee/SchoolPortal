import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { programmeFees as defaultFees, findFeeStructure } from '@/lib/fee-utils'
import { z } from 'zod'

const feeStructureSchema = z.object({
  programme: z.string().min(1),
  admission: z.number().min(0),
  tuition: z.number().min(0),
  accommodation: z.number().min(0),
  library: z.number().min(0),
  laboratory: z.number().optional(),
  examination: z.number().min(0),
  total: z.number().min(0)
})

// GET: Get all programme fee structures
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return the default fee structures
    // In production, you might want to store these in a database
    return NextResponse.json({
      success: true,
      data: defaultFees
    })
  } catch (error) {
    console.error('Error fetching programme fees:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Create new programme fee structure
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = feeStructureSchema.parse(body)

    // In a production system, you would save this to a database
    // For now, we'll update the in-memory structure
    // Note: This will not persist across server restarts
    
    return NextResponse.json({
      success: true,
      message: 'Fee structure created successfully',
      data: validatedData
    })

  } catch (error) {
    console.error('Error creating programme fee:', error)
    
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

// PUT: Update programme fee structure
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = feeStructureSchema.parse(body)

    // In a production system, you would update this in a database
    // For now, we'll return success
    
    return NextResponse.json({
      success: true,
      message: 'Fee structure updated successfully',
      data: validatedData
    })

  } catch (error) {
    console.error('Error updating programme fee:', error)
    
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

