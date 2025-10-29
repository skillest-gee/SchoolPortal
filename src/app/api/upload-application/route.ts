import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadFileToS3, generateS3FileName, getFileCategory } from '@/lib/s3-storage'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for applications

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const userId = formData.get('userId') as string

    console.log('Application upload request:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      type
    })

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Only check file size - no type restrictions for applications
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const uploadUserId = userId || 'anonymous'
    const s3FileName = generateS3FileName(file.name, uploadUserId, type || 'document')
    
    console.log('Uploading application file:', {
      fileName: s3FileName,
      contentType: file.type,
      size: file.size,
      hasS3Credentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
    })

    let s3Key: string | null = null
    
    // Try to upload to S3 if credentials are available
    try {
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET_NAME) {
        s3Key = await uploadFileToS3(
          buffer,
          s3FileName,
          file.type || 'application/octet-stream',
          getFileCategory(file.name, file.type)
        )
        console.log('File uploaded to S3 successfully:', s3Key)
      } else {
        console.warn('S3 credentials not configured, storing file in database as base64')
      }
    } catch (s3Error) {
      console.warn('S3 upload failed, using database fallback:', s3Error)
      // Continue with database storage if S3 fails
    }

    // Store file metadata in database
    // If S3 is not configured, store file data in base64 as fallback
    const fileData = !s3Key ? buffer.toString('base64') : undefined
    
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: s3FileName,
        originalName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        s3Key: s3Key,
        s3Bucket: process.env.AWS_S3_BUCKET_NAME || null,
        uploadedBy: uploadUserId,
        category: type || 'document',
        fileData: fileData // Store base64 if S3 not available
      }
    })

    const fileUrl = `/api/files/${uploadedFile.id}`

    console.log('Application file uploaded successfully:', {
      fileId: uploadedFile.id,
      s3Key: s3Key,
      fileName: s3FileName
    })

    return NextResponse.json({
      success: true,
      filePath: fileUrl,
      fileName: s3FileName,
      fileId: uploadedFile.id,
      s3Key: s3Key
    })

  } catch (error) {
    console.error('Error uploading application file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
