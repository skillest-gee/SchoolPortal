'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'

interface FileUploadProps {
  onUploadSuccess: (fileUrl: string, fileName: string) => void
  onUploadError?: (error: string) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

interface UploadedFile {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

export default function FileUpload({ 
  onUploadSuccess, 
  onUploadError,
  accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif",
  maxSize = 10,
  className = "",
  disabled = false
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (disabled) return

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      const errorMsg = `File size too large. Maximum size is ${maxSize}MB.`
      setError(errorMsg)
      onUploadError?.(errorMsg)
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      if (result.success) {
        const fileData = {
          fileName: result.fileName,
          fileUrl: result.filePath,
          fileSize: file.size,
          fileType: file.type
        }
        setUploadedFile(fileData)
        onUploadSuccess(result.filePath, result.fileName)
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed'
      setError(errorMsg)
      onUploadError?.(errorMsg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Uploading file...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center space-y-2">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <p className="text-sm font-medium text-green-600">File uploaded successfully</p>
            <p className="text-xs text-gray-500">{uploadedFile.fileName}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div className="text-sm text-gray-600">
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-500">
                {accept} (max {maxSize}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded File Info */}
      {uploadedFile && (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">{uploadedFile.fileName}</p>
              <p className="text-xs text-green-600">{formatFileSize(uploadedFile.fileSize)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeFile}
            className="text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Upload Button */}
      {!uploadedFile && !isUploading && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Choose File
        </Button>
      )}
    </div>
  )
}
