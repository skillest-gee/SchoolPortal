'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { LoadingState, ErrorAlert } from '@/components/ui/loading'
import { parseApiError, getUserFriendlyMessage } from '@/lib/error-handling'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  category: 'assignment' | 'grade' | 'payment' | 'announcement' | 'system'
  actionUrl?: string
  metadata?: Record<string, any>
  isRead: boolean
  createdAt: string
  readAt?: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [markingAsRead, setMarkingAsRead] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchNotifications()
  }, [session, status, router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/notifications?limit=100')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const apiError = parseApiError({
          message: errorData.error || `HTTP ${response.status}`,
          statusCode: response.status
        })
        throw new Error(getUserFriendlyMessage(apiError))
      }

      const data = await response.json()
      if (data.success) {
        setNotifications(data.data.notifications)
        setUnreadCount(data.data.unreadCount)
      } else {
        throw new Error(data.error || 'Failed to fetch notifications')
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError(error instanceof Error ? error.message : 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true, readAt: new Date().toISOString() }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      setMarkingAsRead(true)
      const response = await fetch('/api/notifications', {
        method: 'PUT'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            isRead: true, 
            readAt: new Date().toISOString() 
          }))
        )
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    } finally {
      setMarkingAsRead(false)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      setDeleting(notificationId)
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        // Update unread count if the deleted notification was unread
        const deletedNotification = notifications.find(n => n.id === notificationId)
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    } finally {
      setDeleting(null)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return AlertCircle
      default: return Info
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'assignment': return 'bg-blue-100 text-blue-800'
      case 'grade': return 'bg-green-100 text-green-800'
      case 'payment': return 'bg-purple-100 text-purple-800'
      case 'announcement': return 'bg-orange-100 text-orange-800'
      case 'system': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState
          isLoading={true}
          error={null}
          data={null}
          loadingText="Loading notifications..."
        >
          <div>Loading...</div>
        </LoadingState>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Bell className="h-6 w-6 mr-3" />
                  Notifications
                </h1>
                <p className="text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={fetchNotifications}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  disabled={markingAsRead}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {markingAsRead ? 'Marking...' : 'Mark All Read'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <ErrorAlert 
            error={error} 
            onRetry={fetchNotifications}
            className="mb-6"
          />
        )}

        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const Icon = getNotificationIcon(notification.type)
              const isDeleting = deleting === notification.id
              
              return (
                <Card 
                  key={notification.id} 
                  className={`transition-all duration-200 ${
                    notification.isRead 
                      ? 'bg-white border-gray-200' 
                      : 'bg-blue-50 border-blue-200 shadow-sm'
                  } ${isDeleting ? 'opacity-50' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={`font-semibold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                              {notification.title}
                            </h3>
                            <Badge className={getCategoryColor(notification.category)}>
                              {notification.category}
                            </Badge>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(notification.createdAt)}
                            </div>
                            {notification.readAt && (
                              <div className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Read {formatDate(notification.readAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {notification.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(notification.actionUrl!)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        )}
                        {!notification.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-500">
                You don't have any notifications yet. We'll notify you when there's something important.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}