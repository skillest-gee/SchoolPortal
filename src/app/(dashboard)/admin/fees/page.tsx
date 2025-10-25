'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  Plus, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  CreditCard
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  program: string
}

interface Fee {
  id: string
  type: string
  description: string
  amount: number
  paidAmount: number
  outstandingAmount: number
  dueDate: string
  status: string
  createdAt: string
}

export default function AdminFeeManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [studentFees, setStudentFees] = useState<Fee[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingFee, setCreatingFee] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fee form state
  const [feeForm, setFeeForm] = useState({
    type: '',
    description: '',
    amount: '',
    academicYear: '2024/2025',
    semester: '1st Semester'
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    fetchStudents()
  }, [session, status, router])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users?role=STUDENT')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStudents(data.data.users)
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudentFees = async (studentId: string) => {
    try {
      const response = await fetch(`/api/fees?studentId=${studentId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStudentFees(data.data.summary.fees)
        }
      }
    } catch (error) {
      console.error('Error fetching student fees:', error)
    }
  }

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId)
    if (studentId) {
      fetchStudentFees(studentId)
    } else {
      setStudentFees([])
    }
  }

  const handleCreateFee = async () => {
    if (!selectedStudent || !feeForm.type || !feeForm.description || !feeForm.amount) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setCreatingFee(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          type: feeForm.type,
          description: feeForm.description,
          amount: parseFloat(feeForm.amount),
          academicYear: feeForm.academicYear,
          semester: feeForm.semester
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Fee created successfully!')
        setFeeForm({
          type: '',
          description: '',
          amount: '',
          academicYear: '2024/2025',
          semester: '1st Semester'
        })
        fetchStudentFees(selectedStudent)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to create fee')
      }
    } catch (error) {
      setError('Failed to create fee')
    } finally {
      setCreatingFee(false)
    }
  }

  const handleOpenRegistration = async () => {
    try {
      const response = await fetch('/api/admin/registration-control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'OPEN',
          academicYear: '2024/2025',
          semester: '1st Semester',
          message: 'Course registration is now open for all students who have made payments.'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Course registration opened successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to open registration')
      }
    } catch (error) {
      setError('Failed to open registration')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading fee management..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const selectedStudentData = students.find(s => s.id === selectedStudent)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
                <p className="mt-2 text-gray-600">Manage student fees and course registration</p>
              </div>
              <div className="flex space-x-3">
                <Button onClick={handleOpenRegistration} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Open Course Registration
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Fee */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Create Fee
              </CardTitle>
              <CardDescription>
                Add a new fee for a student
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="student">Select Student</Label>
                <Select value={selectedStudent} onValueChange={handleStudentSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} ({student.studentId}) - {student.program}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedStudentData && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Selected Student</h3>
                  <p className="text-blue-700">{selectedStudentData.name}</p>
                  <p className="text-blue-600 text-sm">{selectedStudentData.studentId} - {selectedStudentData.program}</p>
                </div>
              )}

              <div>
                <Label htmlFor="type">Fee Type</Label>
                <Select value={feeForm.type} onValueChange={(value) => setFeeForm(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TUITION">Tuition Fee</SelectItem>
                    <SelectItem value="ACCOMMODATION">Accommodation Fee</SelectItem>
                    <SelectItem value="LIBRARY">Library Fee</SelectItem>
                    <SelectItem value="EXAMINATION">Examination Fee</SelectItem>
                    <SelectItem value="LABORATORY">Laboratory Fee</SelectItem>
                    <SelectItem value="ADMISSION">Admission Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={feeForm.description}
                  onChange={(e) => setFeeForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Fee description"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={feeForm.amount}
                  onChange={(e) => setFeeForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={feeForm.academicYear}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, academicYear: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="semester">Semester</Label>
                  <Select value={feeForm.semester} onValueChange={(value) => setFeeForm(prev => ({ ...prev, semester: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Semester">1st Semester</SelectItem>
                      <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleCreateFee} 
                disabled={creatingFee || !selectedStudent}
                className="w-full"
              >
                {creatingFee ? 'Creating...' : 'Create Fee'}
              </Button>
            </CardContent>
          </Card>

          {/* Student Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Student Fees
              </CardTitle>
              <CardDescription>
                {selectedStudentData ? `Fees for ${selectedStudentData.name}` : 'Select a student to view their fees'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStudentData ? (
                <div className="space-y-4">
                  {studentFees.length > 0 ? (
                    studentFees.map(fee => (
                      <div key={fee.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{fee.description}</h3>
                          <Badge variant={fee.status === 'PAID' ? 'default' : 'secondary'}>
                            {fee.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Amount:</span>
                            <span className="ml-2 font-semibold">${fee.amount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Paid:</span>
                            <span className="ml-2 font-semibold text-green-600">${fee.paidAmount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Outstanding:</span>
                            <span className="ml-2 font-semibold text-red-600">${fee.outstandingAmount.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Due:</span>
                            <span className="ml-2">{new Date(fee.dueDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">No fees found for this student</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Select a student to view their fees</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
