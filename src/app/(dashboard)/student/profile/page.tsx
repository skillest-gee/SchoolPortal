'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, BookOpen, Award, DollarSign, Clock, Edit, Camera, Home, MapPin as MapPinIcon } from 'lucide-react'
import Loading from '@/components/ui/loading'

export default function StudentProfile() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    // Personal Information (Read-only)
    title: '',
    firstName: '',
    middleName: '',
    surname: '',
    
    // Academic Information (Read-only)
    programme: '',
    currentMajor: '',
    gender: '',
    dateOfBirth: '',
    level: '',
    hall: '',
    
    // Contact Information
    institutionalEmail: '', // Read-only
    roomNo: '',
    personalEmail: '',
    campusAddress: '',
    gpsAddress: '',
    cellphone: '',
    homePhone: '',
    
    // Address Information
    homeAddress: '',
    postalAddress: '',
    postalTown: '',
    placeOfBirth: '',
    hometown: ''
  })

  useEffect(() => {
    // Only redirect if we're definitely unauthenticated or wrong role
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (session && session.user.role !== 'STUDENT') {
      router.push('/auth/login')
    }
  }, [status, session?.user.role, router])

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (session?.user.role === 'STUDENT') {
        try {
          setLoading(true)
          const response = await fetch('/api/students/profile')
          const result = await response.json()
          
          if (result.success && result.data.profile) {
            const profile = result.data.profile
            // Set profile image from session or user data
            setProfileImage(session?.user?.image || result.data.user?.image || null)
            setFormData({
              // Personal Information (Read-only)
              title: profile.title || '',
              firstName: profile.firstName || '',
              middleName: profile.middleName || '',
              surname: profile.surname || '',
              
              // Academic Information (Read-only)
              programme: profile.programme || '',
              currentMajor: profile.currentMajor || '',
              gender: profile.gender || '',
              dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              }) : '',
              level: profile.level || '',
              hall: profile.hall || '',
              
              // Contact Information
              institutionalEmail: profile.institutionalEmail || '',
              roomNo: profile.roomNo || '',
              personalEmail: profile.personalEmail || '',
              campusAddress: profile.campusAddress || '',
              gpsAddress: profile.gpsAddress || '',
              cellphone: profile.cellphone || '',
              homePhone: profile.homePhone || '',
              
              // Address Information
              homeAddress: profile.homeAddress || '',
              postalAddress: profile.postalAddress || '',
              postalTown: profile.postalTown || '',
              placeOfBirth: profile.placeOfBirth || '',
              hometown: profile.hometown || ''
            })
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProfile()
  }, [session])

  // Set profile image from session
  useEffect(() => {
    if (session?.user?.image) {
      setProfileImage(session.user.image)
    }
  }, [session])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'profile')
      formData.append('userId', session?.user?.id || '')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update local state immediately for better UX
          setProfileImage(data.filePath)
          
          // Also update the session user image immediately for consistency
          if (session?.user) {
            session.user.image = data.filePath
          }
          
          // Update user profile in database
          const profileResponse = await fetch('/api/students/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileImage: data.filePath }),
          })

          if (profileResponse.ok) {
            // Show success message
            alert('Profile picture updated successfully!')
            
            // Refresh the page to ensure the session is updated everywhere
            // This is the most reliable way to update the session across all components
            setTimeout(() => {
              window.location.reload()
            }, 1000)
          } else {
            throw new Error('Failed to update profile in database')
          }
        } else {
          throw new Error('Upload failed')
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload image')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      alert(`Error uploading image: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Reset profile image on error
      setProfileImage(session?.user?.image || null)
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleUpdate = async () => {
    try {
      const response = await fetch('/api/students/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setIsEditing(false)
        // Show success message
        alert('Profile updated successfully!')
      } else {
        alert('Error updating profile. Please try again.')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading your profile..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white -mr-4 sm:-mr-6 lg:-mr-8 mb-8">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-white text-blue-600 p-1 sm:p-1.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold mb-1">YOUR PERSONAL DETAILS</h1>
                <p className="text-blue-100 text-sm sm:text-base">Student Profile Management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              {isEditing && (
                <Button 
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-gray-50 text-xs sm:text-sm"
                  onClick={handleUpdate}
                >
                  UPDATE
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Personal Information Section */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">TITLE</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    disabled={true}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">NAME (first name)</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    disabled={true}
                    className="bg-gray-50 text-gray-600 uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="middleName" className="text-sm font-medium text-gray-700">NAME (middle name)</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    disabled={true}
                    className="bg-gray-50 text-gray-600 uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="surname" className="text-sm font-medium text-gray-700">NAME (surname)</Label>
                  <Input
                    id="surname"
                    value={formData.surname}
                    disabled={true}
                    className="bg-gray-50 text-gray-600 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-600" />
                Academic Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="programme" className="text-sm font-medium text-gray-700">PROGRAMME</Label>
                  <Input
                    id="programme"
                    value={formData.programme}
                    disabled={true}
                    className="bg-gray-50 text-gray-600 uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="currentMajor" className="text-sm font-medium text-gray-700">CURRENT MAJOR (Combination)</Label>
                  <Input
                    id="currentMajor"
                    value={formData.currentMajor}
                    disabled={true}
                    className="bg-gray-50 text-gray-600 uppercase"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-sm font-medium text-gray-700">GENDER</Label>
                  <Input
                    id="gender"
                    value={formData.gender}
                    disabled={true}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">DATE OF BIRTH</Label>
                  <Input
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    disabled={true}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="level" className="text-sm font-medium text-gray-700">LEVEL</Label>
                  <Input
                    id="level"
                    value={formData.level}
                    disabled={true}
                    className="bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="hall" className="text-sm font-medium text-gray-700">HALL</Label>
                  <Input
                    id="hall"
                    value={formData.hall}
                    disabled={true}
                    className="bg-gray-50 text-gray-600 uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Address Information Section */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
                Contact & Address Information
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="institutionalEmail" className="text-sm font-medium text-gray-700">INSTITUTIONAL EMAIL</Label>
                    <Input
                      id="institutionalEmail"
                      value={formData.institutionalEmail}
                      disabled={true}
                      className="bg-gray-50 text-gray-600 lowercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="roomNo" className="text-sm font-medium text-gray-700">ROOM NO. (hall residents only)</Label>
                    <Input
                      id="roomNo"
                      value={formData.roomNo}
                      onChange={(e) => handleInputChange('roomNo', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter room number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="personalEmail" className="text-sm font-medium text-gray-700">Personal Email.</Label>
                    <Input
                      id="personalEmail"
                      value={formData.personalEmail}
                      onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter personal email"
                      className="lowercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="campusAddress" className="text-sm font-medium text-gray-700">CAMPUS ADDRESS (where you stay on campus)*</Label>
                    <Input
                      id="campusAddress"
                      value={formData.campusAddress}
                      onChange={(e) => handleInputChange('campusAddress', e.target.value)}
                      disabled={!isEditing}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gpsAddress" className="text-sm font-medium text-gray-700">GPS ADDRESS</Label>
                    <Input
                      id="gpsAddress"
                      value={formData.gpsAddress}
                      onChange={(e) => handleInputChange('gpsAddress', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cellphone" className="text-sm font-medium text-gray-700">CELLPHONE*</Label>
                    <Input
                      id="cellphone"
                      value={formData.cellphone}
                      onChange={(e) => handleInputChange('cellphone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="homePhone" className="text-sm font-medium text-gray-700">HOME PHONE*</Label>
                    <Input
                      id="homePhone"
                      value={formData.homePhone}
                      onChange={(e) => handleInputChange('homePhone', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="homeAddress" className="text-sm font-medium text-gray-700">HOME ADDRESS (hse no./location)</Label>
                    <Input
                      id="homeAddress"
                      value={formData.homeAddress}
                      onChange={(e) => handleInputChange('homeAddress', e.target.value)}
                      disabled={!isEditing}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalAddress" className="text-sm font-medium text-gray-700">POSTAL ADDRESS</Label>
                    <Input
                      id="postalAddress"
                      value={formData.postalAddress}
                      onChange={(e) => handleInputChange('postalAddress', e.target.value)}
                      disabled={!isEditing}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalTown" className="text-sm font-medium text-gray-700">POSTAL TOWN</Label>
                    <Input
                      id="postalTown"
                      value={formData.postalTown}
                      onChange={(e) => handleInputChange('postalTown', e.target.value)}
                      disabled={!isEditing}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="placeOfBirth" className="text-sm font-medium text-gray-700">PLACE OF BIRTH*</Label>
                    <Input
                      id="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                      disabled={!isEditing}
                      className="uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hometown" className="text-sm font-medium text-gray-700">HOMETOWN*</Label>
                    <Input
                      id="hometown"
                      value={formData.hometown}
                      onChange={(e) => handleInputChange('hometown', e.target.value)}
                      disabled={!isEditing}
                      className="uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
                  UPDATE
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
