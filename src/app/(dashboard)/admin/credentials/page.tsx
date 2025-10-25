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
  Key, 
  Mail, 
  Users, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  UserCheck,
  UserX
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  program: string
  hallOfResidence?: string
  hasCredentials: boolean
  totalFees: number
  totalPaid: number
  paymentStatus: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'NOT_PAID'
  createdAt: string
}

interface Summary {
  total: number
  needsCredentials: number
  hasCredentials: number
  fullyPaid: number
  partiallyPaid: number
}

export default function AdminCredentialsManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [summary, setSummary] = useState<Summary>({
    total: 0,
    needsCredentials: 0,
    hasCredentials: 0,
    fullyPaid: 0,
    partiallyPaid: 0
  })
  const [loading, setLoading] = useState(true)
  const [sendingCredentials, setSendingCredentials] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Credential form state
  const [credentialForm, setCredentialForm] = useState({
    password: '',
    hallOfResidence: '',
    notes: ''
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
      const response = await fetch('/api/admin/send-credentials')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStudents(data.data.students)
          setSummary(data.data.summary)
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error)
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCredentials = async (studentId: string) => {
    try {
      setSendingCredentials(studentId)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/send-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: studentId,
          password: credentialForm.password || undefined,
          hallOfResidence: credentialForm.hallOfResidence || undefined,
          notes: credentialForm.notes || undefined
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(`Login credentials sent to ${data.data.studentEmail}`)
        setCredentialForm({
          password: '',
          hallOfResidence: '',
          notes: ''
        })
        fetchStudents()
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.error || 'Failed to send credentials')
      }
    } catch (error) {
      setError('Failed to send credentials')
    } finally {
      setSendingCredentials(null)
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'FULLY_PAID': return 'bg-green-100 text-green-800'
      case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-800'
      case 'NOT_PAID': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'FULLY_PAID': return CheckCircle
      case 'PARTIALLY_PAID': return AlertCircle
      case 'NOT_PAID': return AlertCircle
      default: return DollarSign
    }
  }

  const filteredStudents = students.filter(student => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'needs_credentials') return !student.hasCredentials
    if (filterStatus === 'has_credentials') return student.hasCredentials
    if (filterStatus === 'fully_paid') return student.paymentStatus === 'FULLY_PAID'
    if (filterStatus === 'partially_paid') return student.paymentStatus === 'PARTIALLY_PAID'
    return true
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading student credentials..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Student Credentials Management</h1>
            <p className="mt-2 text-gray-600">Send login credentials to students after payment confirmation</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserX className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Need Credentials</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.needsCredentials}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Have Credentials</p>
                  <p className="text-2xl font-bold text-green-600">{summary.hasCredentials}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Fully Paid</p>
                  <p className="text-2xl font-bold text-green-600">{summary.fullyPaid}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Partially Paid</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.partiallyPaid}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Credential Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Send Credentials
              </CardTitle>
              <CardDescription>
                Configure and send login credentials to students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="password">Custom Password (Optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={credentialForm.password}
                  onChange={(e) => setCredentialForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Leave empty for auto-generated"
                />
                <p className="text-xs text-gray-500 mt-1">If empty, a random password will be generated</p>
              </div>

              <div>
                <Label htmlFor="hallOfResidence">Hall of Residence</Label>
                <Input
                  id="hallOfResidence"
                  value={credentialForm.hallOfResidence}
                  onChange={(e) => setCredentialForm(prev => ({ ...prev, hallOfResidence: e.target.value }))}
                  placeholder="e.g., Unity Hall"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={credentialForm.notes}
                  onChange={(e) => setCredentialForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional instructions"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Select a student from the list below</li>
                  <li>• Configure credentials (optional)</li>
                  <li>• Click "Send Credentials"</li>
                  <li>• Student will receive email with login details</li>
                  <li>• Student can then register for courses</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Students ({filteredStudents.length})
                </span>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="needs_credentials">Need Credentials</SelectItem>
                    <SelectItem value="has_credentials">Have Credentials</SelectItem>
                    <SelectItem value="fully_paid">Fully Paid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
              </CardTitle>
              <CardDescription>
                Students who have made payments and can receive login credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map(student => {
                    const PaymentIcon = getPaymentStatusIcon(student.paymentStatus)
                    const canSendCredentials = !student.hasCredentials && student.totalPaid > 0

                    return (
                      <div key={student.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{student.name}</h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <p className="text-sm text-blue-600 font-medium">{student.studentId}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getPaymentStatusColor(student.paymentStatus)}>
                              <PaymentIcon className="h-3 w-3 mr-1" />
                              {student.paymentStatus.replace('_', ' ')}
                            </Badge>
                            {student.hasCredentials && (
                              <Badge className="bg-green-100 text-green-800 mt-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Has Credentials
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <span className="text-gray-600">Program:</span>
                            <span className="ml-2 font-medium">{student.program}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Hall:</span>
                            <span className="ml-2">{student.hallOfResidence || 'Not assigned'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Fees:</span>
                            <span className="ml-2 font-medium">${student.totalFees.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Paid:</span>
                            <span className="ml-2 font-medium text-green-600">${student.totalPaid.toFixed(2)}</span>
                          </div>
                        </div>

                        {canSendCredentials && (
                          <Button
                            onClick={() => handleSendCredentials(student.id)}
                            disabled={sendingCredentials === student.id}
                            className="w-full"
                            size="sm"
                          >
                            {sendingCredentials === student.id ? (
                              <>
                                <Mail className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4 mr-2" />
                                Send Credentials
                              </>
                            )}
                          </Button>
                        )}

                        {student.hasCredentials && (
                          <div className="text-center text-green-600 text-sm py-2">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            Credentials already sent
                          </div>
                        )}

                        {student.totalPaid === 0 && (
                          <div className="text-center text-gray-500 text-sm py-2">
                            <AlertCircle className="h-4 w-4 inline mr-1" />
                            No payments made yet
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No students found matching the selected filter</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
