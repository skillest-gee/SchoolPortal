import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default

// Simple file validation - just check size and basic file existence
function simpleFileValidation(file: File): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  // Check file name
  if (!file.name || file.name.trim().length === 0) {
    errors.push('File name is required')
  }

  // Basic file type check - allow most common types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/octet-stream', // Generic binary
    'application/zip',
    'application/x-zip-compressed'
  ]

  if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
    errors.push('File type not supported. Please upload PDF, DOC, DOCX, TXT, or image files.')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const userId = formData.get('userId') as string

    console.log('Simple upload request received:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      type,
      userId: userId || 'anonymous'
    })

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Simple validation
    const validation = simpleFileValidation(file)
    
    console.log('Simple file validation result:', {
      isValid: validation.isValid,
      errors: validation.errors
    })
    
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

    // Generate simple filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uploadUserId = userId || 'anonymous'
    const fileName = `${sanitizedName}_${uploadUserId}_${timestamp}`

    // Store file in database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: fileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: base64Data,
        uploadedBy: uploadUserId,
        category: type || 'document'
      }
    })

    // Return the file ID and URL for retrieval
    const fileUrl = `/api/files/${uploadedFile.id}`

    console.log('File uploaded successfully:', {
      fileId: uploadedFile.id,
      fileName: fileName,
      fileUrl: fileUrl
    })

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
