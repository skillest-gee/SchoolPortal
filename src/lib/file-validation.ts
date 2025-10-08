import { z } from 'zod'

// File validation configuration
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  ALLOWED_EXTENSIONS: {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    documents: ['.pdf', '.doc', '.docx', '.txt']
  }
}

// File validation schema
export const fileValidationSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(FILE_CONFIG.MAX_FILE_SIZE, `File size must be less than ${FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`),
  type: z.string().min(1, 'File type is required')
})

// Profile picture validation
export const profilePictureSchema = fileValidationSchema.extend({
  type: z.enum(FILE_CONFIG.ALLOWED_IMAGE_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: 'Only JPEG, PNG, GIF, and WebP images are allowed' })
  })
})

// Document validation
export const documentSchema = fileValidationSchema.extend({
  type: z.enum(FILE_CONFIG.ALLOWED_DOCUMENT_TYPES as [string, ...string[]], {
    errorMap: () => ({ message: 'Only PDF, DOC, DOCX, and TXT files are allowed' })
  })
})

// Assignment submission validation
export const assignmentSubmissionSchema = fileValidationSchema.extend({
  type: z.enum([...FILE_CONFIG.ALLOWED_DOCUMENT_TYPES, ...FILE_CONFIG.ALLOWED_IMAGE_TYPES] as [string, ...string[]], {
    errorMap: () => ({ message: 'Only PDF, DOC, DOCX, TXT, and image files are allowed' })
  })
})

// Validate file type
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

// Validate file size
export function validateFileSize(file: File, maxSize: number = FILE_CONFIG.MAX_FILE_SIZE): boolean {
  return file.size <= maxSize
}

// Validate file extension
export function validateFileExtension(fileName: string, allowedExtensions: string[]): boolean {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return allowedExtensions.includes(extension)
}

// Get file type category
export function getFileCategory(file: File): 'image' | 'document' | 'unknown' {
  if (FILE_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'image'
  } else if (FILE_CONFIG.ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
    return 'document'
  }
  return 'unknown'
}

// Sanitize file name
export function sanitizeFileName(fileName: string): string {
  // Remove special characters and replace spaces with underscores
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

// Generate unique file name
export function generateUniqueFileName(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const sanitizedName = sanitizeFileName(originalName)
  const extension = sanitizedName.substring(sanitizedName.lastIndexOf('.'))
  const nameWithoutExtension = sanitizedName.substring(0, sanitizedName.lastIndexOf('.'))
  
  return `${nameWithoutExtension}_${userId}_${timestamp}${extension}`
}

// Validate file for upload
export function validateFileForUpload(
  file: File, 
  category: 'profile' | 'document' | 'assignment'
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check file size
  if (!validateFileSize(file)) {
    errors.push(`File size must be less than ${FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  // Check file type based on category
  switch (category) {
    case 'profile':
      if (!validateFileType(file, FILE_CONFIG.ALLOWED_IMAGE_TYPES)) {
        errors.push('Only JPEG, PNG, GIF, and WebP images are allowed for profile pictures')
      }
      break
    case 'document':
      if (!validateFileType(file, FILE_CONFIG.ALLOWED_DOCUMENT_TYPES)) {
        errors.push('Only PDF, DOC, DOCX, and TXT files are allowed for documents')
      }
      break
    case 'assignment':
      const allowedTypes = [...FILE_CONFIG.ALLOWED_DOCUMENT_TYPES, ...FILE_CONFIG.ALLOWED_IMAGE_TYPES]
      if (!validateFileType(file, allowedTypes)) {
        errors.push('Only PDF, DOC, DOCX, TXT, and image files are allowed for assignments')
      }
      break
  }

  // Check file name
  if (!file.name || file.name.trim().length === 0) {
    errors.push('File name is required')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
