'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, X, Clock, BookOpen, FileText, Megaphone, User, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

interface SearchComponentProps {
  placeholder?: string
  className?: string
  showResults?: boolean
  onResultClick?: (result: SearchResult) => void
}

export function SearchComponent({ 
  placeholder = "Search courses, assignments, announcements...",
  className = "",
  showResults = true,
  onResultClick
}: SearchComponentProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { data: session } = useSession()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Error parsing recent searches:', error)
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return
    
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  // Handle search
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=all`)
      if (response.ok) {
        const data = await response.json()
        setResults(data.data)
        saveRecentSearch(searchQuery)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        performSearch(query)
      } else {
        setResults(null)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsOpen(true)
    setSelectedIndex(-1)
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    } else {
      router.push(result.url)
    }
    setIsOpen(false)
    setQuery('')
    setResults(null)
  }

  // Handle recent search click
  const handleRecentSearchClick = (searchTerm: string) => {
    setQuery(searchTerm)
    performSearch(searchTerm)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || !results) return

    const allResults = [
      ...results.courses,
      ...results.assignments,
      ...results.announcements,
      ...results.students
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < allResults.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < allResults.length) {
          handleResultClick(allResults[selectedIndex])
        } else if (query.trim()) {
          // Navigate to search results page
          router.push(`/search?q=${encodeURIComponent(query)}`)
          setIsOpen(false)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const allResults = results ? [
    ...results.courses,
    ...results.assignments,
    ...results.announcements,
    ...results.students
  ] : []

  return (
    <div ref={searchRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults(null)
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {query.trim() && allResults.length > 0 ? (
            <div className="p-2">
              {/* Results Header */}
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                {results?.total} result{results?.total !== 1 ? 's' : ''} found
              </div>

              {/* Results */}
              <div className="py-1">
                {allResults.map((result, index) => {
                  const Icon = getResultIcon(result.type)
                  const isSelected = index === selectedIndex
                  
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "w-full flex items-start space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded transition-colors",
                        isSelected && "bg-blue-50"
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={cn("text-xs", getResultBadgeColor(result.type))}>
                            {result.type}
                          </Badge>
                          {result.isEnrolled && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Enrolled
                            </Badge>
                          )}
                          {result.isSubmitted && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              Submitted
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">{result.title}</h4>
                        {result.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {result.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          {result.code && <span>Code: {result.code}</span>}
                          {result.lecturer && <span>Lecturer: {result.lecturer}</span>}
                          {result.course && <span>Course: {result.course}</span>}
                          {result.author && <span>By: {result.author}</span>}
                          {result.dueDate && <span>Due: {formatDate(result.dueDate)}</span>}
                          {result.createdAt && <span>{formatDate(result.createdAt)}</span>}
                          {result.programme && <span>{result.programme}</span>}
                          {result.level && <span>Level: {result.level}</span>}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* View All Results */}
              {results && results.total > allResults.length && (
                <div className="px-3 py-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      router.push(`/search?q=${encodeURIComponent(query)}`)
                      setIsOpen(false)
                    }}
                  >
                    View all {results.total} results
                  </Button>
                </div>
              )}
            </div>
          ) : query.trim() && !isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No results found for "{query}"</p>
            </div>
          ) : !query.trim() && recentSearches.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                Recent Searches
              </div>
              <div className="py-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded transition-colors"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
