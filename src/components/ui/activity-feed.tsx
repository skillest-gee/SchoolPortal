'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Activity, 
  User, 
  FileText, 
  DollarSign, 
  BookOpen,
  Calendar,
  Clock,
  MoreVertical,
  RefreshCw
} from 'lucide-react'
// import { formatDistanceToNow } from 'date-fns' - using custom function instead

interface ActivityItem {
  id: string
  type: 'user' | 'application' | 'payment' | 'course' | 'system'
  title: string
  description: string
  timestamp: Date
  userId?: string
  userName?: string
  action?: string
  metadata?: Record<string, any>
}

interface ActivityFeedProps {
  limit?: number
  showRefresh?: boolean
  onActivityClick?: (activity: ActivityItem) => void
}

export function ActivityFeed({ limit = 10, showRefresh = true, onActivityClick }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch from activity logs API
      const response = await fetch('/api/admin/activity-logs?limit=' + limit)
      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }

      const data = await response.json()
      if (data.success) {
        // Transform activity logs to ActivityItem format
        const transformed = data.data.map((log: any) => ({
          id: log.id,
          type: mapActionToType(log.action),
          title: log.action,
          description: log.entity + (log.entityId ? ` #${log.entityId}` : ''),
          timestamp: new Date(log.createdAt),
          userId: log.userId,
          userName: log.user?.name,
          action: log.action,
          metadata: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : {}
        }))
        setActivities(transformed)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      setError('Failed to load activity feed')
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'just now'
  }

  const mapActionToType = (action: string): ActivityItem['type'] => {
    if (action.toLowerCase().includes('user')) return 'user'
    if (action.toLowerCase().includes('application')) return 'application'
    if (action.toLowerCase().includes('payment') || action.toLowerCase().includes('fee')) return 'payment'
    if (action.toLowerCase().includes('course')) return 'course'
    return 'system'
  }

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user':
        return User
      case 'application':
        return FileText
      case 'payment':
        return DollarSign
      case 'course':
        return BookOpen
      default:
        return Activity
    }
  }

  const getColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800'
      case 'application':
        return 'bg-green-100 text-green-800'
      case 'payment':
        return 'bg-yellow-100 text-yellow-800'
      case 'course':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500">{error}</p>
            {showRefresh && (
              <Button onClick={fetchActivities} variant="outline" size="sm" className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        {showRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchActivities}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getIcon(activity.type)
              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onActivityClick?.(activity)}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getColor(activity.type)} flex items-center justify-center`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {activity.description}
                    </p>
                    {activity.userName && (
                      <p className="text-xs text-gray-500 mt-1">
                        by {activity.userName}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

