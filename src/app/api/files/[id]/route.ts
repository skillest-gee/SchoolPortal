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

    // Generate signed URL for S3 file
    if (file.s3Key) {
      const signedUrl = await getSignedFileUrl(file.s3Key, 3600) // 1 hour expiry
      return NextResponse.redirect(signedUrl)
    } else {
      return NextResponse.json({ error: 'File not found in storage' }, { status: 404 })
    }

  } catch (error) {
    console.error('Error retrieving file:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve file' },
      { status: 500 }
    )
  }
}
