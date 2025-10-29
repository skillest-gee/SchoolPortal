'use client'

import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { MessagesProvider } from '@/contexts/MessagesContext'
import { ToastProvider } from '@/components/ui/toast-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <SessionProvider 
      refetchInterval={0} // Disable automatic refetch
      refetchOnWindowFocus={false} // Disable refetch on window focus
    >
      <QueryClientProvider client={queryClient}>
        <MessagesProvider>
          <ToastProvider />
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </MessagesProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
