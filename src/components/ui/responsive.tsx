'use client'

import { cn } from '@/lib/utils'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function ResponsiveContainer({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  padding = 'lg'
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  const paddingClasses = {
    none: '',
    sm: 'px-3 sm:px-4',
    md: 'px-4 sm:px-6',
    lg: 'px-4 sm:px-6 lg:px-8'
  }

  return (
    <div className={cn(
      'mx-auto w-full',
      maxWidthClasses[maxWidth],
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: 'sm' | 'md' | 'lg'
}

export function ResponsiveGrid({ 
  children, 
  className = '', 
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md'
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6'
  }

  const responsiveCols = [
    cols.default ? gridCols[cols.default as keyof typeof gridCols] : 'grid-cols-1',
    cols.sm ? `sm:${gridCols[cols.sm as keyof typeof gridCols]}` : '',
    cols.md ? `md:${gridCols[cols.md as keyof typeof gridCols]}` : '',
    cols.lg ? `lg:${gridCols[cols.lg as keyof typeof gridCols]}` : '',
    cols.xl ? `xl:${gridCols[cols.xl as keyof typeof gridCols]}` : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={cn(
      'grid',
      responsiveCols,
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: React.ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  responsive?: boolean
}

export function ResponsiveText({ 
  children, 
  className = '', 
  size = 'base',
  weight = 'normal',
  responsive = true
}: ResponsiveTextProps) {
  const sizeClasses = {
    xs: responsive ? 'text-xs sm:text-sm' : 'text-xs',
    sm: responsive ? 'text-sm sm:text-base' : 'text-sm',
    base: responsive ? 'text-sm sm:text-base' : 'text-base',
    lg: responsive ? 'text-base sm:text-lg' : 'text-lg',
    xl: responsive ? 'text-lg sm:text-xl' : 'text-xl',
    '2xl': responsive ? 'text-xl sm:text-2xl' : 'text-2xl',
    '3xl': responsive ? 'text-2xl sm:text-3xl' : 'text-3xl',
    '4xl': responsive ? 'text-3xl sm:text-4xl' : 'text-4xl',
    '5xl': responsive ? 'text-4xl sm:text-5xl' : 'text-5xl',
    '6xl': responsive ? 'text-5xl sm:text-6xl' : 'text-6xl'
  }

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  }

  return (
    <span className={cn(
      sizeClasses[size],
      weightClasses[weight],
      className
    )}>
      {children}
    </span>
  )
}

interface ResponsiveSpacingProps {
  children: React.ReactNode
  className?: string
  padding?: {
    default?: string
    sm?: string
    md?: string
    lg?: string
  }
  margin?: {
    default?: string
    sm?: string
    md?: string
    lg?: string
  }
}

export function ResponsiveSpacing({ 
  children, 
  className = '',
  padding,
  margin
}: ResponsiveSpacingProps) {
  const paddingClasses = padding ? [
    padding.default || '',
    padding.sm ? `sm:${padding.sm}` : '',
    padding.md ? `md:${padding.md}` : '',
    padding.lg ? `lg:${padding.lg}` : ''
  ].filter(Boolean).join(' ') : ''

  const marginClasses = margin ? [
    margin.default || '',
    margin.sm ? `sm:${margin.sm}` : '',
    margin.md ? `md:${margin.md}` : '',
    margin.lg ? `lg:${margin.lg}` : ''
  ].filter(Boolean).join(' ') : ''

  return (
    <div className={cn(
      paddingClasses,
      marginClasses,
      className
    )}>
      {children}
    </div>
  )
}

// Mobile-specific utilities
export const mobileUtils = {
  // Hide on mobile, show on larger screens
  hideOnMobile: 'hidden sm:block',
  // Show on mobile, hide on larger screens  
  showOnMobile: 'block sm:hidden',
  // Mobile-first responsive text
  mobileText: {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    base: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
    '2xl': 'text-xl sm:text-2xl',
    '3xl': 'text-2xl sm:text-3xl'
  },
  // Mobile-first responsive spacing
  mobileSpacing: {
    xs: 'p-2 sm:p-3',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  },
  // Mobile-first responsive gaps
  mobileGap: {
    xs: 'gap-2 sm:gap-3',
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8'
  }
}
