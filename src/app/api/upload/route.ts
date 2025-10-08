import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { validateFileForUpload, generateUniqueFileName, sanitizeFileName } from '@/lib/file-validation'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const userId = formData.get('userId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate file based on type
    const category = type === 'profile' ? 'profile' : type === 'assignment' ? 'assignment' : 'document'
    const validation = validateFileForUpload(file, category)
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'File validation failed', 
        details: validation.errors 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate secure unique filename
    const sanitizedName = sanitizeFileName(file.name)
    const fileName = generateUniqueFileName(sanitizedName, userId || 'anonymous')
    const filePath = join(uploadsDir, fileName)

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Return the public URL
    const publicUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      filePath: publicUrl,
      fileName: fileName
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}