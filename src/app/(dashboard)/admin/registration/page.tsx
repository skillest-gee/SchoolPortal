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
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface CourseRegistrationPeriod {
  id: string
  name: string
  description?: string
  academicYear: string
  semester: string
  level?: string
  department?: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Software Engineering',
  'Cybersecurity',
  'Data Science',
  'Computer Engineering'
]

const LEVELS = ['100', '200', '300', '400']
const SEMESTERS = ['First Semester', 'Second Semester']
const ACADEMIC_YEARS = ['2023/2024', '2024/2025', '2025/2026']

export default function CourseRegistrationManagement() {
  const { data: session } = useSession()
  const router = useRouter()
  const [periods, setPeriods] = useState<CourseRegistrationPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<CourseRegistrationPeriod | null>(null)
  const [viewingPeriod, setViewingPeriod] = useState<CourseRegistrationPeriod | null>(null)
  const [registrationOpen, setRegistrationOpen] = useState<boolean>(true)
  const [updatingRegistrationStatus, setUpdatingRegistrationStatus] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    academicYear: '',
    semester: '',
    level: '',
    department: '',
    startDate: '',
    endDate: '',
    isActive: true
  })

  // Filters
  const [academicYearFilter, setAcademicYearFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }
    fetchPeriods()
    fetchRegistrationStatus()
  }, [session, status, router])

  const fetchRegistrationStatus = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.settings) {
          setRegistrationOpen(data.settings.registrationOpen ?? true)
        }
      }
    } catch (err) {
      console.error('Error fetching registration status:', err)
    }
  }

  const toggleRegistrationStatus = async () => {
    try {
      setUpdatingRegistrationStatus(true)
      const newStatus = !registrationOpen
      
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationOpen: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update registration status')
      
      setRegistrationOpen(newStatus)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registration status')
    } finally {
      setUpdatingRegistrationStatus(false)
    }
  }

  const fetchPeriods = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (academicYearFilter) params.append('academicYear', academicYearFilter)
      if (semesterFilter) params.append('semester', semesterFilter)
      if (departmentFilter) params.append('department', departmentFilter)
      if (levelFilter) params.append('level', levelFilter)
      if (statusFilter) params.append('isActive', statusFilter)

      const response = await fetch(`/api/admin/registration-periods?${params}`)
      if (!response.ok) throw new Error('Failed to fetch registration periods')
      
      const data = await response.json()
      setPeriods(data.periods || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch registration periods')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPeriods()
  }, [academicYearFilter, semesterFilter, departmentFilter, levelFilter, statusFilter])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError('')
      
      const url = editingPeriod 
        ? `/api/admin/registration-periods/${editingPeriod.id}`
        : '/api/admin/registration-periods'
      
      const method = editingPeriod ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save registration period')
      }

      await fetchPeriods()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save registration period')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration period?')) return
    
    try {
      const response = await fetch(`/api/admin/registration-periods/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete registration period')
      
      await fetchPeriods()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete registration period')
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/registration-periods/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) throw new Error('Failed to update registration period status')
      
      await fetchPeriods()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update registration period status')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      academicYear: '',
      semester: '',
      level: '',
      department: '',
      startDate: '',
      endDate: '',
      isActive: true
    })
    setShowCreateForm(false)
    setEditingPeriod(null)
  }

  const startEdit = (period: CourseRegistrationPeriod) => {
    setFormData({
      name: period.name,
      description: period.description || '',
      academicYear: period.academicYear,
      semester: period.semester,
      level: period.level || '',
      department: period.department || '',
      startDate: period.startDate.split('T')[0],
      endDate: period.endDate.split('T')[0],
      isActive: period.isActive
    })
    setEditingPeriod(period)
    setShowCreateForm(true)
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

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      '100': 'bg-blue-100 text-blue-800',
      '200': 'bg-green-100 text-green-800',
      '300': 'bg-yellow-100 text-yellow-800',
      '400': 'bg-purple-100 text-purple-800'
    }
    return colors[level] || 'bg-gray-100 text-gray-800'
  }

  const filteredPeriods = periods.filter(period => {
    if (academicYearFilter && period.academicYear !== academicYearFilter) return false
    if (semesterFilter && period.semester !== semesterFilter) return false
    if (departmentFilter && period.department !== departmentFilter) return false
    if (levelFilter && period.level !== levelFilter) return false
    if (statusFilter && period.isActive.toString() !== statusFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading message="Loading registration periods..." />
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
              <h1 className="text-3xl font-bold text-gray-900">Course Registration Management</h1>
              <p className="text-gray-600 mt-2">
                Manage course registration periods for different departments and levels
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Registration Period
            </Button>
          </div>
        </div>

        {/* Registration Status Toggle */}
        <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${registrationOpen ? 'bg-green-100' : 'bg-red-100'}`}>
                  {registrationOpen ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Course Registration Status
                  </h3>
                  <p className="text-sm text-gray-600">
                    {registrationOpen 
                      ? 'Course registration is currently OPEN for all students'
                      : 'Course registration is currently CLOSED - students cannot register'
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={toggleRegistrationStatus}
                disabled={updatingRegistrationStatus}
                variant={registrationOpen ? "destructive" : "default"}
                className="flex items-center gap-2"
              >
                {updatingRegistrationStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : registrationOpen ? (
                  <>
                    <XCircle className="w-4 h-4" />
                    Close Registration
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Open Registration
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="w-4 h-4" />
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <Select
                value={academicYearFilter}
                onValueChange={setAcademicYearFilter}
              >
                <option value="">All Years</option>
                {ACADEMIC_YEARS.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <Select
                value={semesterFilter}
                onValueChange={setSemesterFilter}
              >
                <option value="">All Semesters</option>
                {SEMESTERS.map(semester => (
                  <option key={semester} value={semester}>{semester}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level
              </label>
              <Select
                value={levelFilter}
                onValueChange={setLevelFilter}
              >
                <option value="">All Levels</option>
                {LEVELS.map(level => (
                  <option key={level} value={level}>{level} Level</option>
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
                {editingPeriod ? 'Edit Registration Period' : 'Create New Registration Period'}
              </h3>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., 2024/2025 First Semester Registration"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Year *
                  </label>
                  <Select
                    value={formData.academicYear}
                    onValueChange={(value) => setFormData({ ...formData, academicYear: value })}
                    required
                  >
                    <option value="">Select Academic Year</option>
                    {ACADEMIC_YEARS.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Semester *
                  </label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => setFormData({ ...formData, semester: value })}
                    required
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(semester => (
                      <option key={semester} value={semester}>{semester}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <Select
                    value={formData.department}
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <option value="">All Departments</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Level
                  </label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                  >
                    <option value="">All Levels</option>
                    {LEVELS.map(level => (
                      <option key={level} value={level}>{level} Level</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this registration period..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
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
                  Active (students can register during this period)
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingPeriod ? 'Update Period' : 'Create Period'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Registration Periods List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPeriods.map((period) => (
            <Card key={period.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {period.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(period.isActive)}
                    {period.level && (
                      <Badge className={getLevelColor(period.level)}>
                        {period.level} Level
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setViewingPeriod(period)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(period)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(period.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{period.academicYear} - {period.semester}</span>
                </div>
                
                {period.department && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>{period.department}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                  </span>
                </div>

                {period.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {period.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button
                  size="sm"
                  variant={period.isActive ? "outline" : "default"}
                  onClick={() => handleToggleStatus(period.id, period.isActive)}
                  className="w-full"
                >
                  {period.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredPeriods.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Registration Periods Found
            </h3>
            <p className="text-gray-600 mb-4">
              {periods.length === 0 
                ? "Create your first registration period to get started."
                : "No periods match your current filters."
              }
            </p>
            {periods.length === 0 && (
              <Button onClick={() => setShowCreateForm(true)}>
                Create Registration Period
              </Button>
            )}
          </Card>
        )}

        {/* View Modal */}
        {viewingPeriod && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Registration Period Details</h2>
                  <Button variant="outline" onClick={() => setViewingPeriod(null)}>
                    Close
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{viewingPeriod.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusBadge(viewingPeriod.isActive)}
                      {viewingPeriod.level && (
                        <Badge className={getLevelColor(viewingPeriod.level)}>
                          {viewingPeriod.level} Level
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Academic Year:</span>
                      <p className="text-gray-600">{viewingPeriod.academicYear}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Semester:</span>
                      <p className="text-gray-600">{viewingPeriod.semester}</p>
                    </div>
                    {viewingPeriod.department && (
                      <div>
                        <span className="font-medium text-gray-700">Department:</span>
                        <p className="text-gray-600">{viewingPeriod.department}</p>
                      </div>
                    )}
                    {viewingPeriod.level && (
                      <div>
                        <span className="font-medium text-gray-700">Level:</span>
                        <p className="text-gray-600">{viewingPeriod.level} Level</p>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-700">Start Date:</span>
                      <p className="text-gray-600">
                        {new Date(viewingPeriod.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">End Date:</span>
                      <p className="text-gray-600">
                        {new Date(viewingPeriod.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {viewingPeriod.description && (
                    <div>
                      <span className="font-medium text-gray-700">Description:</span>
                      <p className="text-gray-600 mt-1">{viewingPeriod.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <p className="text-gray-600">
                        {new Date(viewingPeriod.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <p className="text-gray-600">
                        {new Date(viewingPeriod.updatedAt).toLocaleDateString()}
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
