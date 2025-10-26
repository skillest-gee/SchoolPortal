'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  FileText, 
  MessageSquare, 
  Bell, 
  Megaphone, 
  Clock, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Award, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  Key
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  unreadCount?: number
}

export function MobileNav({ unreadCount = 0 }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  if (!session) return null

  const userRole = session.user.role
  const userName = session.user.name || 'User'

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: `/${userRole.toLowerCase()}/dashboard`, icon: Home },
      { name: 'Courses', href: `/${userRole.toLowerCase()}/courses`, icon: BookOpen },
      { name: 'Assignments', href: `/${userRole.toLowerCase()}/assignments`, icon: FileText },
      { name: 'Messages', href: `/${userRole.toLowerCase()}/messages`, icon: MessageSquare },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Announcements', href: '/announcements', icon: Megaphone },
      { name: 'Timetable', href: '/timetable', icon: Clock },
    ]

    if (userRole === 'STUDENT') {
      return [
        ...baseItems,
        { name: 'Course Registration', href: '/student/course-registration', icon: BookOpen },
        { name: 'Assignments', href: '/student/assignments', icon: FileText },
        { name: 'Grades', href: '/student/grades', icon: TrendingUp },
        { name: 'Transcript', href: '/student/transcript', icon: FileText },
        { name: 'Attendance', href: '/student/attendance', icon: Users },
        { name: 'Academic Calendar', href: '/student/calendar', icon: Clock },
        { name: 'Finances', href: '/student/finances', icon: DollarSign },
        { name: 'Self-Service', href: '/self-service', icon: Award },
      ]
        } else if (userRole === 'LECTURER') {
          return [
            { name: 'Dashboard', href: '/lecturer/dashboard', icon: Home },
            { name: 'Courses', href: '/lecturer/courses', icon: BookOpen },
            { name: 'Assignments', href: '/lecturer/assignments', icon: FileText },
            { name: 'Grade Management', href: '/lecturer/grades', icon: TrendingUp },
            { name: 'Student Management', href: '/lecturer/students', icon: Users },
            { name: 'Class Timetable', href: '/lecturer/timetable', icon: Clock },
            { name: 'Messages', href: '/lecturer/messages', icon: MessageSquare },
            { name: 'Notifications', href: '/notifications', icon: Bell },
            { name: 'Announcements', href: '/announcements', icon: Megaphone },
          ]
    } else if (userRole === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Applications', href: '/admin/applications', icon: FileText },
        { name: 'Course Approval', href: '/admin/course-approval', icon: BookOpen },
        { name: 'Course Management', href: '/admin/courses', icon: BookOpen },
        { name: 'Registration Control', href: '/admin/registration', icon: Clock },
        { name: 'Finance Management', href: '/admin/finances', icon: DollarSign },
        { name: 'Fee Management', href: '/admin/fees', icon: DollarSign },
        { name: 'Student Credentials', href: '/admin/credentials', icon: Key },
        { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
        { name: 'Academic Calendar', href: '/admin/calendar', icon: Clock },
        { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'System Settings', href: '/admin/settings', icon: Settings },
      ]
    }
    
    return baseItems
  }

  const navigationItems = getNavigationItems()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  const handleProfileAction = (action: string) => {
    setProfileOpen(false)
    setIsOpen(false)
    switch (action) {
      case 'profile':
        router.push(`/${userRole.toLowerCase()}/profile`)
        break
      case 'settings':
        router.push('/settings')
        break
      case 'logout':
        // Handle logout
        break
    }
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden p-2"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Navigation Panel */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">EduPortal</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* User Profile Section */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{userName}</p>
                    <p className="text-sm text-gray-500 capitalize">{userRole.toLowerCase()}</p>
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 overflow-y-auto p-4">
                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isItemActive = isActive(item.href)
                    const showBadge = item.name === 'Messages' && unreadCount > 0
                    
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                          isItemActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={cn(
                            "h-5 w-5",
                            isItemActive ? "text-blue-700" : "text-gray-400"
                          )} />
                          <span>{item.name}</span>
                        </div>
                        {showBadge && (
                          <span className="h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Profile Actions */}
              <div className="p-4 border-t">
                <div className="space-y-2">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <span>Profile</span>
                    </div>
                    <ChevronDown className={cn(
                      "h-4 w-4 text-gray-400 transition-transform",
                      profileOpen && "rotate-180"
                    )} />
                  </button>
                  
                  {profileOpen && (
                    <div className="ml-6 space-y-1">
                      <button
                        onClick={() => handleProfileAction('profile')}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => handleProfileAction('settings')}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </button>
                      <button
                        onClick={() => handleProfileAction('logout')}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
