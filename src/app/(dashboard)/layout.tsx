'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useMessages } from '@/contexts/MessagesContext'
import { Button } from '@/components/ui/button'
import { FastNavLink, usePrefetchManager } from '@/components/ui/fast-nav'
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  TrendingUp, 
  User, 
  LogOut, 
  Settings, 
  Users, 
  DollarSign, 
  MessageSquare, 
  Megaphone, 
  Clock, 
  Award,
  Home,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import Loading from '@/components/ui/loading'
import { MobileNav } from '@/components/ui/mobile-nav'
import { SearchComponent } from '@/components/ui/search'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { unreadCount } = useMessages()
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { prefetchCommonRoutes } = usePrefetchManager()

  useEffect(() => {
    // Only redirect if we're definitely unauthenticated
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  // Prefetch common routes for faster navigation
  useEffect(() => {
    if (session?.user?.role) {
      prefetchCommonRoutes(session.user.role)
    }
  }, [session?.user?.role, prefetchCommonRoutes])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownOpen) {
        const target = event.target as Element
        if (!target.closest('.profile-dropdown')) {
          setProfileDropdownOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [profileDropdownOpen])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <Loading message="Loading your portal..." />
      </div>
    )
  }

  if (!session) {
    return null
  }

  const userRole = session.user.role
  const userName = session.user.name || 'User'

  // Navigation items based on user role
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
        { name: 'Academic Calendar', href: '/student/calendar', icon: Calendar },
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
        { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Applications', href: '/admin/applications', icon: FileText },
        { name: 'Course Approval', href: '/admin/course-approval', icon: BookOpen },
        { name: 'Course Management', href: '/admin/courses', icon: BookOpen },
        { name: 'Registration Control', href: '/admin/registration', icon: Calendar },
        { name: 'Finance Management', href: '/admin/finances', icon: DollarSign },
        { name: 'Fee Management', href: '/admin/fees', icon: DollarSign },
        { name: 'Student Credentials', href: '/admin/credentials', icon: Award },
        { name: 'Announcements', href: '/admin/announcements', icon: Megaphone },
        { name: 'Academic Calendar', href: '/admin/calendar', icon: Calendar },
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

  const handleProfileAction = (action: string) => {
    setProfileDropdownOpen(false)
    switch (action) {
      case 'profile':
        router.push(`/${userRole.toLowerCase()}/profile`)
        break
      case 'settings':
        router.push('/settings')
        break
      case 'logout':
        signOut({ callbackUrl: '/auth/login' })
        break
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white shadow-xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        sidebarCollapsed ? "w-16" : "w-64"
      )}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            {!sidebarCollapsed && (
              <span className="ml-3 text-white font-bold text-lg">EduPortal</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              className="hidden lg:block text-white hover:bg-white/20 p-1 rounded"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              className="lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-200">
          <button 
            className="w-full flex items-center hover:bg-gray-50 rounded-lg p-2 transition-colors"
            onClick={() => router.push(`/${userRole.toLowerCase()}/profile`)}
            title={sidebarCollapsed ? "Go to Profile" : undefined}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
              {session?.user?.image ? (
                <img 
                  key={session.user.image}
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 min-w-0 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole.toLowerCase()}</p>
              </div>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-6 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <FastNavLink
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative w-full justify-start",
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700 shadow-sm"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  prefetch={true}
                >
                  <Icon className={cn(
                    "h-5 w-5 flex-shrink-0",
                    sidebarCollapsed ? "mx-auto" : "mr-3",
                    isActive(item.href) ? "text-blue-700" : "text-gray-400 group-hover:text-gray-500"
                  )} />
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                  {isActive(item.href) && !sidebarCollapsed && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-700 rounded-r-full" />
                  )}
                </FastNavLink>
              )
            })}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-gray-700 hover:text-gray-900 hover:bg-gray-50",
              sidebarCollapsed && "justify-center px-2"
            )}
            onClick={() => signOut()}
            title={sidebarCollapsed ? "Sign Out" : undefined}
          >
            <LogOut className={cn(
              "h-5 w-5",
              sidebarCollapsed ? "" : "mr-3"
            )} />
            {!sidebarCollapsed && "Sign Out"}
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 transition-all duration-300",
        sidebarCollapsed ? "lg:ml-0" : "lg:ml-0"
      )}>
        {/* Top navigation */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-3 sm:px-4 lg:px-8">
            <div className="flex items-center min-w-0 flex-1">
              <MobileNav unreadCount={unreadCount} />
              
              <div className="ml-2 sm:ml-4 min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                  {navigationItems.find(item => isActive(item.href))?.name || 'Dashboard'}
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Search Component */}
              <div className="hidden md:block w-48 lg:w-64">
                <SearchComponent
                  placeholder="Quick search..."
                  onResultClick={(result) => router.push(result.url)}
                />
              </div>

              {/* Mobile Search Button */}
              <button
                className="md:hidden p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => router.push('/search')}
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Messages Notification */}
              <button 
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => router.push(`/${userRole.toLowerCase()}/messages`)}
                title="View Messages"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* User menu */}
              <div className="relative profile-dropdown">
                <button 
                  className="flex items-center space-x-2 sm:space-x-3 hover:bg-gray-100 rounded-lg p-1.5 sm:p-2 transition-colors"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-24">{userName}</p>
                    <p className="text-xs text-gray-500 capitalize">{userRole.toLowerCase()}</p>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center overflow-hidden">
                    {session?.user?.image ? (
                      <img 
                        key={session.user.image}
                        src={session.user.image} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                </button>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => handleProfileAction('profile')}
                    >
                      <User className="w-4 h-4 mr-3" />
                      My Profile
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => handleProfileAction('settings')}
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      onClick={() => handleProfileAction('logout')}
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

