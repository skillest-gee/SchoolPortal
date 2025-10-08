'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Alert } from '@/components/ui/alert'
import Loading from '@/components/ui/loading'
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Clock
} from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  type: 'GENERAL' | 'ACADEMIC' | 'FINANCIAL' | 'EVENT' | 'URGENT'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  targetAudience: 'ALL' | 'STUDENTS' | 'LECTURERS' | 'ADMIN'
  isActive: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    email: string
  }
}

const ANNOUNCEMENT_TYPES = [
  { value: 'GENERAL', label: 'General', color: 'bg-blue-100 text-blue-800' },
  { value: 'ACADEMIC', label: 'Academic', color: 'bg-green-100 text-green-800' },
  { value: 'FINANCIAL', label: 'Financial', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'EVENT', label: 'Event', color: 'bg-purple-100 text-purple-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

const PRIORITY_LEVELS = [
  { value: 'LOW', label: 'Low', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
  { value: 'HIGH', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENT', label: 'Urgent', color: 'bg-red-100 text-red-800' }
]

const TARGET_AUDIENCES = [
  { value: 'ALL', label: 'All Users' },
  { value: 'STUDENTS', label: 'Students Only' },
  { value: 'LECTURERS', label: 'Lecturers Only' },
  { value: 'ADMIN', label: 'Admin Only' }
]

export default function AnnouncementsManagement() {
  const { data: session } = useSession()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'GENERAL' as 'GENERAL' | 'ACADEMIC' | 'FINANCIAL' | 'EVENT' | 'URGENT',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
    targetAudience: 'ALL' as 'ALL' | 'STUDENTS' | 'LECTURERS' | 'ADMIN',
    isActive: true
  })

  // Filters
  const [typeFilter, setTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [audienceFilter, setAudienceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/auth/login')
      return
    }
    fetchAnnouncements()
  }, [session, router])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter) params.append('type', typeFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      if (audienceFilter) params.append('targetAudience', audienceFilter)
      if (statusFilter) params.append('isActive', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/admin/announcements?${params}`)
      if (!response.ok) throw new Error('Failed to fetch announcements')
      
      const data = await response.json()
      setAnnouncements(data.announcements || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch announcements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [typeFilter, priorityFilter, audienceFilter, statusFilter, searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      
      const url = editingAnnouncement 
        ? `/api/admin/announcements/${editingAnnouncement.id}`
        : '/api/admin/announcements'
      
      const method = editingAnnouncement ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save announcement')
      }

      await fetchAnnouncements()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save announcement')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return
    
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete announcement')
      
      await fetchAnnouncements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete announcement')
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/announcements/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update announcement status')
      
      await fetchAnnouncements()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update announcement status')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'GENERAL',
      priority: 'MEDIUM',
      targetAudience: 'ALL',
      isActive: true
    })
    setShowCreateForm(false)
    setEditingAnnouncement(null)
  }

  const startEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      isActive: announcement.isActive
    })
    setEditingAnnouncement(announcement)
    setShowCreateForm(true)
  }

  const getTypeBadge = (type: string) => {
    const typeConfig = ANNOUNCEMENT_TYPES.find(t => t.value === type)
    return (
      <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'}>
        {typeConfig?.label || type}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = PRIORITY_LEVELS.find(p => p.value === priority)
    return (
      <Badge className={priorityConfig?.color || 'bg-gray-100 text-gray-800'}>
        {priorityConfig?.label || priority}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="w-3 h-3" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="flex items-center gap-1">
        <XCircle className="w-3 h-3" />
        Inactive
      </Badge>
    )
  }

  const getTargetAudienceLabel = (audience: string) => {
    const audienceConfig = TARGET_AUDIENCES.find(a => a.value === audience)
    return audienceConfig?.label || audience
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Loading announcements..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Announcements Management</h1>
              <p className="text-gray-600 mt-2">
                Create and manage system-wide announcements for students, lecturers, and staff
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Announcement
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            {error}
          </Alert>
        )}

        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters & Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search announcements..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <option value="">All Types</option>
                {ANNOUNCEMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <Select
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <option value="">All Priorities</option>
                {PRIORITY_LEVELS.map(priority => (
                  <option key={priority.value} value={priority.value}>{priority.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <Select
                value={audienceFilter}
                onValueChange={setAudienceFilter}
              >
                <option value="">All Audiences</option>
                {TARGET_AUDIENCES.map(audience => (
                  <option key={audience.value} value={audience.value}>{audience.label}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
              </h3>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter announcement title..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    required
                  >
                    {ANNOUNCEMENT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    required
                  >
                    {PRIORITY_LEVELS.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Audience *
                  </label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value: any) => setFormData({ ...formData, targetAudience: value })}
                    required
                  >
                    {TARGET_AUDIENCES.map(audience => (
                      <option key={audience.value} value={audience.value}>{audience.label}</option>
                    ))}
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter announcement content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={6}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (announcement will be visible to users)
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingAnnouncement ? 'Update Announcement' : 'Create Announcement'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {announcement.title}
                    </h3>
                    {getStatusBadge(announcement.isActive)}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {getTypeBadge(announcement.type)}
                    {getPriorityBadge(announcement.priority)}
                    <Badge variant="outline">
                      {getTargetAudienceLabel(announcement.targetAudience)}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingAnnouncement(announcement)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(announcement)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(announcement.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-600 line-clamp-3">
                  {announcement.content}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{announcement.author.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(announcement.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  size="sm"
                  variant={announcement.isActive ? "outline" : "default"}
                  onClick={() => handleToggleStatus(announcement.id, announcement.isActive)}
                  className="w-full"
                >
                  {announcement.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {announcements.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Announcements Found
            </h3>
            <p className="text-gray-600 mb-4">
              {announcements.length === 0 
                ? "Create your first announcement to get started."
                : "No announcements match your current filters."
              }
            </p>
            {announcements.length === 0 && (
              <Button onClick={() => setShowCreateForm(true)}>
                Create Announcement
              </Button>
            )}
          </Card>
        )}

        {/* View Modal */}
        {viewingAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Announcement Details</h2>
                  <Button variant="outline" onClick={() => setViewingAnnouncement(null)}>
                    Close
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {viewingAnnouncement.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-3">
                      {getTypeBadge(viewingAnnouncement.type)}
                      {getPriorityBadge(viewingAnnouncement.priority)}
                      {getStatusBadge(viewingAnnouncement.isActive)}
                    </div>
                    <Badge variant="outline">
                      {getTargetAudienceLabel(viewingAnnouncement.targetAudience)}
                    </Badge>
                  </div>

                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">
                      {viewingAnnouncement.content}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t">
                    <div>
                      <span className="font-medium text-gray-700">Author:</span>
                      <p className="text-gray-600">{viewingAnnouncement.author.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <p className="text-gray-600">{viewingAnnouncement.author.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <p className="text-gray-600">
                        {new Date(viewingAnnouncement.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <p className="text-gray-600">
                        {new Date(viewingAnnouncement.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

