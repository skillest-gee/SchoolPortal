'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  Send, 
  ArrowLeft, 
  User, 
  Search,
  Users,
  Mail,
  AlertTriangle,
  CheckCircle,
  Sparkles
} from 'lucide-react'

const composeMessageSchema = z.object({
  recipientId: z.string().min(1, 'Recipient is required'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Message content is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  messageType: z.enum(['DIRECT', 'ANNOUNCEMENT', 'NOTIFICATION']).default('DIRECT'),
})

type ComposeMessageFormData = z.infer<typeof composeMessageSchema>

interface User {
  id: string
  name: string
  email: string
  role: string
  studentProfile?: {
    studentId: string
  }
  lecturerProfile?: {
    staffId: string
  }
}

export default function ComposeMessagePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ComposeMessageFormData>({
    resolver: zodResolver(composeMessageSchema),
  })

  const watchedMessageType = watch('messageType')
  const watchedPriority = watch('priority')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchUsers()
  }, [session, status, router])

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.studentProfile?.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lecturerProfile?.staffId.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/admin/users')
      const data = await response.json()

      if (data.success) {
        // Filter out current user
        const otherUsers = data.data.filter((user: User) => user.id !== session?.user.id)
        setUsers(otherUsers)
        setFilteredUsers(otherUsers)
      }

    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ComposeMessageFormData) => {
    setSending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      setSuccess('Message sent successfully!')
      
      // Redirect to messages page after a short delay
      setTimeout(() => {
        router.push('/messages')
      }, 2000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <Badge variant="outline" className="text-blue-600 border-blue-200">Student</Badge>
      case 'LECTURER':
        return <Badge variant="outline" className="text-green-600 border-green-200">Lecturer</Badge>
      case 'ADMIN':
        return <Badge variant="outline" className="text-purple-600 border-purple-200">Admin</Badge>
      default:
        return <Badge variant="outline">User</Badge>
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-cyan-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading compose interface...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/messages')}
                className="bg-white/50 hover:bg-white/80 border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Messages
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">
                  Compose Message
                </h1>
                <p className="text-gray-600 mt-1">Send a message to your academic community</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Message Form */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  <span>New Message</span>
                </CardTitle>
                <CardDescription>
                  Compose and send your message
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="messageType">Message Type</Label>
                      <Select onValueChange={(value) => setValue('messageType', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select message type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIRECT">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>Direct Message</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="ANNOUNCEMENT">
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4" />
                              <span>Announcement</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="NOTIFICATION">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>Notification</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.messageType && (
                        <p className="text-sm text-red-500">{errors.messageType.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select onValueChange={(value) => setValue('priority', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <span>Low</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="MEDIUM">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                              <span>Medium</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="HIGH">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                              <span>High</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="URGENT">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <span>Urgent</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.priority && (
                        <p className="text-sm text-red-500">{errors.priority.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientId">Recipient</Label>
                    <Select onValueChange={(value) => setValue('recipientId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-2">
                              <span>{user.name}</span>
                              {getRoleBadge(user.role)}
                              <span className="text-sm text-gray-500">
                                ({user.studentProfile?.studentId || user.lecturerProfile?.staffId || user.email})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.recipientId && (
                      <p className="text-sm text-red-500">{errors.recipientId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      {...register('subject')}
                      placeholder="Enter message subject..."
                      className="text-lg"
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-500">{errors.subject.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Message Content</Label>
                    <Textarea
                      id="content"
                      {...register('content')}
                      placeholder="Type your message here..."
                      rows={8}
                      className="resize-none"
                    />
                    {errors.content && (
                      <p className="text-sm text-red-500">{errors.content.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/messages')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={sending}
                      className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white"
                    >
                      {sending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* User Search & Info */}
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-cyan-600" />
                  <span>Find Recipients</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredUsers.slice(0, 10).map((user) => (
                      <div
                        key={user.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => setValue('recipientId', user.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-gray-500">
                              {user.studentProfile?.studentId || user.lecturerProfile?.staffId || user.email}
                            </p>
                          </div>
                          {getRoleBadge(user.role)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message Preview */}
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-cyan-600" />
                  <span>Message Preview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Type:</span>
                    <Badge variant="outline">
                      {watchedMessageType || 'Direct'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Priority:</span>
                    <Badge className={getPriorityColor(watchedPriority || 'MEDIUM')}>
                      {watchedPriority || 'Medium'}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Preview:</p>
                    <p className="text-sm font-medium">Your message will appear here...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
