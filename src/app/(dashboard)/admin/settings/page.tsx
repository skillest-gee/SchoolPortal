'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Alert } from '@/components/ui/alert'
import Loading from '@/components/ui/loading'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Shield, 
  Mail, 
  Database, 
  Bell, 
  Globe,
  Lock,
  Users,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface SystemSettings {
  // General Settings
  universityName: string
  universityEmail: string
  universityPhone: string
  universityAddress: string
  timezone: string
  language: string
  
  // Academic Settings
  academicYear: string
  semester: string
  maxCourseCredits: number
  minCourseCredits: number
  enrollmentDeadline: string
  
  // System Settings
  maintenanceMode: boolean
  registrationOpen: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  
  // Security Settings
  passwordMinLength: number
  sessionTimeout: number
  twoFactorAuth: boolean
  ipWhitelist: string[]
  
  // Backup Settings
  autoBackup: boolean
  backupFrequency: string
  backupRetention: number
}

export default function SystemSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [settings, setSettings] = useState<SystemSettings>({
    // General Settings
    universityName: 'University of Technology',
    universityEmail: 'admin@university.edu',
    universityPhone: '+1 (555) 123-4567',
    universityAddress: '123 University Avenue, City, State 12345',
    timezone: 'UTC-5',
    language: 'en',
    
    // Academic Settings
    academicYear: '2024/2025',
    semester: 'First Semester',
    maxCourseCredits: 18,
    minCourseCredits: 12,
    enrollmentDeadline: '2024-08-15',
    
    // System Settings
    maintenanceMode: false,
    registrationOpen: true,
    emailNotifications: true,
    smsNotifications: false,
    
    // Security Settings
    passwordMinLength: 8,
    sessionTimeout: 30,
    twoFactorAuth: false,
    ipWhitelist: [],
    
    // Backup Settings
    autoBackup: true,
    backupFrequency: 'daily',
    backupRetention: 30
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    // Load settings from API
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setSettings(data.data)
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [session, status, router])

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setSuccess('Settings saved successfully!')
          setTimeout(() => setSuccess(''), 3000)
        } else {
          setError(data.error || 'Failed to save settings')
        }
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings({
      universityName: 'University of Technology',
      universityEmail: 'admin@university.edu',
      universityPhone: '+1 (555) 123-4567',
      universityAddress: '123 University Avenue, City, State 12345',
      timezone: 'UTC-5',
      language: 'en',
      academicYear: '2024/2025',
      semester: 'First Semester',
      maxCourseCredits: 18,
      minCourseCredits: 12,
      enrollmentDeadline: '2024-08-15',
      maintenanceMode: false,
      registrationOpen: true,
      emailNotifications: true,
      smsNotifications: false,
      passwordMinLength: 8,
      sessionTimeout: 30,
      twoFactorAuth: false,
      ipWhitelist: [],
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading system settings..." />
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="h-6 w-6 mr-2 text-purple-600" />
                System Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Configure system-wide settings and preferences
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="text-red-800">{error}</div>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-green-800">{success}</div>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-blue-600" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic university information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="universityName">University Name</Label>
                <Input
                  id="universityName"
                  value={settings.universityName}
                  onChange={(e) => setSettings({...settings, universityName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="universityEmail">University Email</Label>
                <Input
                  id="universityEmail"
                  type="email"
                  value={settings.universityEmail}
                  onChange={(e) => setSettings({...settings, universityEmail: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="universityPhone">University Phone</Label>
                <Input
                  id="universityPhone"
                  value={settings.universityPhone}
                  onChange={(e) => setSettings({...settings, universityPhone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="universityAddress">University Address</Label>
                <Textarea
                  id="universityAddress"
                  value={settings.universityAddress}
                  onChange={(e) => setSettings({...settings, universityAddress: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => setSettings({...settings, timezone: value})}
                  >
                    <option value="UTC-5">UTC-5 (EST)</option>
                    <option value="UTC-6">UTC-6 (CST)</option>
                    <option value="UTC-7">UTC-7 (MST)</option>
                    <option value="UTC-8">UTC-8 (PST)</option>
                    <option value="UTC+0">UTC+0 (GMT)</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => setSettings({...settings, language: value})}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                Academic Settings
              </CardTitle>
              <CardDescription>
                Academic year and course configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={settings.academicYear}
                    onChange={(e) => setSettings({...settings, academicYear: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="semester">Current Semester</Label>
                  <Select
                    value={settings.semester}
                    onValueChange={(value) => setSettings({...settings, semester: value})}
                  >
                    <option value="First Semester">First Semester</option>
                    <option value="Second Semester">Second Semester</option>
                    <option value="Summer Semester">Summer Semester</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxCourseCredits">Max Course Credits</Label>
                  <Input
                    id="maxCourseCredits"
                    type="number"
                    value={settings.maxCourseCredits}
                    onChange={(e) => setSettings({...settings, maxCourseCredits: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="minCourseCredits">Min Course Credits</Label>
                  <Input
                    id="minCourseCredits"
                    type="number"
                    value={settings.minCourseCredits}
                    onChange={(e) => setSettings({...settings, minCourseCredits: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="enrollmentDeadline">Enrollment Deadline</Label>
                <Input
                  id="enrollmentDeadline"
                  type="date"
                  value={settings.enrollmentDeadline}
                  onChange={(e) => setSettings({...settings, enrollmentDeadline: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                System Settings
              </CardTitle>
              <CardDescription>
                System behavior and feature toggles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Temporarily disable system access</p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="registrationOpen">Registration Open</Label>
                  <p className="text-sm text-gray-500">Allow course registration</p>
                </div>
                <Switch
                  id="registrationOpen"
                  checked={settings.registrationOpen}
                  onCheckedChange={(checked) => setSettings({...settings, registrationOpen: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send email notifications</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smsNotifications">SMS Notifications</Label>
                  <p className="text-sm text-gray-500">Send SMS notifications</p>
                </div>
                <Switch
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-600" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Security policies and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="passwordMinLength">Min Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({...settings, twoFactorAuth: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Backup Settings */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-orange-600" />
                Backup & Maintenance
              </CardTitle>
              <CardDescription>
                Data backup and system maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoBackup">Automatic Backup</Label>
                  <p className="text-sm text-gray-500">Enable automatic database backups</p>
                </div>
                <Switch
                  id="autoBackup"
                  checked={settings.autoBackup}
                  onCheckedChange={(checked) => setSettings({...settings, autoBackup: checked})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select
                    value={settings.backupFrequency}
                    onValueChange={(value) => setSettings({...settings, backupFrequency: value})}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={settings.backupRetention}
                    onChange={(e) => setSettings({...settings, backupRetention: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
