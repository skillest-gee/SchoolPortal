'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Wifi, 
  WifiOff,
  Clock,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseApiError, getUserFriendlyMessage } from '@/lib/error-handling'

interface DataLoaderProps<T> {
  url: string | null
  children: (data: T, index?: number) => React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: (error: string, retry: () => void) => React.ReactNode
  loadingFallback?: React.ReactNode
  emptyFallback?: React.ReactNode
  retries?: number
  retryDelay?: number
  timeout?: number
  cacheKey?: string
  cacheTtl?: number
  onSuccess?: (data: T) => void
  onError?: (error: string) => void
  className?: string
  showRetryButton?: boolean
  autoRetry?: boolean
  autoRetryDelay?: number
}

interface DataLoaderState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retryCount: number
  lastFetch: number | null
}

export function DataLoader<T>({
  url,
  children,
  fallback,
  errorFallback,
  loadingFallback,
  emptyFallback,
  retries = 3,
  retryDelay = 1000,
  timeout = 10000,
  cacheKey,
  cacheTtl = 5 * 60 * 1000,
  onSuccess,
  onError,
  className = '',
  showRetryButton = true,
  autoRetry = false,
  autoRetryDelay = 30000
}: DataLoaderProps<T>) {
  const [state, setState] = useState<DataLoaderState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
    lastFetch: null
  })

  const [isOnline, setIsOnline] = useState(true)

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!url || !isOnline) return

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null 
    }))

    try {
      const result = await fetch(url)

      if (result.ok) {
        const data = await result.json()
        setState(prev => ({
          ...prev,
          data: data,
          error: null,
          loading: false,
          retryCount: 0,
          lastFetch: Date.now()
        }))

        if (onSuccess) {
          onSuccess(data)
        }
      } else {
        const error = await result.text()
        setState(prev => ({
          ...prev,
          data: null,
          error: error,
          loading: false,
          retryCount: prev.retryCount + 1,
          lastFetch: Date.now()
        }))

        if (onError) {
          onError(error)
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        retryCount: prev.retryCount + 1
      }))

      if (onError) {
        onError(errorMessage)
      }
    }
  }, [url, isOnline, retries, retryDelay, timeout, onSuccess, onError])

  // Auto-retry on error
  useEffect(() => {
    if (autoRetry && state.error && state.retryCount < retries) {
      const timer = setTimeout(() => {
        fetchData()
      }, autoRetryDelay)

      return () => clearTimeout(timer)
    }
  }, [autoRetry, state.error, state.retryCount, retries, autoRetryDelay, fetchData])

  // Initial fetch
  useEffect(() => {
    if (url) {
      fetchData()
    }
  }, [url, fetchData])

  // Handle retry
  const handleRetry = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Loading state
  if (state.loading && !state.data) {
    if (loadingFallback) {
      return <>{loadingFallback}</>
    }

    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <div className="absolute inset-0 h-8 w-8 border-2 border-blue-200 rounded-full animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-900">Loading data...</p>
            <p className="text-xs text-gray-500 mt-1">Please wait while we fetch your information</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (state.error) {
    if (errorFallback) {
      return <>{errorFallback(state.error, handleRetry)}</>
    }

    return (
      <div className={cn("p-6", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium">Failed to load data</p>
              <p className="text-sm mt-1">{state.error}</p>
              {state.retryCount > 0 && (
                <p className="text-xs mt-1 text-gray-500">
                  Retry attempt {state.retryCount} of {retries}
                </p>
              )}
            </div>
            {showRetryButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={state.loading}
                className="ml-4"
              >
                {state.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Offline state
  if (!isOnline) {
    return (
      <div className={cn("p-6", className)}>
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">You're offline</p>
                <p className="text-sm mt-1">Please check your internet connection</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-4"
              >
                <Wifi className="h-4 w-4 mr-2" />
                Check Connection
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty state
  if (state.data === null || (Array.isArray(state.data) && state.data.length === 0)) {
    if (emptyFallback) {
      return <>{emptyFallback}</>
    }

    return (
      <div className={cn("p-8 text-center", className)}>
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">No data available</h3>
            <p className="text-sm text-gray-500 mt-1">
              There's no data to display at the moment
            </p>
          </div>
          {showRetryButton && (
            <Button variant="outline" onClick={handleRetry}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className={className}>
      {children(state.data)}
    </div>
  )
}

// Specialized loaders for common use cases
export function CardDataLoader<T>({
  title,
  url,
  children,
  ...props
}: DataLoaderProps<T> & { title: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <DataLoader url={url} {...props}>
            {(data) => (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Loaded</span>
              </div>
            )}
          </DataLoader>
        </div>
        <DataLoader url={url} {...props}>
          {children}
        </DataLoader>
      </CardContent>
    </Card>
  )
}

export function ListDataLoader<T>({
  url,
  children,
  emptyMessage = "No items found",
  ...props
}: DataLoaderProps<T[]> & { 
  emptyMessage?: string
  children: (item: T, index: number) => React.ReactNode
}) {
  return (
    <DataLoader
      url={url}
      emptyFallback={
        <div className="text-center py-8">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      }
      {...props}
    >
      {(data) => (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index}>
              {children(item, index)}
            </div>
          ))}
        </div>
      )}
    </DataLoader>
  )
}

export function GridDataLoader<T>({
  url,
  children,
  emptyMessage = "No items found",
  className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  ...props
}: DataLoaderProps<T[]> & { 
  emptyMessage?: string
  className?: string
  children: (item: T, index: number) => React.ReactNode
}) {
  return (
    <DataLoader
      url={url}
      emptyFallback={
        <div className="text-center py-8">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      }
      {...props}
    >
      {(data) => (
        <div className={className}>
          {data.map((item, index) => (
            <div key={index}>
              {children(item, index)}
            </div>
          ))}
        </div>
      )}
    </DataLoader>
  )
}
