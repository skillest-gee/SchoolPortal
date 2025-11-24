import fs from 'fs'
import path from 'path'

// Local filesystem-based storage replacing S3 while preserving the same API
const PUBLIC_UPLOADS = path.join(process.cwd(), 'public', 'uploads')

function ensureDir(dir: string) {
  return fs.promises.mkdir(dir, { recursive: true })
}

// File upload (local)
export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string,
  folder: string = 'uploads'
): Promise<string> {
  const targetDir = path.join(PUBLIC_UPLOADS, folder)
  await ensureDir(targetDir)

  const targetPath = path.join(targetDir, fileName)
  await fs.promises.writeFile(targetPath, file)

  // Sidecar meta for contentType
  try { await fs.promises.writeFile(`${targetPath}.meta`, JSON.stringify({ contentType }), 'utf8') } catch {}

  // Return web-accessible path
  const webPath = `/uploads/${folder}/${encodeURIComponent(fileName)}`
  return webPath
}

// Generate web URL (no signing needed for local files)
export async function getSignedFileUrl(s3Key: string, _expiresIn: number = 3600): Promise<string> {
  if (s3Key.startsWith('/uploads/')) return s3Key
  return `/uploads/${s3Key.replace(/^\/*/, '')}`
}

// Delete local file
export async function deleteFileFromS3(s3Key: string): Promise<void> {
  const rel = s3Key.startsWith('/uploads/') ? s3Key.replace('/uploads/', '') : s3Key
  const filePath = path.join(PUBLIC_UPLOADS, rel)
  try {
    await fs.promises.unlink(filePath)
    // Delete meta if exists
    try { await fs.promises.unlink(`${filePath}.meta`) } catch {}
  } catch (error) {
    console.error('Error deleting local file:', error)
    throw new Error('Failed to delete local file')
  }
}

// Generate unique filename compatible with prior usage
export function generateS3FileName(originalName: string, userId: string, category: string): string {
  const timestamp = Date.now()
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  const extensionIndex = sanitizedName.lastIndexOf('.')
  const extension = extensionIndex >= 0 ? sanitizedName.substring(extensionIndex) : ''
  const base = extensionIndex >= 0 ? sanitizedName.substring(0, extensionIndex) : sanitizedName
  return `${category}/${userId}/${timestamp}_${base}${extension}`
}

// File type detection (unchanged)
export function getFileCategory(fileName: string, contentType: string): string {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) return 'images'
  if (['.pdf', '.doc', '.docx', '.txt'].includes(extension)) return 'documents'
  if (contentType.startsWith('image/')) return 'images'
  if (contentType.includes('pdf') || contentType.includes('document')) return 'documents'
  return 'files'
}
