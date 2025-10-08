'use client'

import { useEffect, useState } from 'react'
import { Skeleton, DashboardSkeleton, TableSkeleton, ListSkeleton } from './skeleton'
import { cn } from '@/lib/utils'

interface InstantLoadingProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  delay?: number
  className?: string
}

// Shows skeleton immediately, then content when ready
export function InstantLoading({ 
  children, 
  fallback = <DashboardSkeleton />, 
  delay = 0,
  className 
}: InstantLoadingProps) {
  const [showContent, setShowContent] = useState(delay === 0)

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => setShowContent(true), delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  if (!showContent) {
    return <div className={className}>{fallback}</div>
  }

  return <>{children}</>
}

// Optimized loading state that shows skeleton immediately
interface OptimizedLoadingProps {
  isLoading: boolean
  error: string | null
  data: any | null
  loadingText?: string
  errorText?: string
  emptyText?: string
  onRetry?: () => void
  children: React.ReactNode
  className?: string
  skeleton?: React.ReactNode
}

export function OptimizedLoading({ 
  isLoading, 
  error, 
  data, 
  loadingText = 'Loading...', 
  errorText = 'Failed to load data',
  emptyText = 'No data available',
  onRetry, 
  children, 
  className = '',
  skeleton = <DashboardSkeleton />
}: OptimizedLoadingProps) {
  // Show skeleton immediately when loading
  if (isLoading) {
    return <div className={className}>{skeleton}</div>
  }

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-4 p-8', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div className={cn('flex flex-col items-center justify-center space-y-4 p-8', className)}>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No data available</h3>
          <p className="text-gray-600">{emptyText}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Progressive loading - shows partial content as it loads
interface ProgressiveLoadingProps {
  sections: {
    key: string
    isLoading: boolean
    data: any
    component: React.ReactNode
    skeleton: React.ReactNode
  }[]
  className?: string
}

export function ProgressiveLoading({ sections, className }: ProgressiveLoadingProps) {
  return (
    <div className={className}>
      {sections.map(({ key, isLoading, data, component, skeleton }) => (
        <div key={key}>
          {isLoading ? skeleton : (data ? component : null)}
        </div>
      ))}
    </div>
  )
}

