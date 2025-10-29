'use client'

import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormFieldErrorProps {
  error?: string
  className?: string
}

/**
 * Displays form field error message with icon
 */
export function FormFieldError({ error, className }: FormFieldErrorProps) {
  if (!error) return null

  return (
    <div className={cn('flex items-center gap-1 mt-1 text-sm text-red-600', className)}>
      <AlertCircle className="h-3 w-3 flex-shrink-0" />
      <span>{error}</span>
    </div>
  )
}

