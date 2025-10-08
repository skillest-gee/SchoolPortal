'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Library, 
  Search, 
  Filter, 
  BookOpen, 
  Calendar,
  User,
  Clock,
  Download,
  Eye,
  Star,
  Tag
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  description: string
  available: boolean
  totalCopies: number
  availableCopies: number
  publishedYear: number
  publisher: string
  language: string
  pages: number
  rating: number
  coverImage?: string
}

interface BorrowedBook {
  id: string
  bookId: string
  title: string
  author: string
  borrowDate: string
  dueDate: string
  status: 'borrowed' | 'overdue' | 'returned'
}

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBook[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('catalog')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    const loadLibraryData = async () => {
      setLoading(true)
      
      // Mock books data
      const mockBooks: Book[] = [
        {
          id: '1',
          title: 'Introduction to Algorithms',
          author: 'Thomas H. Cormen',
          isbn: '978-0262033848',
          category: 'Computer Science',
          description: 'A comprehensive introduction to algorithms and data structures.',
          available: true,
          totalCopies: 5,
          availableCopies: 3,
          publishedYear: 2009,
          publisher: 'MIT Press',
          language: 'English',
          pages: 1312,
          rating: 4.8
        },
        {
          id: '2',
          title: 'Clean Code',
          author: 'Robert C. Martin',
          isbn: '978-0132350884',
          category: 'Computer Science',
          description: 'A handbook of agile software craftsmanship.',
          available: true,
          totalCopies: 3,
          availableCopies: 2,
          publishedYear: 2008,
          publisher: 'Prentice Hall',
          language: 'English',
          pages: 464,
          rating: 4.7
        },
        {
          id: '3',
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          isbn: '978-0743273565',
          category: 'Literature',
          description: 'A classic American novel set in the Jazz Age.',
          available: false,
          totalCopies: 4,
          availableCopies: 0,
          publishedYear: 1925,
          publisher: 'Scribner',
          language: 'English',
          pages: 180,
          rating: 4.2
        },
        {
          id: '4',
          title: 'Calculus: Early Transcendentals',
          author: 'James Stewart',
          isbn: '978-1285741550',
          category: 'Mathematics',
          description: 'Comprehensive calculus textbook with applications.',
          available: true,
          totalCopies: 6,
          availableCopies: 4,
          publishedYear: 2015,
          publisher: 'Cengage Learning',
          language: 'English',
          pages: 1368,
          rating: 4.5
        },
        {
          id: '5',
          title: 'Physics for Scientists and Engineers',
          author: 'Raymond A. Serway',
          isbn: '978-1337553292',
          category: 'Physics',
          description: 'Modern physics textbook with problem-solving approach.',
          available: true,
          totalCopies: 4,
          availableCopies: 2,
          publishedYear: 2018,
          publisher: 'Cengage Learning',
          language: 'English',
          pages: 1200,
          rating: 4.6
        }
      ]

      // Mock borrowed books data
      const mockBorrowedBooks: BorrowedBook[] = [
        {
          id: '1',
          bookId: '1',
          title: 'Introduction to Algorithms',
          author: 'Thomas H. Cormen',
          borrowDate: '2024-01-10',
          dueDate: '2024-02-10',
          status: 'borrowed'
        },
        {
          id: '2',
          bookId: '2',
          title: 'Clean Code',
          author: 'Robert C. Martin',
          borrowDate: '2024-01-05',
          dueDate: '2024-02-05',
          status: 'overdue'
        }
      ]

      setTimeout(() => {
        setBooks(mockBooks)
        setBorrowedBooks(mockBorrowedBooks)
        setLoading(false)
      }, 1000)
    }

    if (session) {
      loadLibraryData()
    }
  }, [session])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading library catalog..." />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const categories = ['all', ...Array.from(new Set(books.map(book => book.category)))]

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.isbn.includes(searchTerm)
    const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'borrowed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200'
      case 'returned': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailabilityColor = (available: boolean) => {
    return available 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Library className="h-6 w-6 mr-2 text-blue-600" />
                Digital Library
              </h1>
              <p className="text-gray-600 mt-1">Access thousands of books and academic resources</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant={activeTab === 'catalog' ? 'default' : 'outline'}
                onClick={() => setActiveTab('catalog')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Catalog
              </Button>
              <Button 
                variant={activeTab === 'my-books' ? 'default' : 'outline'}
                onClick={() => setActiveTab('my-books')}
              >
                <User className="h-4 w-4 mr-2" />
                My Books
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'catalog' ? (
          <>
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search books by title, author, or ISBN..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Books Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
                        <CardDescription className="mt-1">
                          by {book.author}
                        </CardDescription>
                      </div>
                      <Badge className={getAvailabilityColor(book.available)}>
                        {book.available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Tag className="h-4 w-4 mr-2" />
                        {book.category}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {book.publishedYear}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 mr-2" />
                        {book.pages} pages
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-2 text-yellow-500" />
                        {book.rating}/5.0
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {book.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {book.availableCopies}/{book.totalCopies} copies available
                        </span>
                        <span className="text-gray-500">ISBN: {book.isbn}</span>
                      </div>
                      <div className="flex space-x-2 pt-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          disabled={!book.available}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={!book.available}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Borrow
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredBooks.length === 0 && (
              <div className="text-center py-12">
                <Library className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </div>
            )}
          </>
        ) : (
          /* My Books Tab */
          <div className="space-y-6">
            {/* Borrowed Books Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Books Borrowed</p>
                      <p className="text-2xl font-bold text-gray-900">{borrowedBooks.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">On Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {borrowedBooks.filter(book => book.status === 'borrowed').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Calendar className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Overdue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {borrowedBooks.filter(book => book.status === 'overdue').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Borrowed Books List */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>My Borrowed Books</CardTitle>
                <CardDescription>
                  Manage your current book borrowings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {borrowedBooks.length > 0 ? (
                  <div className="space-y-4">
                    {borrowedBooks.map((book) => (
                      <div key={book.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{book.title}</h3>
                            <p className="text-sm text-gray-600">by {book.author}</p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span>Borrowed: {book.borrowDate}</span>
                              <span>Due: {book.dueDate}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge className={getStatusColor(book.status)}>
                              {book.status}
                            </Badge>
                            <Button size="sm" variant="outline">
                              Return
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowed books</h3>
                    <p className="text-gray-600">You haven't borrowed any books yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}