import { designSystem } from '@/lib/design-system'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Alert, AlertDescription } from './alert'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dual' | 'dots'
  className?: string
}

export default function Loading({ 
  message = 'Loading...', 
  size = 'md', 
  variant = 'dual',
  className = ''
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl'
  }

  if (variant === 'dual') {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <div className="relative">
          <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
          <div className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-t-blue-600 rounded-full animate-spin`} 
               style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className={`font-medium text-gray-600 ${textSizeClasses[size]}`}>{message}</p>
      </div>
    )
  }

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <div className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
        <p className={`font-medium text-gray-600 ${textSizeClasses[size]}`}>{message}</p>
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className={`flex flex-col items-center space-y-4 ${className}`}>
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className={`font-medium text-gray-600 ${textSizeClasses[size]}`}>{message}</p>
      </div>
    )
  }

  return null
}

// Error state component
interface ErrorStateProps {
  error: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className = '' }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-4 p-8 ${className}`}>
      <AlertCircle className="h-12 w-12 text-red-500" />
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </div>
  )
}

// Loading state wrapper
interface LoadingStateProps {
  isLoading: boolean
  error: string | null
  data: any | null
  loadingText?: string
  errorText?: string
  emptyText?: string
  onRetry?: () => void
  children: React.ReactNode
  className?: string
}

export function LoadingState({ 
  isLoading, 
  error, 
  data, 
  loadingText = 'Loading...', 
  errorText = 'Failed to load data',
  emptyText = 'No data available',
  onRetry, 
  children, 
  className = '' 
}: LoadingStateProps) {
  if (isLoading) {
    return <Loading message={loadingText} className={className} />
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} className={className} />
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className={`flex flex-col items-center justify-center space-y-4 p-8 ${className}`}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">{emptyText}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Error alert component
export function ErrorAlert({ error, onRetry, className = '' }: ErrorStateProps) {
  return (
    <Alert className={`border-red-200 bg-red-50 ${className}`}>
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="ml-4">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}
