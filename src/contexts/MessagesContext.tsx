'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  content: string
  senderId: string
  recipientId: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string
    studentId?: string
  }
}

interface MessagesContextType {
  unreadCount: number
  setUnreadCount: (count: number) => void
  markMessageAsRead: (messageId: string) => void
  refreshUnreadCount: () => void
  messages: Message[]
  setMessages: (messages: Message[]) => void
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined)

export function MessagesProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [messages, setMessages] = useState<Message[]>([])

  // Fetch real messages from API
  const fetchMessages = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Flatten all messages from conversations
          const allMessages: Message[] = []
          data.data.forEach((conversation: any) => {
            if (conversation.lastMessage) {
              allMessages.push(conversation.lastMessage)
            }
          })
          setMessages(allMessages)
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setMessages([])
    }
  }

  const calculateUnreadCount = () => {
    const unread = messages.filter(m => !m.isRead).length
    setUnreadCount(unread)
  }

  const markMessageAsRead = (messageId: string) => {
    setMessages(prev => {
      const updatedMessages = prev.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      )
      return updatedMessages
    })
  }

  const refreshUnreadCount = () => {
    fetchMessages()
  }

  useEffect(() => {
    if (session) {
      fetchMessages()
    }
  }, [session])

  useEffect(() => {
    calculateUnreadCount()
  }, [messages])

  return (
    <MessagesContext.Provider value={{
      unreadCount,
      setUnreadCount,
      markMessageAsRead,
      refreshUnreadCount,
      messages: messages || [],
      setMessages
    }}>
      {children}
    </MessagesContext.Provider>
  )
}

export function useMessages() {
  const context = useContext(MessagesContext)
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessagesProvider')
  }
  return context
}
