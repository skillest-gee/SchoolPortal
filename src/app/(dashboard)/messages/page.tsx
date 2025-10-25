'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMessages } from '@/contexts/MessagesContext'

// Use the Message type from MessagesContext
type Message = {
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Mail,
  MailOpen,
  Send,
  User,
  Clock,
  Reply,
  Trash2,
  Star
} from 'lucide-react'
import Loading from '@/components/ui/loading'


export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<'inbox' | 'sent'>('inbox')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true)
      
      // Messages are now loaded from context

      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }

    if (session) {
      loadMessages()
    }
  }, [session])

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

  const { markMessageAsRead, messages = [], setMessages } = useMessages()
  
  const filteredMessages = (messages || []).filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const markAsRead = (messageId: string) => {
    markMessageAsRead(messageId)
  }

  const toggleStar = (messageId: string) => {
    const updatedMessages = (messages || []).map(msg =>
      msg.id === messageId ? { ...msg, isStarred: !(msg as any).isStarred } : msg
    )
    setMessages(updatedMessages)
  }

  const inboxCount = (messages || []).length
  const unreadCount = (messages || []).filter(m => !m.isRead).length
  const sentCount = 0 // Messages context doesn't track sent messages

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
                Messages
              </h1>
              <p className="text-gray-600 mt-1">Communicate with students, lecturers, and administrators</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Compose Message
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inbox</p>
                  <p className="text-2xl font-bold text-gray-900">{inboxCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <MailOpen className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Send className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{sentCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Message List */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Messages</CardTitle>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant={selectedType === 'inbox' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('inbox')}
                    >
                      Inbox
                      {unreadCount > 0 && (
                        <Badge className="ml-2 bg-red-500 text-white text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedType === 'sent' ? 'default' : 'outline'}
                      onClick={() => setSelectedType('sent')}
                    >
                      Sent
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                    />
                  </div>
                </div>

                {/* Message List */}
                <div className="max-h-96 overflow-y-auto">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                        selectedMessage?.id === message.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      } ${!message.isRead ? 'bg-blue-50' : ''}`}
                      onClick={() => {
                        setSelectedMessage(message)
                        if (!message.isRead) markAsRead(message.id)
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className={`text-sm font-medium truncate ${!message.isRead ? 'font-bold' : ''}`}>
                              Message from {message.sender.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {message.sender.name}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {!message.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleStar(message.id)
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Star className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">
                        {formatDate(message.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Message Content */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">Message from {selectedMessage.sender.name}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {selectedMessage.sender.name}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(selectedMessage.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-white shadow-sm">
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a message</h3>
                  <p className="text-gray-600">Choose a message from the list to view its content</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}