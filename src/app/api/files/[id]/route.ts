import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSignedFileUrl } from '@/lib/s3-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fileId = params.id

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 })
    }

    // Find the file in the database
    const file = await prisma.uploadedFile.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Check if file is stored in S3 or database
    if (file.s3Key && file.s3Bucket !== 'temp-storage') {
      // Generate signed URL for S3 file
      const signedUrl = await getSignedFileUrl(file.s3Key, 3600) // 1 hour expiry
      return NextResponse.redirect(signedUrl)
    } else if (file.fileData) {
      // Fallback to base64 data for existing files
      const buffer = Buffer.from(file.fileData, 'base64')
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': file.fileType,
          'Content-Length': file.fileSize.toString(),
          'Content-Disposition': `inline; filename="${file.originalName}"`,
          'Cache-Control': 'public, max-age=31536000',
        },
      })
    } else {
      return NextResponse.json({ error: 'File data not found' }, { status: 404 })
    }

  } catch (error) {
    console.error('Error retrieving file:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    )
  }
}
