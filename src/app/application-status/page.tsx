'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Mail, 
  Calendar, 
  GraduationCap,
  FileText,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface ApplicationStatus {
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
  previousSchool: string
  graduationYear: number
  previousGrade?: number
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  adminNotes?: string
  generatedStudentId?: string
  createdAt: string
  reviewedAt?: string
  programme: {
    id: string
    code: string
    name: string
    department: string
  }
}

export default function ApplicationStatusPage() {
  const [email, setEmail] = useState('')
  const [applicationNumber, setApplicationNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [application, setApplication] = useState<ApplicationStatus | null>(null)

  // Check URL parameters on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const emailParam = params.get('email')
      const appNumberParam = params.get('applicationNumber')
      
      if (emailParam) setEmail(emailParam)
      if (appNumberParam) setApplicationNumber(appNumberParam)
      
      // Auto-search if both parameters are present
      if (emailParam && appNumberParam) {
        handleSearchFromParams(emailParam, appNumberParam)
      }
    }
  }, [])

  const handleSearchFromParams = async (emailParam: string, appNumberParam: string) => {
    try {
      setLoading(true)
      setError('')
      setApplication(null)

      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailParam.trim(),
          applicationNumber: appNumberParam.trim()
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setApplication(data.data)
      } else {
        setError(data.error || 'Application not found')
      }
    } catch (error) {
      console.error('Error searching application:', error)
      setError('Failed to search application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !applicationNumber) {
      setError('Please enter both email and application number')
      return
    }

    try {
      setLoading(true)
      setError('')
      setApplication(null)

      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          applicationNumber: applicationNumber.trim()
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setApplication(data.data)
      } else {
        setError(data.error || 'Application not found')
      }
    } catch (error) {
      console.error('Error searching application:', error)
      setError('Failed to search application. Please try again.')
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Your application is currently pending review. We will notify you once it has been processed.'
      case 'UNDER_REVIEW':
        return 'Your application is currently under review by our admissions team. This process typically takes 5-7 business days.'
      case 'APPROVED':
        return 'Congratulations! Your application has been approved. You will receive further instructions via email.'
      case 'REJECTED':
        return 'Unfortunately, your application was not successful this time. Please contact the admissions office for more information.'
      default:
        return 'Application status is being processed.'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Check Application Status
          </h1>
          <p className="text-gray-600">
            Enter your email and application number to check the status of your application
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Application
            </CardTitle>
            <CardDescription>
              Use the email and application number you provided during application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="applicationNumber">Application Number</Label>
                  <Input
                    id="applicationNumber"
                    type="text"
                    value={applicationNumber}
                    onChange={(e) => setApplicationNumber(e.target.value)}
                    placeholder="Enter your application number"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Check Status
                  </>
                )}
              </Button>
            </form>

            {error && (
              <Alert className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Application Status Display */}
        {application && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Application Status
                  </CardTitle>
                  <CardDescription>
                    Application #{application.applicationNumber}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(application.status)}>
                  {(() => {
                    const StatusIcon = getStatusIcon(application.status)
                    return (
                      <>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {application.status.replace('_', ' ')}
                      </>
                    )
                  })()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Message */}
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {getStatusMessage(application.status)}
                </AlertDescription>
              </Alert>

              {/* Application Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Name:</strong> {application.firstName} {application.middleName} {application.lastName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Email:</strong> {application.email}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Date of Birth:</strong> {formatDate(application.dateOfBirth)}
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>Gender:</strong> {application.gender}
                    </div>
                    <div className="text-sm">
                      <strong>Nationality:</strong> {application.nationality}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Program:</strong> {application.programme.name}
                      </span>
                    </div>
                    <div className="text-sm">
                      <strong>Department:</strong> {application.programme.department}
                    </div>
                    <div className="text-sm">
                      <strong>Previous School:</strong> {application.previousSchool}
                    </div>
                    <div className="text-sm">
                      <strong>Graduation Year:</strong> {application.graduationYear}
                    </div>
                    {application.previousGrade && (
                      <div className="text-sm">
                        <strong>Previous Grade:</strong> {application.previousGrade}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Application Timeline</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      <strong>Submitted:</strong> {formatDate(application.createdAt)}
                    </span>
                  </div>
                  {application.reviewedAt && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        <strong>Reviewed:</strong> {formatDate(application.reviewedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {application.adminNotes && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Admin Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{application.adminNotes}</p>
                  </div>
                </div>
              )}

              {/* Student ID (if approved) */}
              {application.generatedStudentId && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Student ID:</strong> {application.generatedStudentId}
                    <br />
                    You can now log in to the student portal using your credentials.
                  </AlertDescription>
                </Alert>
              )}

              {/* Next Steps */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                {application.status === 'PENDING' && (
                  <p className="text-sm text-blue-800">
                    Please wait for our admissions team to review your application. 
                    You will receive an email notification once the review is complete.
                  </p>
                )}
                {application.status === 'UNDER_REVIEW' && (
                  <p className="text-sm text-blue-800">
                    Your application is being reviewed. This process typically takes 5-7 business days. 
                    You will be notified of the decision via email.
                  </p>
                )}
                {application.status === 'APPROVED' && (
                  <p className="text-sm text-blue-800">
                    Congratulations! Please check your email for further instructions regarding 
                    fee payment and enrollment procedures.
                  </p>
                )}
                {application.status === 'REJECTED' && (
                  <p className="text-sm text-blue-800">
                    We encourage you to contact the admissions office for feedback and information 
                    about future application opportunities.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Can't find your application? Make sure you're using the correct email and application number.</p>
              <p>• Application number format: APP2024XXXX (e.g., APP20240001)</p>
              <p>• For technical support, contact: support@university.edu</p>
              <p>• For admissions questions, contact: admissions@university.edu</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
