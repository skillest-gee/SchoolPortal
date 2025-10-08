'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Hook for optimizing page performance
export function usePerformanceOptimization() {
  const router = useRouter()
  const prefetchedRoutes = useRef(new Set<string>())

  // Prefetch route on hover
  const prefetchOnHover = useCallback((href: string) => {
    if (!prefetchedRoutes.current.has(href)) {
      router.prefetch(href)
      prefetchedRoutes.current.add(href)
    }
  }, [router])

  // Optimize images
  const optimizeImage = useCallback((src: string) => {
    // Add WebP format preference
    if (src.includes('.')) {
      const [name, ext] = src.split('.')
      return `${name}.webp`
    }
    return src
  }, [])

  // Debounce function for search
  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }, [])

  // Throttle function for scroll events
  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }, [])

  return {
    prefetchOnHover,
    optimizeImage,
    debounce,
    throttle
  }
}

// Hook for managing loading states efficiently
export function useOptimizedLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false
  }, [loadingStates])

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev }
      delete newState[key]
      return newState
    })
  }, [])

  return {
    setLoading,
    isLoading,
    clearLoading,
    loadingStates
  }
}

// Hook for caching API responses
export function useApiCache() {
  const cache = useRef(new Map<string, { data: any; timestamp: number }>())
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const getCachedData = useCallback((key: string) => {
    const cached = cache.current.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [])

  const setCachedData = useCallback((key: string, data: any) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    })
  }, [])

  const clearCache = useCallback((key?: string) => {
    if (key) {
      cache.current.delete(key)
    } else {
      cache.current.clear()
    }
  }, [])

  return {
    getCachedData,
    setCachedData,
    clearCache
  }
}
