'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CreditCard,
  Calendar,
  Download,
  Filter,
  Search,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import Loading from '@/components/ui/loading'
import { EnhancedMobileTable } from '@/components/ui/mobile-table-enhanced'

interface FinancialSummary {
  totalRevenue: number
  totalFees: number
  paidAmount: number
  outstandingAmount: number
  totalStudents: number
  paidStudents: number
  unpaidStudents: number
}

interface PaymentRecord {
  id: string
  studentId: string
  studentName: string
  amount: number
  description: string
  status: 'COMPLETED' | 'PENDING' | 'FAILED'
  paymentDate: string
  method: string
}

export default function AdminFinancesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalFees: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    totalStudents: 0,
    paidStudents: 0,
    unpaidStudents: 0
  })
  const [recentPayments, setRecentPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('current')
  const [selectedStatus, setSelectedStatus] = useState('all')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    fetchFinancialData()
  }, [session, status, router, selectedPeriod])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch financial summary
      const summaryResponse = await fetch('/api/admin/financial-summary')
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json()
        if (summaryData.success) {
          setFinancialSummary(summaryData.data)
        }
      }

      // Fetch recent payments
      const paymentsResponse = await fetch(`/api/admin/payments?period=${selectedPeriod}&status=${selectedStatus}`)
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        if (paymentsData.success) {
          setRecentPayments(paymentsData.data)
        }
      }

    } catch (error) {
      console.error('Error fetching financial data:', error)
      setError('Failed to load financial data')
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/admin/financial-export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      setError('Failed to export financial data')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading financial data..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const paymentRate = financialSummary.totalStudents > 0 
    ? ((financialSummary.paidStudents / financialSummary.totalStudents) * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <DollarSign className="h-6 w-6 mr-2 text-green-600" />
                Financial Management
              </h1>
              <p className="text-gray-600 mt-1">Monitor revenue, payments, and financial analytics</p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={handleExportData}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => router.push('/admin/fees')}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Manage Fees
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialSummary.totalRevenue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialSummary.paidAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(financialSummary.outstandingAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Payment Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {paymentRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="period">Period:</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="status">Status:</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              onClick={fetchFinancialData}
              className="ml-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Recent Payments */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Recent Payments
            </CardTitle>
            <CardDescription>
              Latest payment transactions and their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedMobileTable
              data={recentPayments}
              columns={[
                {
                  key: 'student',
                  label: 'Student',
                  mobileLabel: 'Student',
                  render: (_, payment) => (
                    <div className="font-medium">{payment.studentName}</div>
                  ),
                  mobileRender: (_, payment) => payment.studentName
                },
                {
                  key: 'amount',
                  label: 'Amount',
                  mobileLabel: 'Amount',
                  render: (_, payment) => (
                    <div className="font-semibold text-green-600">${payment.amount.toFixed(2)}</div>
                  ),
                  mobileRender: (_, payment) => (
                    <span className="font-semibold text-green-600">${payment.amount.toFixed(2)}</span>
                  )
                },
                {
                  key: 'description',
                  label: 'Description',
                  mobileLabel: 'Fee Type',
                  render: (_, payment) => payment.description,
                  mobileRender: (_, payment) => payment.description
                },
                {
                  key: 'status',
                  label: 'Status',
                  mobileLabel: 'Status',
                  render: (_, payment) => {
                    const statusColors: Record<string, string> = {
                      COMPLETED: 'bg-green-100 text-green-800',
                      PENDING: 'bg-yellow-100 text-yellow-800',
                      FAILED: 'bg-red-100 text-red-800'
                    }
                    return (
                      <Badge className={statusColors[payment.status] || 'bg-gray-100 text-gray-800'}>
                        {payment.status}
                      </Badge>
                    )
                  },
                  mobileRender: (_, payment) => {
                    const statusColors: Record<string, string> = {
                      COMPLETED: 'bg-green-100 text-green-800',
                      PENDING: 'bg-yellow-100 text-yellow-800',
                      FAILED: 'bg-red-100 text-red-800'
                    }
                    return (
                      <Badge className={statusColors[payment.status] || 'bg-gray-100 text-gray-800'}>
                        {payment.status}
                      </Badge>
                    )
                  }
                },
                {
                  key: 'date',
                  label: 'Date',
                  mobileLabel: 'Date',
                  render: (_, payment) => new Date(payment.paymentDate).toLocaleDateString(),
                  mobileRender: (_, payment) => new Date(payment.paymentDate).toLocaleDateString()
                },
                {
                  key: 'method',
                  label: 'Method',
                  mobileLabel: 'Payment Method',
                  render: (_, payment) => payment.method || 'N/A',
                  mobileRender: (_, payment) => payment.method || 'N/A',
                  hideOnMobile: true
                }
              ]}
              emptyMessage="No payment records found"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
