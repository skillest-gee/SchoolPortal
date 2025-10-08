// Design System Configuration
// Centralized design tokens for consistent UI across the application

export const designSystem = {
  // Color Palette
  colors: {
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    accent: {
      emerald: {
        50: '#ecfdf5',
        100: '#d1fae5',
        200: '#a7f3d0',
        300: '#6ee7b7',
        400: '#34d399',
        500: '#10b981',
        600: '#059669',
        700: '#047857',
        800: '#065f46',
        900: '#064e3b',
      },
      violet: {
        50: '#f5f3ff',
        100: '#ede9fe',
        200: '#ddd6fe',
        300: '#c4b5fd',
        400: '#a78bfa',
        500: '#8b5cf6',
        600: '#7c3aed',
        700: '#6d28d9',
        800: '#5b21b6',
        900: '#4c1d95',
      },
      amber: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
        800: '#92400e',
        900: '#78350f',
      },
      rose: {
        50: '#fff1f2',
        100: '#ffe4e6',
        200: '#fecdd3',
        300: '#fda4af',
        400: '#fb7185',
        500: '#f43f5e',
        600: '#e11d48',
        700: '#be123c',
        800: '#9f1239',
        900: '#881337',
      },
    },
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },

  // Gradients
  gradients: {
    primary: 'from-blue-600 to-blue-700',
    secondary: 'from-slate-600 to-slate-700',
    accent: {
      emerald: 'from-emerald-600 to-emerald-700',
      violet: 'from-violet-600 to-purple-600',
      amber: 'from-amber-600 to-orange-600',
      rose: 'from-rose-600 to-pink-600',
    },
    background: {
      primary: 'from-blue-50 via-white to-blue-50',
      secondary: 'from-slate-50 via-white to-slate-50',
      accent: {
        emerald: 'from-emerald-50 via-white to-emerald-50',
        violet: 'from-violet-50 via-white to-purple-50',
        amber: 'from-amber-50 via-white to-orange-50',
        rose: 'from-rose-50 via-white to-pink-50',
      },
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Border Radius
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Component Variants
  components: {
    card: {
      base: 'bg-white/80 backdrop-blur-sm border-white/20 shadow-lg',
      hover: 'hover:shadow-xl transition-all duration-300',
      interactive: 'hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1',
    },
    button: {
      primary: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg',
      secondary: 'bg-white/50 hover:bg-white/80 border-white/20',
      accent: {
        emerald: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
        violet: 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700',
        amber: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
        rose: 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700',
      },
    },
    badge: {
      success: 'bg-green-100 text-green-800 border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200',
      neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    },
    loading: {
      spinner: 'w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin',
      dualSpinner: 'w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin',
    },
  },

  // Module-specific color schemes
  modules: {
    dashboard: {
      gradient: 'from-blue-50 via-white to-blue-50',
      accent: 'blue',
      primary: 'from-blue-600 to-blue-700',
    },
    assignments: {
      gradient: 'from-emerald-50 via-white to-emerald-50',
      accent: 'emerald',
      primary: 'from-emerald-600 to-emerald-700',
    },
    library: {
      gradient: 'from-amber-50 via-white to-orange-50',
      accent: 'amber',
      primary: 'from-amber-600 to-orange-600',
    },
    timetable: {
      gradient: 'from-emerald-50 via-white to-teal-50',
      accent: 'emerald',
      primary: 'from-emerald-600 to-teal-600',
    },
    communication: {
      gradient: 'from-rose-50 via-white to-pink-50',
      accent: 'rose',
      primary: 'from-rose-600 to-pink-600',
    },
    selfService: {
      gradient: 'from-violet-50 via-white to-purple-50',
      accent: 'violet',
      primary: 'from-violet-600 to-purple-600',
    },
    finance: {
      gradient: 'from-green-50 via-white to-emerald-50',
      accent: 'emerald',
      primary: 'from-green-600 to-emerald-600',
    },
  },
}

// Utility functions for consistent styling
export const getModuleStyles = (module: keyof typeof designSystem.modules) => {
  const moduleConfig = designSystem.modules[module]
  return {
    background: `bg-gradient-to-br ${moduleConfig.gradient}`,
    headerGradient: `bg-gradient-to-r ${moduleConfig.primary} bg-clip-text text-transparent`,
    buttonPrimary: `bg-gradient-to-r ${moduleConfig.primary} hover:from-${moduleConfig.accent}-700 hover:to-${moduleConfig.accent}-800`,
    accentColor: moduleConfig.accent,
  }
}

export const getStatusBadge = (status: string) => {
  const statusMap = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-green-100 text-green-800 border-green-200',
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
    OVERDUE: 'bg-red-100 text-red-800 border-red-200',
    RETURNED: 'bg-blue-100 text-blue-800 border-blue-200',
  }
  return statusMap[status as keyof typeof statusMap] || 'bg-gray-100 text-gray-800 border-gray-200'
}

export const getCategoryColor = (category: string) => {
  const colors = {
    'Computer Science': 'bg-blue-100 text-blue-800',
    'Mathematics': 'bg-green-100 text-green-800',
    'Physics': 'bg-purple-100 text-purple-800',
    'Chemistry': 'bg-orange-100 text-orange-800',
    'Biology': 'bg-pink-100 text-pink-800',
    'Engineering': 'bg-red-100 text-red-800',
    'Business': 'bg-yellow-100 text-yellow-800',
    'Economics': 'bg-indigo-100 text-indigo-800',
    'Literature': 'bg-teal-100 text-teal-800',
    'History': 'bg-gray-100 text-gray-800',
    'Philosophy': 'bg-amber-100 text-amber-800',
    'Psychology': 'bg-rose-100 text-rose-800',
    'Medicine': 'bg-emerald-100 text-emerald-800',
    'Law': 'bg-violet-100 text-violet-800',
    'Art': 'bg-cyan-100 text-cyan-800',
    'Music': 'bg-lime-100 text-lime-800',
    'Other': 'bg-slate-100 text-slate-800'
  }
  return colors[category as keyof typeof colors] || colors['Other']
}

export const getClassTypeColor = (classType: string) => {
  const colors = {
    LECTURE: 'bg-blue-100 text-blue-800 border-blue-200',
    TUTORIAL: 'bg-green-100 text-green-800 border-green-200',
    LAB: 'bg-purple-100 text-purple-800 border-purple-200',
    SEMINAR: 'bg-orange-100 text-orange-800 border-orange-200',
    EXAM: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[classType as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
}
