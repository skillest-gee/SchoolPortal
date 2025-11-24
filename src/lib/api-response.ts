import { NextResponse } from 'next/server'
import { z } from 'zod'

export function handleAPIError(error: unknown) {
  console.error('API Error:', error)
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

export function ok<T>(data: T) {
  return NextResponse.json({ success: true, data })
}