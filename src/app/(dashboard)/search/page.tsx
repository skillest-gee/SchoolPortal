'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchComponent } from '@/components/ui/search'
import { 
  Search, 
  BookOpen, 
  FileText, 
  Megaphone, 
  User, 
  ArrowLeft,
  Calendar,
  Clock,
  GraduationCap
} from 'lucide-react'
import { LoadingState, ErrorAlert } from '@/components/ui/loading'
import { parseApiError, getUserFriendlyMessage } from '@/lib/error-handling'

interface SearchResult {
  id: string
  type: 'course' | 'assignment' | 'announcement' | 'student'
  title: string
  description?: string
  code?: string
  lecturer?: string
  course?: string
  author?: string
  dueDate?: string
  createdAt?: string
  isEnrolled?: boolean
  isSubmitted?: boolean
  programme?: string
  level?: string
  url: string
}

interface SearchResults {
  courses: SearchResult[]
  assignments: SearchResult[]
  announcements: SearchResult[]
  students: SearchResult[]
  total: number
}

export default function SearchPage() {
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session, status } = useSession()

  // Get search query from URL
  useEffect(() => {
    const searchQuery = searchParams.get('q')
    if (searchQuery) {
      setQuery(searchQuery)
      performSearch(searchQuery)
    }
  }, [searchParams])

  // Perform search
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const apiError = parseApiError({
          message: errorData.error || `HTTP ${response.status}`,
          statusCode: response.status
        })
        throw new Error(getUserFriendlyMessage(apiError))
      }
      
      const data = await response.json()
      setResults(data.data)
    } catch (error) {
      console.error('Search error:', error)
      setError(error instanceof Error ? error.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  // Handle search
  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('q', searchQuery)
    window.history.pushState({}, '', url.toString())
    performSearch(searchQuery)
  }

  // Get result icon
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'course': return BookOpen
      case 'assignment': return FileText
      case 'announcement': return Megaphone
      case 'student': return User
      default: return Search
    }
  }

  // Get result badge color
  const getResultBadgeColor = (type: string) => {
    switch (type) {
      case 'course': return 'bg-blue-100 text-blue-800'
      case 'assignment': return 'bg-green-100 text-green-800'
      case 'announcement': return 'bg-purple-100 text-purple-800'
      case 'student': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState
          isLoading={true}
          error={null}
          data={null}
          loadingText="Loading search..."
        >
          <div>Loading...</div>
        </LoadingState>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Search</h1>
              <p className="text-gray-600 mt-1">Find courses, assignments, announcements, and more</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl">
            <SearchComponent
              placeholder="Search courses, assignments, announcements..."
              onResultClick={handleResultClick}
              showResults={false}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <ErrorAlert 
            error={error} 
            onRetry={() => query && performSearch(query)}
            className="mb-6"
          />
        )}

        {loading ? (
          <LoadingState 
            isLoading={true}
            error={null}
            data={null}
            loadingText="Searching..."
          >
            <div>Searching...</div>
          </LoadingState>
        ) : results ? (
          <div className="space-y-8">
            {/* Search Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Search Results for "{query}"
              </h2>
              <p className="text-gray-600">
                Found {results.total} result{results.total !== 1 ? 's' : ''} across all categories
              </p>
            </div>

            {/* Results by Category */}
            {results.courses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  Courses ({results.courses.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.courses.map((course) => (
                    <Card key={course.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResultClick(course)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <Badge className={getResultBadgeColor(course.type)}>
                            {course.type}
                          </Badge>
                          {course.isEnrolled && (
                            <Badge className="bg-green-100 text-green-800">
                              Enrolled
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        {course.code && (
                          <CardDescription className="font-mono text-sm">
                            {course.code}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {course.description && (
                          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                            {course.description}
                          </p>
                        )}
                        <div className="space-y-2 text-sm text-gray-500">
                          {course.lecturer && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {course.lecturer}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {results.assignments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Assignments ({results.assignments.length})
                </h3>
                <div className="space-y-4">
                  {results.assignments.map((assignment) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResultClick(assignment)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge className={getResultBadgeColor(assignment.type)}>
                              {assignment.type}
                            </Badge>
                            {assignment.isSubmitted && (
                              <Badge className="bg-blue-100 text-blue-800">
                                Submitted
                              </Badge>
                            )}
                          </div>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h4>
                        {assignment.description && (
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {assignment.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {assignment.course && (
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {assignment.course}
                            </div>
                          )}
                          {assignment.dueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {formatDate(assignment.dueDate)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {results.announcements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Megaphone className="h-5 w-5 mr-2 text-purple-600" />
                  Announcements ({results.announcements.length})
                </h3>
                <div className="space-y-4">
                  {results.announcements.map((announcement) => (
                    <Card key={announcement.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResultClick(announcement)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className={getResultBadgeColor(announcement.type)}>
                            {announcement.type}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h4>
                        {announcement.description && (
                          <p className="text-gray-600 mb-3 line-clamp-3">
                            {announcement.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {announcement.author && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              By: {announcement.author}
                            </div>
                          )}
                          {announcement.createdAt && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDate(announcement.createdAt)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {results.students.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-orange-600" />
                  Students ({results.students.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.students.map((student) => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResultClick(student)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <Badge className={getResultBadgeColor(student.type)}>
                            {student.type}
                          </Badge>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">{student.title}</h4>
                        <div className="space-y-2 text-sm text-gray-500">
                          {student.code && (
                            <div className="flex items-center">
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Index: {student.code}
                            </div>
                          )}
                          {student.programme && (
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-2" />
                              {student.programme}
                            </div>
                          )}
                          {student.level && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              Level: {student.level}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results.total === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 mb-4">
                  Try searching with different keywords or check your spelling.
                </p>
                <Button onClick={() => setQuery('')}>
                  Clear Search
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start your search</h3>
            <p className="text-gray-500">
              Enter a search term above to find courses, assignments, announcements, and more.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
