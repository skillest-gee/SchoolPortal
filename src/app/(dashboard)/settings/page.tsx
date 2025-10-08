'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Lock, Bell, Shield, ArrowLeft } from 'lucide-react'
import ChangePasswordForm from '@/components/forms/change-password-form'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('password')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }
  }, [session, status, router])

  const handlePasswordChangeSuccess = () => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 5000)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const tabs = [
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showSuccess && (
          <Alert className="mb-6">
            <AlertDescription>Password changed successfully!</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium text-left transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* User Info Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Account Information</span>
                    </CardTitle>
                    <CardDescription>
                      Your current account details
                    </CardDescription>
                  </div>
                  <Badge className={
                    session.user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                    session.user.role === 'LECTURER' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {session.user.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{session.user.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{session.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">User ID</label>
                    <p className="text-sm text-gray-900 font-mono">{session.user.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Status</label>
                    <p className="text-sm text-green-600">Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tab Content */}
            {activeTab === 'password' && (
              <ChangePasswordForm onSuccess={handlePasswordChangeSuccess} />
            )}

            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profile Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Update your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Management</h3>
                    <p className="text-gray-500 mb-4">
                      Profile management features will be available in a future update.
                    </p>
                    <p className="text-sm text-gray-400">
                      Contact your administrator to update profile information.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bell className="h-5 w-5" />
                    <span>Notification Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Notification Preferences</h3>
                    <p className="text-gray-500 mb-4">
                      Notification settings will be available in a future update.
                    </p>
                    <p className="text-sm text-gray-400">
                      You'll be able to customize email and SMS notifications.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Manage your account security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Coming Soon
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Login History</h4>
                        <p className="text-sm text-gray-500">View your recent login activity</p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Coming Soon
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Active Sessions</h4>
                        <p className="text-sm text-gray-500">Manage your active login sessions</p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
