'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  FileText, 
  CreditCard, 
  CheckCircle,
  ArrowLeft,
  Award,
  User,
  Shield,
  Clock,
  Download,
  Eye,
  Plus,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import Loading from '@/components/ui/loading'
import PageHeader from '@/components/ui/page-header'
import StatsCard from '@/components/ui/stats-card'
import { getModuleStyles } from '@/lib/design-system'

interface ServiceStats {
  certificates: number
  idCards: number
  clearances: number
  pending: number
}

export default function SelfServicePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<ServiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/login')
      return
    }

    fetchStats()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch stats from all self-service endpoints
      const [certificatesRes, idCardsRes, clearancesRes] = await Promise.all([
        fetch('/api/self-service/certificates'),
        fetch('/api/self-service/id-cards'),
        fetch('/api/self-service/clearance')
      ])

      const [certificatesData, idCardsData, clearancesData] = await Promise.all([
        certificatesRes.json(),
        idCardsRes.json(),
        clearancesRes.json()
      ])

      if (certificatesData.success && idCardsData.success && clearancesData.success) {
        const certificates = certificatesData.data || []
        const idCards = idCardsData.data || []
        const clearances = clearancesData.data || []

        setStats({
          certificates: certificates.length,
          idCards: idCards.length,
          clearances: clearances.length,
          pending: [
            ...certificates.filter((c: any) => c.status === 'PENDING'),
            ...idCards.filter((i: any) => i.status === 'PENDING'),
            ...clearances.filter((c: any) => c.status === 'PENDING')
          ].length
        })
      }

    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to load service statistics')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${getModuleStyles('selfService').background} flex items-center justify-center`}>
        <Loading message="Loading self-service portal..." />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getModuleStyles('selfService').background}`}>
      <PageHeader
        title="Self-Service Portal"
        description="Request certificates, ID cards, and clearance documents"
        module="selfService"
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Requests"
              value={(stats.certificates + stats.idCards + stats.clearances).toString()}
              icon={TrendingUp}
              gradient="violet"
            />
            <StatsCard
              title="Certificates"
              value={stats.certificates.toString()}
              icon={Award}
              gradient="emerald"
            />
            <StatsCard
              title="ID Cards"
              value={stats.idCards.toString()}
              icon={CreditCard}
              gradient="blue"
            />
            <StatsCard
              title="Clearances"
              value={stats.clearances.toString()}
              icon={Shield}
              gradient="orange"
            />
          </div>
        )}

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Certificate Requests */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Certificates</CardTitle>
                  <CardDescription>Request academic certificates and transcripts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Available Types:</span>
                  <Badge variant="outline">5 Types</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Processing Time:</span>
                  <Badge className="bg-green-100 text-green-800">3-5 Days</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery Options:</span>
                  <Badge className="bg-blue-100 text-blue-800">3 Methods</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                  onClick={() => router.push('/self-service/certificates')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request Certificate
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/self-service/certificates/history')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ID Card Requests */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <CreditCard className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">ID Cards</CardTitle>
                  <CardDescription>Request new or replacement student ID cards</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Request Types:</span>
                  <Badge variant="outline">3 Types</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Processing Time:</span>
                  <Badge className="bg-green-100 text-green-800">2-3 Days</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Delivery Options:</span>
                  <Badge className="bg-blue-100 text-blue-800">2 Methods</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  onClick={() => router.push('/self-service/id-cards')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request ID Card
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/self-service/id-cards/history')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Clearance Requests */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Clearance</CardTitle>
                  <CardDescription>Request academic and administrative clearance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Clearance Types:</span>
                  <Badge variant="outline">4 Types</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Processing Time:</span>
                  <Badge className="bg-yellow-100 text-yellow-800">5-7 Days</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Departments:</span>
                  <Badge className="bg-purple-100 text-purple-800">4 Departments</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                  onClick={() => router.push('/self-service/clearance')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Request Clearance
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/self-service/clearance/history')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-violet-600" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>
              Common self-service tasks and information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => router.push('/self-service/certificates')}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm">Request Transcript</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => router.push('/self-service/id-cards')}
              >
                <User className="h-6 w-6" />
                <span className="text-sm">Replace ID Card</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => router.push('/self-service/clearance')}
              >
                <CheckCircle className="h-6 w-6" />
                <span className="text-sm">Graduation Clearance</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col space-y-2"
                onClick={() => router.push('/self-service/help')}
              >
                <Download className="h-6 w-6" />
                <span className="text-sm">Download Forms</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests Alert */}
        {stats && stats.pending > 0 && (
          <Alert className="mt-8 border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              You have {stats.pending} pending request{stats.pending > 1 ? 's' : ''}. 
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2"
                onClick={() => router.push('/self-service/requests')}
              >
                View all requests
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  )
}
