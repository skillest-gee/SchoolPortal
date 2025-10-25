'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMessages } from '@/contexts/MessagesContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Send, Users, Search, ArrowLeft } from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Student {
  id: string
  name: string
  studentId: string
  profileImage?: string
  profile: {
    firstName: string
    surname: string
    programme: string
    yearOfStudy: string
  }
}

interface Conversation {
  userId: string
  name: string
  studentId: string
  profileImage?: string
  profile: {
    firstName: string
    surname: string
    programme: string
    yearOfStudy: string
  }
  lastMessage: {
    id: string
    content: string
    isFromMe: boolean
    createdAt: string
  } | null
  unreadCount: number
  lastMessageTime: string | null
}

interface Message {
  id: string
  content: string
  isFromMe: boolean
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    name: string
    studentId: string
  }
}

export default function StudentMessages() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { unreadCount, refreshUnreadCount } = useMessages()
  const [view, setView] = useState<'conversations' | 'students' | 'chat'>('conversations')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedUser, setSelectedUser] = useState<Student | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchConversations()
    
    // Set up polling for new messages every 5 seconds
    const interval = setInterval(() => {
      if (view === 'conversations') {
        fetchConversations()
      }
      if (selectedUser && view === 'chat') {
        fetchMessages(selectedUser.id)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [session, status, router, view, selectedUser])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages/conversations')
      const data = await response.json()
      
      if (data.success) {
        setConversations(data.data)
        // Refresh unread count in the context
        refreshUnreadCount()
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages/students')
      const data = await response.json()
      
      if (data.success) {
        setStudents(data.data)
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages/conversations/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return

    const messageContent = newMessage.trim()
    setNewMessage('') // Clear input immediately for better UX

    // Optimistically add the message to the UI
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      isFromMe: true,
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: {
        id: session?.user.id || '',
        name: session?.user.name || '',
        studentId: session?.user.studentId || ''
      }
    }
    
    setMessages(prev => [...prev, tempMessage])

    try {
      setSending(true)

      const response = await fetch(`/api/messages/conversations/${selectedUser.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: messageContent }),
      })

      const data = await response.json()
      
      if (data.success) {
        // Replace the temporary message with the real one
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? data.data : msg
        ))
        // Refresh conversations to update last message
        fetchConversations()
      } else {
        // Remove the temporary message if sending failed
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
        setNewMessage(messageContent) // Restore the message
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      // Remove the temporary message if sending failed
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id))
      setNewMessage(messageContent) // Restore the message
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading messages..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {view === 'chat' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('conversations')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {view === 'chat' ? selectedUser?.name : 'Messages'}
                </h1>
                <p className="text-sm text-gray-600">
                  {view === 'chat' ? selectedUser?.studentId : 'Chat with fellow students'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {view !== 'chat' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newView = view === 'conversations' ? 'students' : 'conversations'
                    setView(newView)
                    setSearchTerm('')
                    
                    // Fetch students when switching to students view
                    if (newView === 'students') {
                      fetchStudents()
                    }
                  }}
                >
                  {view === 'conversations' ? <Users className="h-4 w-4 mr-2" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                  {view === 'conversations' ? 'All Students' : 'Conversations'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        {view !== 'chat' && (
          <div className="w-1/3 bg-white border-r">
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {view === 'conversations' ? (
                // Conversations List
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conversation) => (
                    <div
                      key={conversation.userId}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedUser({
                          id: conversation.userId,
                          name: conversation.name,
                          studentId: conversation.studentId,
                          profile: conversation.profile
                        })
                        setView('chat')
                        fetchMessages(conversation.userId)
                      }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.profileImage} alt={conversation.name} />
                        <AvatarFallback>
                          {conversation.profile.firstName?.[0]}{conversation.profile.surname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.name}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {conversation.studentId}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-600 truncate mt-1">
                            {conversation.lastMessage.isFromMe ? 'You: ' : ''}
                            {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                      {conversation.lastMessageTime && (
                        <p className="text-xs text-gray-400">
                          {formatTime(conversation.lastMessageTime)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // Students List
                <div className="space-y-1 p-2">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedUser(student)
                        setView('chat')
                        fetchMessages(student.id)
                      }}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.profileImage} alt={student.name} />
                        <AvatarFallback>
                          {student.profile.firstName?.[0]}{student.profile.surname?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {student.studentId}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {student.profile.programme} • {student.profile.yearOfStudy}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        {view === 'chat' && selectedUser ? (
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isFromMe
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.isFromMe ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t bg-white p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : view !== 'chat' ? (
          // Welcome Screen
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {view === 'conversations' ? 'No conversations yet' : 'Select a student to start chatting'}
              </h3>
              <p className="text-gray-600">
                {view === 'conversations' 
                  ? 'Start a conversation with a fellow student'
                  : 'Choose from the list to begin messaging'
                }
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
