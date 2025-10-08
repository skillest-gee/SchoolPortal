'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin, Calendar } from 'lucide-react'
import Loading from '@/components/ui/loading'

export default function TimetablePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    // For new students, show empty timetable
    setTimetable([])
    setLoading(false)
  }, [session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading timetable..." />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Timetable</h1>
            <p className="text-gray-600 mt-2">Your class schedule and important dates</p>
          </div>

          {timetable.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No timetable available</h3>
                <p className="text-gray-600 text-center">
                  Your timetable will appear here once you register for courses.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {days.map((day) => (
                <Card key={day}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-center text-sm font-medium text-gray-900">
                      {day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {timetable
                      .filter((entry: any) => entry.dayOfWeek === day.toUpperCase())
                      .map((entry: any) => (
                        <div key={entry.id} className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-900">
                              {entry.startTime} - {entry.endTime}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {entry.course?.title}
                          </h4>
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{entry.location}</span>
                          </div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {entry.type}
                          </Badge>
                        </div>
                      ))}
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