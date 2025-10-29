import toast from 'react-hot-toast'

/**
 * Success toast notification
 */
export function showSuccess(message: string) {
  return toast.success(message, {
    duration: 4000,
  })
}

/**
 * Error toast notification
 */
export function showError(message: string) {
  return toast.error(message, {
    duration: 5000,
  })
}

/**
 * Info toast notification
 */
export function showInfo(message: string) {
  return toast(message, {
    icon: 'ℹ️',
    duration: 4000,
  })
}

/**
 * Warning toast notification
 */
export function showWarning(message: string) {
  return toast(message, {
    icon: '⚠️',
    duration: 4000,
  })
}

/**
 * Loading toast notification (returns dismiss function)
 */
export function showLoading(message: string) {
  return toast.loading(message)
}

/**
 * Promise toast - shows loading, then success/error
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }
) {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      duration: 4000,
    }
  )
}

