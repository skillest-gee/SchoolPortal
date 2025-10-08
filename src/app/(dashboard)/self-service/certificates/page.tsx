'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  Award, 
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  User
} from 'lucide-react'

const createCertificateRequestSchema = z.object({
  certificateType: z.enum(['TRANSCRIPT', 'DEGREE_CERTIFICATE', 'ENROLLMENT_CERTIFICATE', 'GOOD_STANDING', 'OTHER']),
  purpose: z.string().min(1, 'Purpose is required'),
  deliveryMethod: z.enum(['PICKUP', 'EMAIL', 'MAIL']).default('PICKUP'),
  deliveryAddress: z.string().optional(),
  additionalNotes: z.string().optional(),
  urgent: z.boolean().default(false),
})

type CreateCertificateRequestFormData = z.infer<typeof createCertificateRequestSchema>

interface CertificateRequest {
  id: string
  certificateType: string
  purpose: string
  deliveryMethod: string
  deliveryAddress?: string
  additionalNotes?: string
  urgent: boolean
  status: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    studentProfile?: {
      studentId: string
      program: string
      yearOfStudy: string
    }
  }
}

const CERTIFICATE_TYPES = [
  { value: 'TRANSCRIPT', label: 'Academic Transcript', description: 'Complete academic record with grades' },
  { value: 'DEGREE_CERTIFICATE', label: 'Degree Certificate', description: 'Official degree certificate' },
  { value: 'ENROLLMENT_CERTIFICATE', label: 'Enrollment Certificate', description: 'Current enrollment status' },
  { value: 'GOOD_STANDING', label: 'Good Standing Certificate', description: 'Academic and disciplinary standing' },
  { value: 'OTHER', label: 'Other Certificate', description: 'Custom certificate request' }
]

export default function CertificateRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [requests, setRequests] = useState<CertificateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<CreateCertificateRequestFormData>({
    resolver: zodResolver(createCertificateRequestSchema),
  })

  const watchedDeliveryMethod = watch('deliveryMethod')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchRequests()
  }, [session, status, router])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/self-service/certificates')
      const data = await response.json()

      if (data.success) {
        setRequests(data.data)
      } else {
        setError('Failed to load certificate requests')
      }

    } catch (error) {
      console.error('Error fetching requests:', error)
      setError('Failed to load certificate requests')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CreateCertificateRequestFormData) => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/self-service/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit certificate request')
      }

      setSuccess('Certificate request submitted successfully!')
      setShowCreateForm(false)
      reset()
      fetchRequests()

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit certificate request')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'PROCESSING':
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getCertificateTypeInfo = (type: string) => {
    return CERTIFICATE_TYPES.find(t => t.value === type) || { label: type, description: '' }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading certificate requests...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/self-service')}
                className="bg-white/50 hover:bg-white/80 border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Self-Service
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Certificate Requests
                </h1>
                <p className="text-gray-600 mt-1">Request academic certificates and transcripts</p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg"
            >
              <Award className="h-4 w-4 mr-2" />
              Request Certificate
            </Button>
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

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Request New Certificate</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false)
                    reset()
                  }}
                >
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="certificateType">Certificate Type</Label>
                    <Select onValueChange={(value) => setValue('certificateType', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select certificate type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CERTIFICATE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-sm text-gray-500">{type.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.certificateType && (
                      <p className="text-sm text-red-500">{errors.certificateType.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryMethod">Delivery Method</Label>
                    <Select onValueChange={(value) => setValue('deliveryMethod', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select delivery method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PICKUP">Pickup at Office</SelectItem>
                        <SelectItem value="EMAIL">Email Delivery</SelectItem>
                        <SelectItem value="MAIL">Mail Delivery</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.deliveryMethod && (
                      <p className="text-sm text-red-500">{errors.deliveryMethod.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose of Request</Label>
                  <Textarea
                    id="purpose"
                    {...register('purpose')}
                    placeholder="Please specify the purpose of this certificate request..."
                    rows={3}
                  />
                  {errors.purpose && (
                    <p className="text-sm text-red-500">{errors.purpose.message}</p>
                  )}
                </div>

                {watchedDeliveryMethod === 'MAIL' && (
                  <div className="space-y-2">
                    <Label htmlFor="deliveryAddress">Delivery Address</Label>
                    <Textarea
                      id="deliveryAddress"
                      {...register('deliveryAddress')}
                      placeholder="Enter complete mailing address..."
                      rows={3}
                    />
                    {errors.deliveryAddress && (
                      <p className="text-sm text-red-500">{errors.deliveryAddress.message}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    {...register('additionalNotes')}
                    placeholder="Any additional information or special requirements..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="urgent"
                    {...register('urgent')}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="urgent" className="text-sm">
                    Mark as urgent request (additional fees may apply)
                  </Label>
                </div>

                <div className="flex justify-end space-x-2 pt-6">
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
                    disabled={saving}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Requests List */}
        <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-violet-600" />
              <span>Your Certificate Requests</span>
            </CardTitle>
            <CardDescription>
              Track the status of your certificate requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length > 0 ? (
              <div className="space-y-4">
                {requests.map((request) => {
                  const typeInfo = getCertificateTypeInfo(request.certificateType)
                  return (
                    <div
                      key={request.id}
                      className="border rounded-lg p-6 hover:shadow-md transition-all duration-200 bg-white/50"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                            <Award className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{typeInfo.label}</h3>
                              {getStatusBadge(request.status)}
                              {request.urgent && (
                                <Badge variant="destructive">Urgent</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{typeInfo.description}</p>
                            <p className="text-sm text-gray-700">{request.purpose}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Requested</p>
                          <p className="text-sm font-medium">{formatDate(request.createdAt)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{request.user.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          {request.deliveryMethod === 'EMAIL' ? (
                            <Mail className="h-4 w-4" />
                          ) : request.deliveryMethod === 'MAIL' ? (
                            <MapPin className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                          <span>{request.deliveryMethod}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>Updated: {formatDate(request.updatedAt)}</span>
                        </div>
                      </div>

                      {request.deliveryAddress && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Delivery Address:</strong> {request.deliveryAddress}
                          </p>
                        </div>
                      )}

                      {request.additionalNotes && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Notes:</strong> {request.additionalNotes}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/self-service/certificates/${request.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {request.status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificate Requests</h3>
                <p className="text-gray-500">You haven't submitted any certificate requests yet.</p>
                <Button
                  className="mt-4"
                  onClick={() => setShowCreateForm(true)}
                >
                  Request Your First Certificate
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
