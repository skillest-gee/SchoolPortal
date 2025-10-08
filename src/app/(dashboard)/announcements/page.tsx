'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Megaphone, Calendar, User } from 'lucide-react'
import Loading from '@/components/ui/loading'

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    // Fetch announcements from API
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setAnnouncements(data.data)
          }
        }
      } catch (error) {
        console.error('Error fetching announcements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading announcements..." />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-600 mt-2">Stay informed with the latest news and updates</p>
          </div>

          {announcements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements</h3>
                <p className="text-gray-600 text-center">
                  There are no announcements at the moment. Check back later for updates.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {announcements.map((announcement: any) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{announcement.title}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{announcement.author}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {announcement.targetAudience}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">
                      {announcement.content}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}