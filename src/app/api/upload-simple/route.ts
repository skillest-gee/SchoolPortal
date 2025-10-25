import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFileToS3, generateS3FileName, getFileCategory } from '@/lib/s3-storage'

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

    // Convert file to buffer and upload to S3
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const uploadUserId = userId || 'anonymous'
    const s3FileName = generateS3FileName(file.name, uploadUserId, type || 'document')
    
    console.log('Uploading file to S3:', {
      fileName: s3FileName,
      contentType: file.type,
      size: file.size
    })

    const s3Key = await uploadFileToS3(
      buffer,
      s3FileName,
      file.type || 'application/octet-stream',
      getFileCategory(file.name, file.type)
    )

    // Store file metadata in database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: s3FileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        s3Key: s3Key,
        s3Bucket: process.env.AWS_S3_BUCKET_NAME || 'school-portal-files',
        uploadedBy: uploadUserId,
        category: type || 'document'
      }
    })

    // Return the file ID and URL for retrieval
    const fileUrl = `/api/files/${uploadedFile.id}`

    console.log('File uploaded successfully:', {
      fileId: uploadedFile.id,
      s3Key: s3Key,
      fileName: s3FileName,
      fileUrl: fileUrl
    })

    return NextResponse.json({
      success: true,
      filePath: fileUrl,
      fileName: s3FileName,
      fileId: uploadedFile.id,
      s3Key: s3Key
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
