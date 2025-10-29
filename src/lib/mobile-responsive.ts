/**
 * Mobile responsive utility classes and helpers
 */

export const mobileClasses = {
  // Layout
  container: 'w-full px-4 sm:px-6 lg:px-8',
  containerFluid: 'w-full px-3 sm:px-4 lg:px-6',
  
  // Typography
  heading: {
    h1: 'text-2xl sm:text-3xl lg:text-4xl font-bold',
    h2: 'text-xl sm:text-2xl lg:text-3xl font-semibold',
    h3: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    h4: 'text-base sm:text-lg lg:text-xl font-medium',
    body: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm',
  },
  
  // Spacing
  section: 'py-4 sm:py-6 lg:py-8',
  sectionSmall: 'py-3 sm:py-4 lg:py-6',
  
  // Grids
  grid: {
    auto: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    two: 'grid grid-cols-1 sm:grid-cols-2',
    three: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    four: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  },
  
  // Cards
  card: 'p-4 sm:p-6',
  cardSmall: 'p-3 sm:p-4',
  
  // Buttons
  buttonGroup: 'flex flex-col sm:flex-row gap-2 sm:gap-3',
  buttonFullWidth: 'w-full sm:w-auto',
  
  // Tables
  tableWrapper: 'overflow-x-auto -mx-4 sm:mx-0',
  table: 'min-w-full divide-y divide-gray-200',
  tableMobile: 'block sm:table',
  
  // Forms
  formGroup: 'space-y-4 sm:space-y-6',
  formRow: 'flex flex-col sm:flex-row gap-4 sm:gap-6',
  formInput: 'w-full',
  
  // Modals/Dialogs
  modal: 'w-full max-w-sm sm:max-w-md lg:max-w-lg mx-4',
  modalFull: 'w-full h-full sm:h-auto sm:max-w-lg sm:rounded-lg',
  
  // Navigation
  navItem: 'w-full sm:w-auto',
  navMobile: 'flex flex-col sm:flex-row',
  
  // Visibility
  hideMobile: 'hidden sm:block',
  showMobile: 'block sm:hidden',
  hideTablet: 'hidden lg:block',
  showTablet: 'block lg:hidden',
}

/**
 * Mobile-first breakpoints
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

/**
 * Get responsive value based on breakpoint
 */
export function getResponsiveValue<T>(values: {
  mobile: T
  tablet?: T
  desktop?: T
}): string {
  return `${values.mobile} ${values.tablet ? `sm:${values.tablet}` : ''} ${values.desktop ? `lg:${values.desktop}` : ''}`
}

/**
 * Truncate text on mobile, full on desktop
 */
export function truncateText(length: { mobile: number; desktop?: number }): string {
  return `truncate ${length.desktop ? `lg:max-w-${length.desktop}` : ''}`
}

