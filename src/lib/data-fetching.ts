'use client'

import { parseApiError, getUserFriendlyMessage } from './error-handling'

export interface FetchOptions {
  retries?: number
  retryDelay?: number
  timeout?: number
  signal?: AbortSignal
}

export interface FetchResult<T> {
  data: T | null
  error: string | null
  loading: boolean
  refetch: () => Promise<void>
}

/**
 * Enhanced fetch function with retry logic, timeout, and error handling
 */
export async function enhancedFetch<T>(
  url: string,
  options: RequestInit & FetchOptions = {}
): Promise<{ data: T | null; error: string | null }> {
  const {
    retries = 3,
    retryDelay = 1000,
    timeout = 10000,
    signal,
    ...fetchOptions
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create timeout signal
      const timeoutController = new AbortController()
      const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

      // Combine signals if provided
      const combinedSignal = signal 
        ? AbortSignal.any([signal, timeoutController.signal])
        : timeoutController.signal

      const response = await fetch(url, {
        ...fetchOptions,
        signal: combinedSignal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const apiError = parseApiError({
          message: errorData.error || `HTTP ${response.status}`,
          statusCode: response.status
        })
        throw new Error(getUserFriendlyMessage(apiError))
      }

      const data = await response.json()
      return { data: data.data || data, error: null }

    } catch (error) {
      lastError = error as Error
      
      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out')
        }
        if (error.message.includes('HTTP 4')) {
          // Don't retry client errors
          throw error
        }
      }

      // Wait before retrying (except on last attempt)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error('Request failed after all retries')
}

/**
 * Hook for data fetching with loading states and error handling
 */
export function useDataFetch<T>(
  url: string | null,
  options: FetchOptions = {}
) {
  const [state, setState] = useState<FetchResult<T>>({
    data: null,
    error: null,
    loading: false,
    refetch: async () => {}
  })

  const fetchData = useCallback(async () => {
    if (!url) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await enhancedFetch<T>(url, options)
      setState(prev => ({
        ...prev,
        data,
        error,
        loading: false
      }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      }))
    }
  }, [url, JSON.stringify(options)])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    ...state,
    refetch: fetchData
  }
}

/**
 * Utility for handling API responses with consistent error handling
 */
export async function handleApiResponse<T>(
  response: Response,
  errorMessage = 'Request failed'
): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const apiError = parseApiError({
      message: errorData.error || errorMessage,
      statusCode: response.status
    })
    throw new Error(getUserFriendlyMessage(apiError))
  }

  const data = await response.json()
  return data.data || data
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }

      // Don't retry on client errors
      if (error instanceof Error && error.message.includes('HTTP 4')) {
        throw error
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Debounced fetch function
 */
export function createDebouncedFetch<T>(
  delay = 300
) {
  let timeoutId: NodeJS.Timeout

  return (url: string, options: RequestInit & FetchOptions = {}) => {
    return new Promise<{ data: T | null; error: string | null }>((resolve, reject) => {
      clearTimeout(timeoutId)
      
      timeoutId = setTimeout(async () => {
        try {
          const result = await enhancedFetch<T>(url, options)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}

/**
 * Cache for API responses
 */
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

export const apiCache = new ApiCache()

/**
 * Cached fetch function
 */
export async function cachedFetch<T>(
  url: string,
  options: RequestInit & FetchOptions & { cacheKey?: string; cacheTtl?: number } = {}
): Promise<{ data: T | null; error: string | null }> {
  const { cacheKey = url, cacheTtl = 5 * 60 * 1000, ...fetchOptions } = options

  // Check cache first
  const cached = apiCache.get(cacheKey)
  if (cached) {
    return { data: cached, error: null }
  }

  // Fetch from API
  const result = await enhancedFetch<T>(url, fetchOptions)
  
  // Cache successful results
  if (result.data && !result.error) {
    apiCache.set(cacheKey, result.data, cacheTtl)
  }

  return result
}

// Import React hooks
import { useState, useEffect, useCallback } from 'react'
