import { NextRequest, NextResponse } from 'next/server'
import { validateFileForUpload, generateUniqueFileName, sanitizeFileName } from '@/lib/file-validation'
import { prisma } from '@/lib/prisma'

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default

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

    // Convert file to base64 for storage in database
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')

    // Generate secure unique filename
    const sanitizedName = sanitizeFileName(file.name)
    const fileName = generateUniqueFileName(sanitizedName, userId || 'anonymous')

    // Store file in database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: fileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64Data,
        uploadedBy: userId || 'anonymous',
        category: category
      }
    })

    // Return the file ID and URL for retrieval
    const fileUrl = `/api/files/${uploadedFile.id}`

    return NextResponse.json({
      success: true,
      filePath: fileUrl,
      fileName: fileName,
      fileId: uploadedFile.id
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}