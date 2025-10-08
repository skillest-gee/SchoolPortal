'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface FastNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  prefetch?: boolean
  onClick?: () => void
}

export function FastNavLink({ 
  href, 
  children, 
  className, 
  prefetch = true,
  onClick 
}: FastNavLinkProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  // Prefetch the route on hover
  const handleMouseEnter = useCallback(() => {
    if (prefetch) {
      router.prefetch(href)
    }
  }, [href, prefetch, router])

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsNavigating(true)
    
    if (onClick) {
      onClick()
    }
    
    // Use router.push for faster navigation
    router.push(href)
    
    // Reset navigation state after a short delay
    setTimeout(() => setIsNavigating(false), 100)
  }, [href, onClick, router])

  return (
    <Button
      variant="ghost"
      className={cn(
        'transition-all duration-150',
        isNavigating && 'opacity-75 scale-95',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
    >
      {children}
    </Button>
  )
}

// Fast navigation hook for programmatic navigation
export function useFastNavigation() {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const navigate = useCallback((href: string, options?: { replace?: boolean }) => {
    setIsNavigating(true)
    
    if (options?.replace) {
      router.replace(href)
    } else {
      router.push(href)
    }
    
    // Reset navigation state
    setTimeout(() => setIsNavigating(false), 100)
  }, [router])

  const prefetch = useCallback((href: string) => {
    router.prefetch(href)
  }, [router])

  return {
    navigate,
    prefetch,
    isNavigating
  }
}

// Prefetch manager for common routes
export function usePrefetchManager() {
  const router = useRouter()

  const prefetchCommonRoutes = useCallback((userRole: string) => {
    const commonRoutes = [
      `/${userRole.toLowerCase()}/dashboard`,
      `/${userRole.toLowerCase()}/courses`,
      `/${userRole.toLowerCase()}/assignments`,
      `/${userRole.toLowerCase()}/messages`,
      '/notifications',
      '/announcements'
    ]

    // Prefetch routes after a short delay to not block initial load
    setTimeout(() => {
      commonRoutes.forEach(route => {
        router.prefetch(route)
      })
    }, 1000)
  }, [router])

  return { prefetchCommonRoutes }
}

