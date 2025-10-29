'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface SearchResult {
  id: string
  type: 'course' | 'assignment' | 'announcement' | 'student'
  title: string
  description?: string
  code?: string
  url: string
  [key: string]: any
}

interface SearchBarProps {
  placeholder?: string
  className?: string
  onResultClick?: (result: SearchResult) => void
}

export default function SearchBar({ 
  placeholder = 'Search courses, assignments, announcements...',
  className = '',
  onResultClick
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{
    courses: SearchResult[]
    assignments: SearchResult[]
    announcements: SearchResult[]
    students: SearchResult[]
    total: number
  }>({
    courses: [],
    assignments: [],
    announcements: [],
    students: [],
    total: 0
  })
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (query.length < 2) {
      setResults({
        courses: [],
        assignments: [],
        announcements: [],
        students: [],
        total: 0
      })
      setShowResults(false)
      return
    }

    // Debounce search
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()

        if (data.success) {
          setResults(data.data)
          setShowResults(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [query])

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    } else {
      window.location.href = result.url
    }
    setShowResults(false)
    setQuery('')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return '📚'
      case 'assignment':
        return '📝'
      case 'announcement':
        return '📢'
      case 'student':
        return '👤'
      default:
        return '📄'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'course':
        return 'Course'
      case 'assignment':
        return 'Assignment'
      case 'announcement':
        return 'Announcement'
      case 'student':
        return 'Student'
      default:
        return 'Item'
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setShowResults(false)
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
        )}
      </div>

      {showResults && results.total > 0 && (
        <Card className="absolute top-full mt-2 w-full z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {results.courses.length > 0 && (
              <div className="p-3 border-b">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Courses</h3>
                {results.courses.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-start gap-3"
                  >
                    <span className="text-lg">{getTypeIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.title}</p>
                      <p className="text-xs text-gray-500 truncate">{result.code}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.assignments.length > 0 && (
              <div className="p-3 border-b">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Assignments</h3>
                {results.assignments.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-start gap-3"
                  >
                    <span className="text-lg">{getTypeIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.title}</p>
                      <p className="text-xs text-gray-500 truncate">{result.course}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.announcements.length > 0 && (
              <div className="p-3 border-b">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Announcements</h3>
                {results.announcements.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-start gap-3"
                  >
                    <span className="text-lg">{getTypeIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.title}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.students.length > 0 && (
              <div className="p-3">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Students</h3>
                {results.students.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-start gap-3"
                  >
                    <span className="text-lg">{getTypeIcon(result.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.name}</p>
                      <p className="text-xs text-gray-500 truncate">{result.studentId}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showResults && query.length >= 2 && results.total === 0 && !loading && (
        <Card className="absolute top-full mt-2 w-full z-50 shadow-lg">
          <CardContent className="p-4 text-center text-gray-500">
            No results found for "{query}"
          </CardContent>
        </Card>
      )}
    </div>
  )
}

