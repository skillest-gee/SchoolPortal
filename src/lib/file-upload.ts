import fs from 'fs'
import path from 'path'

export interface UploadResult {
  filePath: string // server path like /uploads/...
  localPath: string // absolute path on disk
  fileName: string
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

export async function saveBufferLocally(
  buffer: Buffer,
  originalName: string,
  userId: string,
  category: string,
  contentType?: string
): Promise<UploadResult> {
  const baseDir = path.join(process.cwd(), 'public', 'uploads', userId || 'anonymous', category || 'document')
  await fs.promises.mkdir(baseDir, { recursive: true })

  const timestamp = Date.now()
  const safeName = sanitizeFileName(originalName)
  const fileName = `${timestamp}-${safeName}`
  const localPath = path.join(baseDir, fileName)

  await fs.promises.writeFile(localPath, buffer)

  // Optionally write a small sidecar file with contentType
  if (contentType) {
    try { await fs.promises.writeFile(`${localPath}.meta`, JSON.stringify({ contentType }), 'utf8') } catch {}
  }

  const filePath = `/uploads/${encodeURIComponent(userId || 'anonymous')}/${encodeURIComponent(category || 'document')}/${encodeURIComponent(fileName)}`

  return { filePath, localPath, fileName }
}