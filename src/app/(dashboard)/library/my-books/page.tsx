'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  BookOpen, 
  Calendar, 
  Clock,
  ArrowLeft,
  BookMarked,
  CheckCircle,
  AlertTriangle,
  Eye,
  RotateCcw,
  TrendingUp,
  BookX
} from 'lucide-react'

interface Borrowing {
  id: string
  borrowDate: string
  dueDate: string
  returnDate?: string
  condition?: string
  notes?: string
  isOverdue: boolean
  daysOverdue: number
  status: 'active' | 'overdue' | 'returned'
  book: {
    id: string
    title: string
    author: string
    isbn: string
    category: string
    coverImageUrl?: string
  }
  user: {
    id: string
    name: string
    email: string
    studentProfile?: {
      studentId: string
    }
  }
}

interface LibraryStats {
  totalBorrowed: number
  activeBorrowings: number
  overdueBorrowings: number
  returnedBorrowings: number
}

export default function MyBooksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [borrowings, setBorrowings] = useState<Borrowing[]>([])
  const [stats, setStats] = useState<LibraryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchMyBooks()
  }, [session, status, router, statusFilter])

  const fetchMyBooks = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/library/my-books?${params}`)
      const data = await response.json()

      if (data.success) {
        setBorrowings(data.data)
        setStats(data.stats)
      } else {
        setError('Failed to load your books')
      }

    } catch (error) {
      console.error('Error fetching my books:', error)
      setError('Failed to load your books')
    } finally {
      setLoading(false)
    }
  }

  const handleReturnBook = async (borrowingId: string) => {
    if (!confirm('Are you sure you want to return this book?')) {
      return
    }

    try {
      const response = await fetch('/api/library/return', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          borrowingId,
          condition: 'GOOD'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to return book')
      }

      setSuccess('Book returned successfully!')
      fetchMyBooks()

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to return book')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string, isOverdue: boolean) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      case 'returned':
        return <Badge className="bg-blue-100 text-blue-800">Returned</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'Computer Science': 'bg-blue-100 text-blue-800',
      'Mathematics': 'bg-green-100 text-green-800',
      'Physics': 'bg-purple-100 text-purple-800',
      'Chemistry': 'bg-orange-100 text-orange-800',
      'Biology': 'bg-pink-100 text-pink-800',
      'Engineering': 'bg-red-100 text-red-800',
      'Business': 'bg-yellow-100 text-yellow-800',
      'Economics': 'bg-indigo-100 text-indigo-800',
      'Literature': 'bg-teal-100 text-teal-800',
      'History': 'bg-gray-100 text-gray-800',
      'Philosophy': 'bg-amber-100 text-amber-800',
      'Psychology': 'bg-rose-100 text-rose-800',
      'Medicine': 'bg-emerald-100 text-emerald-800',
      'Law': 'bg-violet-100 text-violet-800',
      'Art': 'bg-cyan-100 text-cyan-800',
      'Music': 'bg-lime-100 text-lime-800',
      'Other': 'bg-slate-100 text-slate-800'
    }
    return colors[category as keyof typeof colors] || colors['Other']
  }

  const filteredBorrowings = borrowings.filter(borrowing => {
    if (statusFilter === 'all') return true
    return borrowing.status === statusFilter
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-orange-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading your books...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/library')}
                className="bg-white/50 hover:bg-white/80 border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Library
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  My Books
                </h1>
                <p className="text-gray-600 mt-1">Manage your borrowed books</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Total Borrowed</p>
                    <p className="text-2xl font-bold">{stats.totalBorrowed}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <BookOpen className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Currently Active</p>
                    <p className="text-2xl font-bold">{stats.activeBorrowings}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <BookMarked className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm font-medium">Overdue</p>
                    <p className="text-2xl font-bold">{stats.overdueBorrowings}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Returned</p>
                    <p className="text-2xl font-bold">{stats.returnedBorrowings}</p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-full">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Filter by Status:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Books</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Books List */}
        {filteredBorrowings.length > 0 ? (
          <div className="space-y-6">
            {filteredBorrowings.map((borrowing) => (
              <Card 
                key={borrowing.id} 
                className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{borrowing.book.title}</h3>
                          {getStatusBadge(borrowing.status, borrowing.isOverdue)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">by {borrowing.book.author}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <Badge className={getCategoryColor(borrowing.book.category)}>
                            {borrowing.book.category}
                          </Badge>
                          <span>ISBN: {borrowing.book.isbn}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {borrowing.isOverdue && (
                        <div className="mb-2">
                          <Badge variant="destructive" className="animate-pulse">
                            {borrowing.daysOverdue} days overdue
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Borrowed: {formatDate(borrowing.borrowDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Due: {formatDate(borrowing.dueDate)}</span>
                    </div>
                    {borrowing.returnDate && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Returned: {formatDate(borrowing.returnDate)}</span>
                      </div>
                    )}
                  </div>

                  {borrowing.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{borrowing.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/library/books/${borrowing.book.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Book
                    </Button>
                    {borrowing.status === 'active' && (
                      <Button
                        size="sm"
                        onClick={() => handleReturnBook(borrowing.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Return Book
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardContent className="py-12 text-center">
              <BookX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Books Found</h3>
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? "You haven't borrowed any books yet."
                  : `You don't have any ${statusFilter} books.`
                }
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push('/library')}
              >
                Browse Library
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
