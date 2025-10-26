'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, CheckCircle, GraduationCap, Search } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

// Form validation schema
const applicationSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['M', 'F'], { required_error: 'Please select your gender' }),
  nationality: z.string().min(2, 'Nationality is required'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().optional(),
  
  // Academic Information
  programmeId: z.string().min(1, 'Please select a programme'),
  previousSchool: z.string().min(2, 'Previous school is required'),
  graduationYear: z.string().min(4, 'Graduation year is required'),
  previousGrade: z.string().optional().or(z.literal('')),
  
  // Additional Academic Information
  qualificationType: z.string().min(1, 'Please select your qualification type'),
  entryLevel: z.string().min(1, 'Please select your entry level'),
  studyMode: z.string().min(1, 'Please select your preferred study mode'),
  academicYear: z.string().min(1, 'Please select the academic year'),
  
  // Emergency Contact Information
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(10, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().min(2, 'Relationship is required'),
  emergencyContactAddress: z.string().min(10, 'Emergency contact address is required'),
  
  // Additional Information
  specialNeeds: z.string().optional(),
  previousUniversity: z.string().optional(),
  workExperience: z.string().optional(),
  motivationStatement: z.string().min(50, 'Motivation statement must be at least 50 characters'),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

interface Programme {
  id: string
  code: string
  name: string
  department: string
  description?: string
  minGrade?: number
}

export default function ApplicationPage() {
  const router = useRouter()
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{
    resultDocument?: string
    passportPhoto?: string
    birthCertificate?: string
  }>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema)
  })

  // Load programmes on component mount
  useEffect(() => {
    const loadProgrammes = async () => {
      try {
        const response = await fetch('/api/programmes')
        if (response.ok) {
          const data = await response.json()
          console.log('Programmes loaded:', data.data)
          setProgrammes(data.data || [])
        } else {
          console.error('Failed to load programmes:', response.status)
        }
      } catch (error) {
        console.error('Error loading programmes:', error)
      }
    }
    loadProgrammes()
  }, [])

  const handleFileUpload = async (file: File, type: 'resultDocument' | 'passportPhoto' | 'birthCertificate') => {
    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      console.log('Uploading file:', file.name, 'Type:', type)

      const response = await fetch('/api/upload-s3', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      console.log('Upload response:', data)

      if (response.ok && data.success) {
        setUploadedFiles(prev => ({
          ...prev,
          [type]: data.filePath
        }))
        setSuccess(`${type.replace(/([A-Z])/g, ' $1').toLowerCase()} uploaded successfully`)
      } else {
        setError(data.error || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setError('Failed to upload file: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ApplicationFormData) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const applicationData = {
        ...data,
        graduationYear: parseInt(data.graduationYear),
        previousGrade: data.previousGrade && data.previousGrade.trim() !== '' ? parseFloat(data.previousGrade) : null,
        ...uploadedFiles
      }

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData)
      })

      if (response.ok) {
        const result = await response.json()
        setSuccess('Application submitted successfully! Your application number is: ' + result.data.applicationNumber)
        // Reset form after showing success
        setTimeout(() => {
          setUploadedFiles({})
          // Redirect to application status page
          router.push(`/application-status?email=${encodeURIComponent(data.email)}&applicationNumber=${encodeURIComponent(result.data.applicationNumber)}`)
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to submit application')
      }
    } catch (error) {
      setError('Error submitting application')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admission Application</h1>
          </div>
          <p className="text-gray-600">
            Fill out the form below to apply for admission to our institution
          </p>
        </div>

        {/* Application Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Application Form</CardTitle>
            <CardDescription>
              Please provide accurate information. All fields marked with * are required.
            </CardDescription>
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push('/application-status')}
                className="text-blue-600 hover:text-blue-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Check Application Status
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      className={errors.firstName ? 'border-red-500' : ''}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input
                      id="middleName"
                      {...register('middleName')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      className={errors.lastName ? 'border-red-500' : ''}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      {...register('dateOfBirth')}
                      className={errors.dateOfBirth ? 'border-red-500' : ''}
                    />
                    {errors.dateOfBirth && (
                      <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="gender">Gender *</Label>
                    <Select onValueChange={(value) => setValue('gender', value as 'M' | 'F')}>
                      <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-sm text-red-500 mt-1">{errors.gender.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nationality">Nationality *</Label>
                    <Input
                      id="nationality"
                      {...register('nationality')}
                      className={errors.nationality ? 'border-red-500' : ''}
                    />
                    {errors.nationality && (
                      <p className="text-sm text-red-500 mt-1">{errors.nationality.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      {...register('phoneNumber')}
                      className={errors.phoneNumber ? 'border-red-500' : ''}
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="address">Residential Address *</Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    className={errors.address ? 'border-red-500' : ''}
                    rows={3}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State/Region *</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      className={errors.state ? 'border-red-500' : ''}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      {...register('postalCode')}
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Academic Information
                </h3>
                
                <div>
                  <Label htmlFor="programmeId">Programme of Study *</Label>
                  <Select onValueChange={(value) => setValue('programmeId', value)}>
                    <SelectTrigger className={errors.programmeId ? 'border-red-500' : ''}>
                      <SelectValue placeholder={programmes.length === 0 ? "Loading programmes..." : "Select your desired programme"} />
                    </SelectTrigger>
                    <SelectContent>
                      {programmes.length === 0 ? (
                        <SelectItem value="loading" disabled>Loading programmes...</SelectItem>
                      ) : (
                        programmes.map((programme) => (
                          <SelectItem key={programme.id} value={programme.id}>
                            {programme.name} ({programme.code})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.programmeId && (
                    <p className="text-sm text-red-500 mt-1">{errors.programmeId.message}</p>
                  )}
                  {programmes.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">Loading available programmes...</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="previousSchool">Previous High School *</Label>
                    <Input
                      id="previousSchool"
                      {...register('previousSchool')}
                      className={errors.previousSchool ? 'border-red-500' : ''}
                    />
                    {errors.previousSchool && (
                      <p className="text-sm text-red-500 mt-1">{errors.previousSchool.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="graduationYear">High School Graduation Year *</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      min="1990"
                      max="2024"
                      {...register('graduationYear')}
                      className={errors.graduationYear ? 'border-red-500' : ''}
                    />
                    {errors.graduationYear && (
                      <p className="text-sm text-red-500 mt-1">{errors.graduationYear.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="previousGrade">Wassce Grade (Optional)</Label>
                  <Input
                    id="previousGrade"
                    type="number"
                    step="0.1"
                    min="0"
                    max="4"
                    placeholder="e.g., 3.5"
                    {...register('previousGrade')}
                  />
                </div>

                {/* Additional Academic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="qualificationType">Qualification Type *</Label>
                    <Select onValueChange={(value) => setValue('qualificationType', value)}>
                      <SelectTrigger className={errors.qualificationType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select qualification type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WASSCE">WASSCE</SelectItem>
                        <SelectItem value="NECO">NECO</SelectItem>
                        <SelectItem value="GCE">GCE A-Level</SelectItem>
                        <SelectItem value="IB">International Baccalaureate</SelectItem>
                        <SelectItem value="DIPLOMA">Diploma</SelectItem>
                        <SelectItem value="DEGREE">Bachelor's Degree</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.qualificationType && (
                      <p className="text-sm text-red-500 mt-1">{errors.qualificationType.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="entryLevel">Entry Level *</Label>
                    <Select onValueChange={(value) => setValue('entryLevel', value)}>
                      <SelectTrigger className={errors.entryLevel ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select entry level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="100">100 Level (Direct Entry)</SelectItem>
                        <SelectItem value="200">200 Level (Direct Entry)</SelectItem>
                        <SelectItem value="300">300 Level (Direct Entry)</SelectItem>
                        <SelectItem value="POSTGRADUATE">Postgraduate</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.entryLevel && (
                      <p className="text-sm text-red-500 mt-1">{errors.entryLevel.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="studyMode">Study Mode *</Label>
                    <Select onValueChange={(value) => setValue('studyMode', value)}>
                      <SelectTrigger className={errors.studyMode ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select study mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="DISTANCE">Distance Learning</SelectItem>
                        <SelectItem value="EVENING">Evening Program</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.studyMode && (
                      <p className="text-sm text-red-500 mt-1">{errors.studyMode.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="academicYear">Academic Year *</Label>
                    <Select onValueChange={(value) => setValue('academicYear', value)}>
                      <SelectTrigger className={errors.academicYear ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2025/2026">2024/2025</SelectItem>
                        <SelectItem value="2026/2027">2025/2026</SelectItem>
                        <SelectItem value="2027/2028">2026/2027</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.academicYear && (
                      <p className="text-sm text-red-500 mt-1">{errors.academicYear.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Required Documents
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Academic Results *</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload your academic results</p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'resultDocument')
                        }}
                        className="hidden"
                        id="resultDocument"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('resultDocument')?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Choose File'}
                      </Button>
                      {uploadedFiles.resultDocument && (
                        <p className="text-sm text-green-600 mt-2 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Uploaded
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Passport Photo</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload passport photo</p>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'passportPhoto')
                        }}
                        className="hidden"
                        id="passportPhoto"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('passportPhoto')?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Choose File'}
                      </Button>
                      {uploadedFiles.passportPhoto && (
                        <p className="text-sm text-green-600 mt-2 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Uploaded
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Birth Certificate</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Upload birth certificate</p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(file, 'birthCertificate')
                        }}
                        className="hidden"
                        id="birthCertificate"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('birthCertificate')?.click()}
                        disabled={uploading}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Choose File'}
                      </Button>
                      {uploadedFiles.birthCertificate && (
                        <p className="text-sm text-green-600 mt-2 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Uploaded
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Emergency Contact Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Emergency Contact Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactName">Emergency Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      {...register('emergencyContactName')}
                      className={errors.emergencyContactName ? 'border-red-500' : ''}
                      placeholder="Full name of emergency contact"
                    />
                    {errors.emergencyContactName && (
                      <p className="text-sm text-red-500 mt-1">{errors.emergencyContactName.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      {...register('emergencyContactPhone')}
                      className={errors.emergencyContactPhone ? 'border-red-500' : ''}
                      placeholder="Phone number"
                    />
                    {errors.emergencyContactPhone && (
                      <p className="text-sm text-red-500 mt-1">{errors.emergencyContactPhone.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyContactRelationship">Relationship *</Label>
                    <Select onValueChange={(value) => setValue('emergencyContactRelationship', value)}>
                      <SelectTrigger className={errors.emergencyContactRelationship ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PARENT">Parent</SelectItem>
                        <SelectItem value="GUARDIAN">Guardian</SelectItem>
                        <SelectItem value="SPOUSE">Spouse</SelectItem>
                        <SelectItem value="SIBLING">Sibling</SelectItem>
                        <SelectItem value="RELATIVE">Relative</SelectItem>
                        <SelectItem value="FRIEND">Friend</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.emergencyContactRelationship && (
                      <p className="text-sm text-red-500 mt-1">{errors.emergencyContactRelationship.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="emergencyContactAddress">Emergency Contact Address *</Label>
                    <Textarea
                      id="emergencyContactAddress"
                      {...register('emergencyContactAddress')}
                      className={errors.emergencyContactAddress ? 'border-red-500' : ''}
                      placeholder="Full address of emergency contact"
                      rows={3}
                    />
                    {errors.emergencyContactAddress && (
                      <p className="text-sm text-red-500 mt-1">{errors.emergencyContactAddress.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Additional Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="previousUniversity">Previous University (If Applicable)</Label>
                    <Input
                      id="previousUniversity"
                      {...register('previousUniversity')}
                      placeholder="Name of previous university"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="workExperience">Work Experience (Optional)</Label>
                    <Textarea
                      id="workExperience"
                      {...register('workExperience')}
                      placeholder="Brief description of relevant work experience"
                      rows={3}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialNeeds">Special Needs or Accommodations (Optional)</Label>
                  <Textarea
                    id="specialNeeds"
                    {...register('specialNeeds')}
                    placeholder="Please describe any special needs or accommodations required"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="motivationStatement">Motivation Statement *</Label>
                  <Textarea
                    id="motivationStatement"
                    {...register('motivationStatement')}
                    className={errors.motivationStatement ? 'border-red-500' : ''}
                    placeholder="Please explain your motivation for choosing this program and how it aligns with your career goals (minimum 50 characters)"
                    rows={5}
                  />
                  {errors.motivationStatement && (
                    <p className="text-sm text-red-500 mt-1">{errors.motivationStatement.message}</p>
                  )}
                </div>
              </div>

              {/* Error/Success Messages */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || uploading || !uploadedFiles.resultDocument}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}