import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Convert file to base64 for storage in database
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Data = buffer.toString('base64')

    // Generate filename
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uploadUserId = userId || 'anonymous'
    const fileName = `${sanitizedName}_${uploadUserId}_${timestamp}`

    // Store file in database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: fileName,
        originalName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileData: base64Data,
        uploadedBy: uploadUserId,
        category: type || 'document'
      }
    })

    const fileUrl = `/api/files/${uploadedFile.id}`

    console.log('Application file uploaded successfully:', {
      fileId: uploadedFile.id,
      fileName: fileName
    })

    return NextResponse.json({
      success: true,
      filePath: fileUrl,
      fileName: fileName,
      fileId: uploadedFile.id
    })

  } catch (error) {
    console.error('Error uploading application file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
