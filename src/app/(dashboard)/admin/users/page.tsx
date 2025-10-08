'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, Users, UserPlus, Eye, EyeOff, CheckCircle, XCircle, User, GraduationCap, BookOpen, 
  Edit, Trash2, MoreVertical, Shield, ShieldOff, Mail, Phone, MapPin, Calendar,
  AlertTriangle, Search, Filter, Download, Upload, RefreshCw, BarChart3
} from 'lucide-react'

const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  // Student specific fields
  studentId: z.string().optional(),
  program: z.string().optional(),
  yearOfStudy: z.number().optional(),
  // Lecturer specific fields
  staffId: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
})

const editUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['STUDENT', 'LECTURER', 'ADMIN']),
  password: z.string().optional(),
  isActive: z.boolean(),
  // Student specific fields
  studentId: z.string().optional(),
  program: z.string().optional(),
  yearOfStudy: z.number().optional(),
  // Lecturer specific fields
  staffId: z.string().optional(),
  department: z.string().optional(),
  office: z.string().optional(),
})

type CreateUserFormData = z.infer<typeof createUserSchema>
type EditUserFormData = z.infer<typeof editUserSchema>

interface User {
  id: string
  email: string
  name: string
  role: 'STUDENT' | 'LECTURER' | 'ADMIN'
  isActive: boolean
  createdAt: string
  studentProfile?: {
    studentId: string
    program: string
    yearOfStudy: number
  }
  lecturerProfile?: {
    staffId: string
    department: string
    office?: string
  }
}

const PROGRAMS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Data Science',
  'Cybersecurity',
  'Business Administration',
  'Accounting',
  'Marketing',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'Sociology',
  'English Literature',
  'History',
  'Political Science',
  'Engineering',
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Law',
  'Education',
]

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Business Administration',
  'Economics',
  'Psychology',
  'Sociology',
  'English',
  'History',
  'Political Science',
  'Engineering',
  'Medicine',
  'Nursing',
  'Pharmacy',
  'Law',
  'Education',
]

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('')
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [viewingUser, setViewingUser] = useState<User | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  })

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    setValue: setValueEdit,
    watch: watchEdit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  })

  const selectedRole = watch('role')
  const selectedEditRole = watchEdit('role')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    fetchUsers()
  }, [session, status, router, roleFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const url = roleFilter === 'ALL' 
        ? '/api/admin/users' 
        : `/api/admin/users?role=${roleFilter}`

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }

      if (data.success) {
        setUsers(data.data)
      }

    } catch (error) {
      console.error('Error fetching users:', error)
      setError(error instanceof Error ? error.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (data: CreateUserFormData) => {
    try {
      setCreating(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      setSuccess('User created successfully!')
      reset()
      setShowCreateForm(false)
      await fetchUsers()

    } catch (error) {
      console.error('Error creating user:', error)
      setError(error instanceof Error ? error.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const editUser = async (data: EditUserFormData) => {
    if (!editingUser) return

    try {
      setCreating(true)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user')
      }

      setSuccess('User updated successfully!')
      resetEdit()
      setShowEditForm(false)
      setEditingUser(null)
      await fetchUsers()

    } catch (error) {
      console.error('Error updating user:', error)
      setError(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setCreating(false)
    }
  }

  const deleteUser = async (userId: string) => {
    try {
      setDeletingUser(userId)
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user')
      }

      setSuccess('User deleted successfully!')
      await fetchUsers()

    } catch (error) {
      console.error('Error deleting user:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setDeletingUser(null)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update user status')
      }

      setSuccess(`User ${isActive ? 'activated' : 'deactivated'} successfully!`)
      await fetchUsers()

    } catch (error) {
      console.error('Error updating user status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update user status')
    }
  }

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) return

    try {
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          action: bulkAction,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to perform bulk action')
      }

      setSuccess(`Bulk action completed successfully! ${selectedUsers.length} users affected.`)
      setSelectedUsers([])
      setBulkAction('')
      await fetchUsers()

    } catch (error) {
      console.error('Error performing bulk action:', error)
      setError(error instanceof Error ? error.message : 'Failed to perform bulk action')
    }
  }

  const openEditForm = (user: User) => {
    setEditingUser(user)
    setValueEdit('email', user.email)
    setValueEdit('name', user.name)
    setValueEdit('role', user.role)
    setValueEdit('isActive', user.isActive)
    
    if (user.studentProfile) {
      setValueEdit('studentId', user.studentProfile.studentId)
      setValueEdit('program', user.studentProfile.program)
      setValueEdit('yearOfStudy', user.studentProfile.yearOfStudy)
    }
    
    if (user.lecturerProfile) {
      setValueEdit('staffId', user.lecturerProfile.staffId)
      setValueEdit('department', user.lecturerProfile.department)
      setValueEdit('office', user.lecturerProfile.office || '')
    }
    
    setShowEditForm(true)
  }

  const closeEditForm = () => {
    setShowEditForm(false)
    setEditingUser(null)
    resetEdit()
  }

  const openUserDetails = (user: User) => {
    setViewingUser(user)
    setShowUserDetails(true)
  }

  const closeUserDetails = () => {
    setShowUserDetails(false)
    setViewingUser(null)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <Badge className="bg-blue-100 text-blue-800">Student</Badge>
      case 'LECTURER':
        return <Badge className="bg-green-100 text-green-800">Lecturer</Badge>
      case 'ADMIN':
        return <Badge className="bg-purple-100 text-purple-800">Admin</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'STUDENT':
        return <GraduationCap className="h-4 w-4" />
      case 'LECTURER':
        return <BookOpen className="h-4 w-4" />
      case 'ADMIN':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.studentProfile?.studentId && user.studentProfile.studentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lecturerProfile?.staffId && user.lecturerProfile.staffId.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(filteredUsers.map(user => user.id))
    } else {
      setSelectedUsers([])
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
              >
                ← Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search by name, email, student ID, or staff ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Roles</SelectItem>
                      <SelectItem value="STUDENT">Students</SelectItem>
                      <SelectItem value="LECTURER">Lecturers</SelectItem>
                      <SelectItem value="ADMIN">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={fetchUsers} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''} found
                </div>
                {selectedUsers.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{selectedUsers.length} selected</span>
                    <Select value={bulkAction} onValueChange={setBulkAction}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Bulk action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activate">Activate</SelectItem>
                        <SelectItem value="deactivate">Deactivate</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      onClick={handleBulkAction} 
                      disabled={!bulkAction}
                      variant="outline"
                      size="sm"
                    >
                      Apply
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        {filteredUsers.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {getRoleIcon(user.role)}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div 
                                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
                                onClick={() => openUserDetails(user)}
                              >
                                {user.name}
                              </div>
                              <div 
                                className="text-sm text-gray-500 cursor-pointer hover:text-blue-600 hover:underline"
                                onClick={() => openUserDetails(user)}
                              >
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.role === 'STUDENT' && user.studentProfile && (
                            <div>
                              <div>ID: {user.studentProfile.studentId}</div>
                              <div className="text-gray-500">{user.studentProfile.program}</div>
                            </div>
                          )}
                          {user.role === 'LECTURER' && user.lecturerProfile && (
                            <div>
                              <div>ID: {user.lecturerProfile.staffId}</div>
                              <div className="text-gray-500">{user.lecturerProfile.department}</div>
                            </div>
                          )}
                          {user.role === 'ADMIN' && (
                            <div className="text-gray-500">System Administrator</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm text-gray-900">
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openUserDetails(user)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditForm(user)}
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant={user.isActive ? "destructive" : "default"}
                              onClick={() => toggleUserStatus(user.id, !user.isActive)}
                              title={user.isActive ? "Deactivate User" : "Activate User"}
                            >
                              {user.isActive ? (
                                <ShieldOff className="h-4 w-4" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
                                  deleteUser(user.id)
                                }
                              }}
                              disabled={deletingUser === user.id}
                              title="Delete User"
                            >
                              {deletingUser === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-500">
                {searchTerm || roleFilter !== 'ALL'
                  ? 'No users match your search criteria.'
                  : 'No users have been created yet.'
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* Create User Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Create New User</CardTitle>
                    <CardDescription>Create a new user account with appropriate role and profile</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(false)
                      reset()
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(createUser)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select onValueChange={(value) => setValue('role', value as any)}>
                        <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="LECTURER">Lecturer</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && (
                        <p className="text-sm text-red-500">{errors.role.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          className={errors.password ? 'border-red-500' : ''}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Student specific fields */}
                  {selectedRole === 'STUDENT' && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Student Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="studentId">Student ID *</Label>
                          <Input
                            id="studentId"
                            {...register('studentId')}
                            className={errors.studentId ? 'border-red-500' : ''}
                          />
                          {errors.studentId && (
                            <p className="text-sm text-red-500">{errors.studentId.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="program">Program *</Label>
                          <Select onValueChange={(value) => setValue('program', value)}>
                            <SelectTrigger className={errors.program ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select program" />
                            </SelectTrigger>
                            <SelectContent>
                              {PROGRAMS.map((program) => (
                                <SelectItem key={program} value={program}>
                                  {program}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.program && (
                            <p className="text-sm text-red-500">{errors.program.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="yearOfStudy">Year of Study</Label>
                          <Input
                            id="yearOfStudy"
                            type="number"
                            min="1"
                            max="5"
                            {...register('yearOfStudy', { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lecturer specific fields */}
                  {selectedRole === 'LECTURER' && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Lecturer Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="staffId">Staff ID *</Label>
                          <Input
                            id="staffId"
                            {...register('staffId')}
                            className={errors.staffId ? 'border-red-500' : ''}
                          />
                          {errors.staffId && (
                            <p className="text-sm text-red-500">{errors.staffId.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="department">Department *</Label>
                          <Select onValueChange={(value) => setValue('department', value)}>
                            <SelectTrigger className={errors.department ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map((department) => (
                                <SelectItem key={department} value={department}>
                                  {department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.department && (
                            <p className="text-sm text-red-500">{errors.department.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="office">Office</Label>
                          <Input
                            id="office"
                            {...register('office')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false)
                        reset()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create User
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditForm && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Edit User</CardTitle>
                    <CardDescription>Update user information and profile details</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={closeEditForm}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitEdit(editUser)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-name">Full Name *</Label>
                      <Input
                        id="edit-name"
                        {...registerEdit('name')}
                        className={editErrors.name ? 'border-red-500' : ''}
                      />
                      {editErrors.name && (
                        <p className="text-sm text-red-500">{editErrors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-email">Email Address *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        {...registerEdit('email')}
                        className={editErrors.email ? 'border-red-500' : ''}
                      />
                      {editErrors.email && (
                        <p className="text-sm text-red-500">{editErrors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-role">Role *</Label>
                      <Select onValueChange={(value) => setValueEdit('role', value as any)}>
                        <SelectTrigger className={editErrors.role ? 'border-red-500' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STUDENT">Student</SelectItem>
                          <SelectItem value="LECTURER">Lecturer</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      {editErrors.role && (
                        <p className="text-sm text-red-500">{editErrors.role.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-password">New Password (optional)</Label>
                      <Input
                        id="edit-password"
                        type="password"
                        {...registerEdit('password')}
                        placeholder="Leave blank to keep current password"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="edit-isActive"
                          {...registerEdit('isActive')}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="edit-isActive">Active User</Label>
                      </div>
                    </div>
                  </div>

                  {/* Student specific fields */}
                  {selectedEditRole === 'STUDENT' && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Student Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-studentId">Student ID *</Label>
                          <Input
                            id="edit-studentId"
                            {...registerEdit('studentId')}
                            className={editErrors.studentId ? 'border-red-500' : ''}
                          />
                          {editErrors.studentId && (
                            <p className="text-sm text-red-500">{editErrors.studentId.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-program">Program *</Label>
                          <Select onValueChange={(value) => setValueEdit('program', value)}>
                            <SelectTrigger className={editErrors.program ? 'border-red-500' : ''}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROGRAMS.map((program) => (
                                <SelectItem key={program} value={program}>
                                  {program}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {editErrors.program && (
                            <p className="text-sm text-red-500">{editErrors.program.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-yearOfStudy">Year of Study</Label>
                          <Input
                            id="edit-yearOfStudy"
                            type="number"
                            min="1"
                            max="5"
                            {...registerEdit('yearOfStudy', { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lecturer specific fields */}
                  {selectedEditRole === 'LECTURER' && (
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-medium">Lecturer Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-staffId">Staff ID *</Label>
                          <Input
                            id="edit-staffId"
                            {...registerEdit('staffId')}
                            className={editErrors.staffId ? 'border-red-500' : ''}
                          />
                          {editErrors.staffId && (
                            <p className="text-sm text-red-500">{editErrors.staffId.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-department">Department *</Label>
                          <Select onValueChange={(value) => setValueEdit('department', value)}>
                            <SelectTrigger className={editErrors.department ? 'border-red-500' : ''}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DEPARTMENTS.map((department) => (
                                <SelectItem key={department} value={department}>
                                  {department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {editErrors.department && (
                            <p className="text-sm text-red-500">{editErrors.department.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edit-office">Office</Label>
                          <Input
                            id="edit-office"
                            {...registerEdit('office')}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeEditForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {creating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          Update User
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Details Modal */}
        {showUserDetails && viewingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {getRoleIcon(viewingUser.role)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{viewingUser.name}</CardTitle>
                      <CardDescription className="text-lg">{viewingUser.email}</CardDescription>
                      <div className="flex items-center space-x-2 mt-2">
                        {getRoleBadge(viewingUser.role)}
                        <Badge variant={viewingUser.isActive ? "default" : "secondary"}>
                          {viewingUser.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        closeUserDetails()
                        openEditForm(viewingUser)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </Button>
                    <Button
                      variant="outline"
                      onClick={closeUserDetails}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                        <p className="text-gray-900 font-medium">{viewingUser.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                        <p className="text-gray-900">{viewingUser.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">User Role</Label>
                        <div className="mt-1">{getRoleBadge(viewingUser.role)}</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Account Status</Label>
                        <div className="flex items-center mt-1">
                          <div className={`w-2 h-2 rounded-full mr-2 ${viewingUser.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-gray-900">
                            {viewingUser.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Account Created</Label>
                        <p className="text-gray-900">{formatDate(viewingUser.createdAt)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">User ID</Label>
                        <p className="text-gray-900 font-mono text-sm">{viewingUser.id}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Profile Information */}
                {viewingUser.role === 'STUDENT' && viewingUser.studentProfile && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <GraduationCap className="h-5 w-5 mr-2" />
                      Student Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Student ID</Label>
                          <p className="text-gray-900 font-mono">{viewingUser.studentProfile.studentId}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Program of Study</Label>
                          <p className="text-gray-900">{viewingUser.studentProfile.program}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Year of Study</Label>
                          <p className="text-gray-900">Year {viewingUser.studentProfile.yearOfStudy}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Academic Level</Label>
                          <Badge className="bg-blue-100 text-blue-800">
                            Level {viewingUser.studentProfile.yearOfStudy}00
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lecturer Profile Information */}
                {viewingUser.role === 'LECTURER' && viewingUser.lecturerProfile && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2" />
                      Lecturer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Staff ID</Label>
                          <p className="text-gray-900 font-mono">{viewingUser.lecturerProfile.staffId}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Department</Label>
                          <p className="text-gray-900">{viewingUser.lecturerProfile.department}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Office Location</Label>
                          <p className="text-gray-900">
                            {viewingUser.lecturerProfile.office || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Employment Status</Label>
                          <Badge className="bg-green-100 text-green-800">Active Lecturer</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Information */}
                {viewingUser.role === 'ADMIN' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Administrator Information
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                        <div>
                          <h4 className="font-medium text-yellow-800">System Administrator</h4>
                          <p className="text-sm text-yellow-700">
                            This user has full administrative privileges and can manage all aspects of the system.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Statistics */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Account Statistics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">Account Age</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {Math.floor((new Date().getTime() - new Date(viewingUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">Last Login</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {viewingUser.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-600">Account Type</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {viewingUser.role}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        closeUserDetails()
                        openEditForm(viewingUser)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </Button>
                    <Button
                      variant={viewingUser.isActive ? "destructive" : "default"}
                      onClick={() => {
                        toggleUserStatus(viewingUser.id, !viewingUser.isActive)
                        closeUserDetails()
                      }}
                    >
                      {viewingUser.isActive ? (
                        <>
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(viewingUser.email)
                        setSuccess('Email copied to clipboard!')
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Copy Email
                    </Button>
                    {viewingUser.role === 'STUDENT' && viewingUser.studentProfile && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(viewingUser.studentProfile!.studentId)
                          setSuccess('Student ID copied to clipboard!')
                        }}
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Copy Student ID
                      </Button>
                    )}
                    {viewingUser.role === 'LECTURER' && viewingUser.lecturerProfile && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(viewingUser.lecturerProfile!.staffId)
                          setSuccess('Staff ID copied to clipboard!')
                        }}
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Copy Staff ID
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
