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
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  User,
  Calendar,
  GraduationCap,
  Mail,
  FileText,
  Key,
  Home,
  Phone,
  MapPin,
  BookOpen,
  Users,
  Briefcase,
  FileCheck,
  ExternalLink
} from 'lucide-react'
import Loading from '@/components/ui/loading'
import { exportApplicationsToCSV } from '@/lib/csv-export'
import { showSuccess, showError } from '@/lib/toast'

interface Application {
  id: string
  applicationNumber: string
  firstName: string
  middleName?: string
  lastName: string
  email: string
  phoneNumber: string
  dateOfBirth: string
  gender: string
  nationality: string
  address: string
  city: string
  state: string
  postalCode?: string
  previousSchool: string
  graduationYear: number
  previousGrade?: number
  qualificationType?: string
  entryLevel?: string
  studyMode?: string
  academicYear?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  emergencyContactAddress?: string
  specialNeeds?: string
  previousUniversity?: string
  workExperience?: string
  motivationStatement?: string
  resultDocument?: string
  passportPhoto?: string
  birthCertificate?: string
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  adminNotes?: string
  generatedStudentId?: string
  createdAt: string
  programme: {
    id: string
    code: string
    name: string
    department: string
  }
}

export default function AdminApplicationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [success, setSuccess] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedProgramme, setSelectedProgramme] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
    }
  }, [session, status, router])

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      loadApplications()
    }
  }, [session, selectedStatus, selectedProgramme])

    const loadApplications = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (selectedProgramme !== 'all') params.append('programmeId', selectedProgramme)
      
      const response = await fetch(`/api/applications?${params}`)
      if (response.ok) {
        const data = await response.json()
        setApplications(data.data || [])
      } else {
        showError('Failed to load applications')
      }
    } catch (error) {
        showError('Error loading applications')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewApplication = async (applicationId: string, status: 'APPROVED' | 'REJECTED', notes?: string) => {
    try {
      setReviewLoading(true)
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          adminNotes: notes
        })
      })

      if (response.ok) {
        await loadApplications() // Reload applications
        setSelectedApplication(null)
        setError('')
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Failed to review application')
      }
    } catch (error) {
      showError('Error reviewing application')
    } finally {
      setReviewLoading(false)
    }
  }

  const generateAcceptanceLetter = async (application: Application) => {
    try {
      setLoading(true)

      // First, get the student user if they exist
      const studentResponse = await fetch(`/api/admin/users?email=${application.email}`)
      const studentData = await studentResponse.json()
      
      if (!studentData.success || !studentData.data.length) {
        setError('Student user not found. Please create student account first.')
        return
      }

      const student = studentData.data[0]
      
      // Generate acceptance letter
      const letterResponse = await fetch(`/api/admin/acceptance-letter?studentId=${student.id}`)
      const letterData = await letterResponse.json()

      if (letterData.success) {
        // Create a downloadable file
        const letterContent = letterData.data.letterContent
        const blob = new Blob([letterContent], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Acceptance_Letter_${application.applicationNumber}.txt`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        showSuccess(`Acceptance letter generated for ${application.firstName} ${application.lastName}`)
      } else {
        showError(letterData.error || 'Failed to generate acceptance letter')
      }
    } catch (error) {
      console.error('Error generating acceptance letter:', error)
      showError('Failed to generate acceptance letter')
    } finally {
      setLoading(false)
    }
  }

  const sendLoginCredentials = async (application: Application) => {
    try {
      setLoading(true)

      // Get the student user
      const studentResponse = await fetch(`/api/admin/users?email=${application.email}`)
      const studentData = await studentResponse.json()
      
      if (!studentData.success || !studentData.data.length) {
        setError('Student user not found. Please create student account first.')
        return
      }

      const student = studentData.data[0]

      // Prompt for hall assignment
      const hallOfResidence = prompt('Enter hall of residence for the student:')
      if (!hallOfResidence) {
        setError('Hall of residence is required')
        return
      }

      // Send login credentials
      const credentialsResponse = await fetch('/api/admin/send-login-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: student.id,
          hallOfResidence: hallOfResidence,
          courseRegistrationInstructions: `
            Course Registration Instructions:
            1. Login to the student portal using your credentials
            2. Navigate to "Course Registration" in the sidebar
            3. Select courses for your programme and level
            4. Submit your course selection
            5. Wait for approval from your academic advisor
            
            Important Notes:
            • Course registration is open from September 1-15, 2024
            • You must register for at least 15 credit hours
            • Some courses may have prerequisites
            • Contact your academic advisor for course selection guidance
          `
        })
      })

      const credentialsData = await credentialsResponse.json()

      if (credentialsData.success) {
        showSuccess(`Login credentials sent to ${application.firstName} ${application.lastName}. Hall assigned: ${hallOfResidence}`)
        // Reload applications to update status
        loadApplications()
      } else {
        if (credentialsData.details) {
          setError(`${credentialsData.error}\n\nUnpaid fees: ${credentialsData.details.unpaidFees}\nTotal unpaid: $${credentialsData.details.totalUnpaid.toLocaleString()}\nUnpaid count: ${credentialsData.details.unpaidCount}/${credentialsData.details.totalFees}`)
        } else {
          setError(credentialsData.error || 'Failed to send login credentials')
        }
      }
    } catch (error) {
      console.error('Error sending login credentials:', error)
      setError('Failed to send login credentials')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return Clock
      case 'UNDER_REVIEW': return Eye
      case 'APPROVED': return CheckCircle
      case 'REJECTED': return XCircle
      default: return Clock
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicationNumber.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading applications..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white -mr-4 sm:-mr-6 lg:-mr-8 mb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Admission Applications
              </h1>
              <p className="text-purple-100 text-lg">
                Review and manage student admission applications
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{applications.length}</div>
                  <div className="text-sm text-purple-100">Total Applications</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or application number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadApplications} variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button 
                onClick={() => {
                  try {
                    exportApplicationsToCSV(filteredApplications)
                    showSuccess('Applications exported successfully!')
                  } catch (error) {
                    showError('Failed to export applications')
                  }
                }} 
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApplications.map((application) => {
          const StatusIcon = getStatusIcon(application.status)
          return (
            <Card key={application.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {application.firstName} {application.lastName}
                      </h3>
                      <Badge className={getStatusColor(application.status)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {application.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{application.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-4 w-4" />
                        <span>{application.programme.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>App #{application.applicationNumber}</span>
                      </div>
                    </div>
                    
                    {application.generatedStudentId && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Student ID: {application.generatedStudentId}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplication(application)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    
                    {application.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleReviewApplication(application.id, 'APPROVED')}
                          disabled={reviewLoading}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReviewApplication(application.id, 'REJECTED')}
                          disabled={reviewLoading}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {application.status === 'APPROVED' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateAcceptanceLetter(application)}
                          disabled={loading}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Acceptance Letter
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => sendLoginCredentials(application)}
                          disabled={loading}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Send Login Credentials
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredApplications.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No applications match your search criteria.' : 'No applications have been submitted yet.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Application Detail Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Application Details</CardTitle>
                  <CardDescription>
                    Application #{selectedApplication.applicationNumber}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900">
                      {selectedApplication.firstName} {selectedApplication.middleName} {selectedApplication.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{selectedApplication.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone Number</label>
                    <p className="text-gray-900">{selectedApplication.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                    <p className="text-gray-900">
                      {new Date(selectedApplication.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Gender</label>
                    <p className="text-gray-900">{selectedApplication.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nationality</label>
                    <p className="text-gray-900">{selectedApplication.nationality}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900">
                    {selectedApplication.address}, {selectedApplication.city}, {selectedApplication.state}
                  </p>
                </div>
              </div>

              {/* Academic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Programme</label>
                    <p className="text-gray-900">{selectedApplication.programme.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Previous School</label>
                    <p className="text-gray-900">{selectedApplication.previousSchool}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Graduation Year</label>
                    <p className="text-gray-900">{selectedApplication.graduationYear}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Previous Grade</label>
                    <p className="text-gray-900">
                      {selectedApplication.previousGrade ? selectedApplication.previousGrade.toFixed(2) : 'Not provided'}
                    </p>
                  </div>
                  {selectedApplication.academicYear && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Academic Year</label>
                      <p className="text-gray-900">{selectedApplication.academicYear}</p>
                    </div>
                  )}
                  {selectedApplication.entryLevel && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Entry Level</label>
                      <p className="text-gray-900">{selectedApplication.entryLevel}</p>
                    </div>
                  )}
                  {selectedApplication.studyMode && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Study Mode</label>
                      <p className="text-gray-900">{selectedApplication.studyMode}</p>
                    </div>
                  )}
                  {selectedApplication.qualificationType && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Qualification Type</label>
                      <p className="text-gray-900">{selectedApplication.qualificationType}</p>
                    </div>
                  )}
                  {selectedApplication.previousUniversity && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Previous University</label>
                      <p className="text-gray-900">{selectedApplication.previousUniversity}</p>
                    </div>
                  )}
                  {selectedApplication.workExperience && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Work Experience</label>
                      <p className="text-gray-900">{selectedApplication.workExperience}</p>
                    </div>
                  )}
                  {selectedApplication.motivationStatement && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-600">Motivation Statement</label>
                      <p className="text-gray-900 mt-1">{selectedApplication.motivationStatement}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              {(selectedApplication.emergencyContactName || selectedApplication.emergencyContactPhone) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Emergency Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.emergencyContactName && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Contact Name</label>
                        <p className="text-gray-900">{selectedApplication.emergencyContactName}</p>
                      </div>
                    )}
                    {selectedApplication.emergencyContactPhone && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone Number</label>
                        <p className="text-gray-900">{selectedApplication.emergencyContactPhone}</p>
                      </div>
                    )}
                    {selectedApplication.emergencyContactRelationship && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Relationship</label>
                        <p className="text-gray-900">{selectedApplication.emergencyContactRelationship}</p>
                      </div>
                    )}
                    {selectedApplication.emergencyContactAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-gray-900">{selectedApplication.emergencyContactAddress}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Special Needs */}
              {selectedApplication.specialNeeds && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2" />
                    Special Needs / Additional Information
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-900">{selectedApplication.specialNeeds}</p>
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              {(selectedApplication.resultDocument || selectedApplication.passportPhoto || selectedApplication.birthCertificate) && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileCheck className="h-5 w-5 mr-2" />
                    Uploaded Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedApplication.resultDocument && (
                      <a
                        href={selectedApplication.resultDocument}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">Result Document</span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    )}
                    {selectedApplication.passportPhoto && (
                      <a
                        href={selectedApplication.passportPhoto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">Passport Photo</span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    )}
                    {selectedApplication.birthCertificate && (
                      <a
                        href={selectedApplication.birthCertificate}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">Birth Certificate</span>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Application Status */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Application Status</h3>
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(selectedApplication.status)}>
                    {(() => {
                      const StatusIcon = getStatusIcon(selectedApplication.status)
                      return <StatusIcon className="h-3 w-3 mr-1" />
                    })()}
                    {selectedApplication.status.replace('_', ' ')}
                  </Badge>
                  {selectedApplication.generatedStudentId && (
                    <div className="text-green-600 font-medium">
                      Student ID: {selectedApplication.generatedStudentId}
                    </div>
                  )}
                </div>
                {selectedApplication.adminNotes && (
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-600">Admin Notes</label>
                    <p className="text-gray-900">{selectedApplication.adminNotes}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {selectedApplication.status === 'PENDING' && (
                <div className="flex space-x-4 pt-4 border-t">
                  <Button
                    onClick={() => handleReviewApplication(selectedApplication.id, 'APPROVED')}
                    disabled={reviewLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReviewApplication(selectedApplication.id, 'REJECTED')}
                    disabled={reviewLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}