'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Send, Search, User, Clock, Mail, Users } from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Message {
  id: string
  senderId: string
  recipientId: string
  subject: string
  content: string
  isRead: boolean
  createdAt: string
  updatedAt: string
  sender: {
    id: string
    name: string
    email: string
    role: string
  }
  recipient: {
    id: string
    name: string
    email: string
    role: string
  }
}

export default function AdminMessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    loadMessages()
  }, [session, status, router])

  const loadMessages = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setMessages(data.data || [])
        } else {
          setError('Failed to load messages')
        }
      } else {
        setError('Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const unreadCount = messages.filter(message => !message.isRead).length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH'
      })
      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isRead: true } : msg
        ))
      }
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return 'bg-green-100 text-green-800'
      case 'LECTURER':
        return 'bg-blue-100 text-blue-800'
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading messages..." />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="h-8 w-8 mr-3 text-blue-600" />
            Admin Messages
          </h1>
          <p className="text-gray-600 mt-2">Communicate with students, lecturers, and staff</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Messages List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Inbox
                    {unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {unreadCount}
                      </Badge>
                    )}
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/messages/compose')}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Compose
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/admin/announcements')}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Announce
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Messages */}
                <div className="space-y-2">
                  {error ? (
                    <div className="text-center py-4">
                      <p className="text-red-500 mb-2">{error}</p>
                      <Button size="sm" onClick={loadMessages}>
                        Retry
                      </Button>
                    </div>
                  ) : filteredMessages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No messages found</p>
                  ) : (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'bg-blue-50 border border-blue-200'
                            : message.isRead
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-blue-50 hover:bg-blue-100'
                        }`}
                        onClick={() => {
                          setSelectedMessage(message)
                          if (!message.isRead) markAsRead(message.id)
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className={`text-sm font-medium truncate ${
                                message.isRead ? 'text-gray-900' : 'text-blue-900'
                              }`}>
                                {message.sender.name}
                              </p>
                              <Badge className={`text-xs ${getRoleColor(message.sender.role)}`}>
                                {message.sender.role}
                              </Badge>
                              {!message.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                            <p className={`text-sm truncate ${
                              message.isRead ? 'text-gray-600' : 'text-blue-700'
                            }`}>
                              {message.subject}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {message.content.substring(0, 50)}...
                            </p>
                          </div>
                          <div className="text-xs text-gray-400 ml-2">
                            {formatDate(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Content */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          From: {selectedMessage.sender.name}
                        </div>
                        <Badge className={`text-xs ${getRoleColor(selectedMessage.sender.role)}`}>
                          {selectedMessage.sender.role}
                        </Badge>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(selectedMessage.createdAt)}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(`/messages/compose?reply=${selectedMessage.id}`)}
                    >
                      Reply
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a message to view its content</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
