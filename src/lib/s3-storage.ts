import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'school-portal-files'

// File upload to S3
export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<string> {
  try {
    const key = `${folder}/${fileName}`
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: 'private', // Private files
    })

    await s3Client.send(command)
    
    // Return the S3 key for database storage
    return key
  } catch (error) {
    console.error('Error uploading to S3:', error)
    throw new Error('Failed to upload file to S3')
  }
}

// Generate signed URL for file access
export async function getSignedFileUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return signedUrl
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error('Failed to generate file URL')
  }
}

// Delete file from S3
export async function deleteFileFromS3(s3Key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    await s3Client.send(command)
  } catch (error) {
    console.error('Error deleting from S3:', error)
    throw new Error('Failed to delete file from S3')
  }
}

// Generate unique filename
export function generateS3FileName(originalName: string, userId: string, category: string): string {
  const timestamp = Date.now()
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const extension = originalName.substring(originalName.lastIndexOf('.'))
  
  return `${category}/${userId}/${timestamp}_${sanitizedName}${extension}`
}

// File type detection
export function getFileCategory(fileName: string, contentType: string): string {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
    return 'images'
  } else if (['.pdf', '.doc', '.docx', '.txt'].includes(extension)) {
    return 'documents'
  } else if (contentType.startsWith('image/')) {
    return 'images'
  } else if (contentType.includes('pdf') || contentType.includes('document')) {
    return 'documents'
  }
  
  return 'files'
}
