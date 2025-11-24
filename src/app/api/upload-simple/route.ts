import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveBufferLocally, sanitizeFileName } from '@/lib/file-upload'
import { withUploadRateLimit } from '@/lib/rate-limit'
import { withMaintenanceCheck } from '@/lib/maintenance'
import { handleAPIError } from '@/lib/api-response'

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

export const POST = withMaintenanceCheck(withUploadRateLimit(POSTHandler));

async function POSTHandler(request: NextRequest) {
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

    // Convert file to buffer and save locally
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadUserId = userId || 'anonymous'
    const safeOriginalName = sanitizeFileName(file.name)
    const category = type || 'document'

    console.log('Saving file locally:', {
      originalName: safeOriginalName,
      contentType: file.type,
      size: file.size,
      userId: uploadUserId,
      category
    })

    const saved = await saveBufferLocally(
      buffer,
      safeOriginalName,
      uploadUserId,
      category,
      file.type || 'application/octet-stream'
    )

    // Store file metadata in database (keep fields for backward compatibility)
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: saved.fileName,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
        s3Key: saved.filePath, // repurpose to store local URL path
        s3Bucket: 'local-filesystem', // marker indicating local storage
        uploadedBy: uploadUserId,
        category
      }
    })

    // Return the file ID and URL for retrieval
    const fileUrl = saved.filePath

    console.log('File saved successfully:', {
      fileId: uploadedFile.id,
      filePath: saved.filePath,
      fileName: saved.fileName,
      fileUrl: fileUrl
    })

    return NextResponse.json({
      success: true,
      filePath: fileUrl,
      fileName: saved.fileName,
      fileId: uploadedFile.id,
      s3Key: saved.filePath
    })

  } catch (error) {
    return handleAPIError(error)
  }
}
