'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Receipt,
  PieChart,
  ArrowLeft
} from 'lucide-react'

interface Fee {
  id: string
  amount: number
  description: string
  dueDate: string
  feeType: string
  academicYear: string
  semester?: string
  totalPaid: number
  remaining: number
  isPaid: boolean
  isOverdue: boolean
  paymentStatus: string
  payments: Payment[]
}

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  reference: string
  paymentDate: string
  notes?: string
}

interface FinancialStats {
  totalFees: number
  totalPaid: number
  totalRemaining: number
  overdueAmount: number
  paidFees: number
  pendingFees: number
  overdueFees: number
}

export default function StudentFinancesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fees, setFees] = useState<Fee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<FinancialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    notes: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchFinancialData()
  }, [session, status, router])

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      setError('')

      // Fetch fees
      const feesResponse = await fetch('/api/finance/fees')
      const feesData = await feesResponse.json()

      if (feesData.success) {
        setFees(feesData.data)
      }

      // Fetch payments
      const paymentsResponse = await fetch('/api/finance/payments')
      const paymentsData = await paymentsResponse.json()

      if (paymentsData.success) {
        setPayments(paymentsData.data)
      }

      // Calculate statistics
      const totalFees = feesData.data.reduce((sum: number, fee: Fee) => sum + fee.amount, 0)
      const totalPaid = feesData.data.reduce((sum: number, fee: Fee) => sum + fee.totalPaid, 0)
      const totalRemaining = feesData.data.reduce((sum: number, fee: Fee) => sum + fee.remaining, 0)
      const overdueAmount = feesData.data
        .filter((fee: Fee) => fee.isOverdue)
        .reduce((sum: number, fee: Fee) => sum + fee.remaining, 0)
      
      const paidFees = feesData.data.filter((fee: Fee) => fee.isPaid).length
      const pendingFees = feesData.data.filter((fee: Fee) => !fee.isPaid && !fee.isOverdue).length
      const overdueFees = feesData.data.filter((fee: Fee) => fee.isOverdue).length

      setStats({
        totalFees,
        totalPaid,
        totalRemaining,
        overdueAmount,
        paidFees,
        pendingFees,
        overdueFees
      })

    } catch (error) {
      console.error('Error fetching financial data:', error)
      setError('Failed to load financial information')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFeeTypeColor = (feeType: string) => {
    switch (feeType) {
      case 'TUITION':
        return 'bg-blue-100 text-blue-800'
      case 'ACCOMMODATION':
        return 'bg-green-100 text-green-800'
      case 'LIBRARY':
        return 'bg-purple-100 text-purple-800'
      case 'LABORATORY':
        return 'bg-orange-100 text-orange-800'
      case 'EXAMINATION':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusBadge = (fee: Fee) => {
    if (fee.isPaid) {
      return <Badge className="bg-green-100 text-green-800">Paid</Badge>
    } else if (fee.isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="h-4 w-4" />
      case 'BANK_TRANSFER':
        return <CreditCard className="h-4 w-4" />
      case 'MOBILE_MONEY':
        return <CreditCard className="h-4 w-4" />
      case 'CARD':
        return <CreditCard className="h-4 w-4" />
      case 'CHEQUE':
        return <Receipt className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const handlePayFee = (fee: Fee) => {
    setSelectedFee(fee)
    setPaymentForm({
      amount: fee.remaining.toString(),
      paymentMethod: 'BANK_TRANSFER',
      reference: '',
      notes: ''
    })
    setShowPaymentForm(true)
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFee) return

    setPaymentLoading(true)
    try {
      const response = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feeId: selectedFee.id,
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference,
          notes: paymentForm.notes
        })
      })

      const data = await response.json()

      if (data.success) {
        // Refresh data
        await fetchFees()
        setShowPaymentForm(false)
        setSelectedFee(null)
        setPaymentForm({
          amount: '',
          paymentMethod: 'BANK_TRANSFER',
          reference: '',
          notes: ''
        })
        setError('')
      } else {
        setError(data.error || 'Payment failed')
      }
    } catch (error) {
      setError('Payment failed. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading your financial information...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/student/dashboard')}
                className="bg-white/50 hover:bg-white/80 border-white/20"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Finances
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">Track your fees and payments</p>
              </div>
            </div>
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

        {/* Financial Overview Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-blue-100 text-xs sm:text-sm font-medium">Total Fees</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.totalFees)}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-white/20 rounded-full flex-shrink-0">
                    <DollarSign className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-green-100 text-xs sm:text-sm font-medium">Total Paid</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.totalPaid)}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-white/20 rounded-full flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-yellow-100 text-xs sm:text-sm font-medium">Remaining</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.totalRemaining)}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-white/20 rounded-full flex-shrink-0">
                    <Clock className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-red-100 text-xs sm:text-sm font-medium">Overdue</p>
                    <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrency(stats.overdueAmount)}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-white/20 rounded-full flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Overview */}
        {stats && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-blue-600" />
                <span>Payment Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-600">
                    {stats.totalFees > 0 ? Math.round((stats.totalPaid / stats.totalFees) * 100) : 0}%
                  </span>
                </div>
                <Progress 
                  value={stats.totalFees > 0 ? (stats.totalPaid / stats.totalFees) * 100 : 0} 
                  className="h-3"
                />
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.paidFees}</p>
                    <p className="text-sm text-green-600">Paid</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingFees}</p>
                    <p className="text-sm text-yellow-600">Pending</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats.overdueFees}</p>
                    <p className="text-sm text-red-600">Overdue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs for Fees and Payments */}
        <Tabs defaultValue="fees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border-white/20">
            <TabsTrigger value="fees" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Fees & Charges
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Payment History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fees" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5 text-blue-600" />
                  <span>Fee Structure</span>
                </CardTitle>
                <CardDescription>
                  View all your fees and payment status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fees.length > 0 ? (
                  <div className="space-y-4">
                    {fees.map((fee) => (
                      <div key={fee.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 bg-white/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Badge className={getFeeTypeColor(fee.feeType)}>
                              {fee.feeType.replace('_', ' ')}
                            </Badge>
                            {getPaymentStatusBadge(fee)}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(fee.amount)}</p>
                            <p className="text-sm text-gray-500">Due: {formatDate(fee.dueDate)}</p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">{fee.description}</h4>
                          <p className="text-sm text-gray-600">
                            {fee.academicYear} {fee.semester && `• ${fee.semester} Semester`}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Payment Progress</span>
                            <span>{formatCurrency(fee.totalPaid)} / {formatCurrency(fee.amount)}</span>
                          </div>
                          <Progress 
                            value={fee.amount > 0 ? (fee.totalPaid / fee.amount) * 100 : 0} 
                            className="h-2"
                          />
                        </div>

                        {fee.remaining > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-yellow-800">
                                <strong>Remaining Balance:</strong> {formatCurrency(fee.remaining)}
                              </p>
                              <Button
                                size="sm"
                                onClick={() => router.push(`/student/finances/pay/${fee.id}`)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Pay Now
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Fees Found</h3>
                    <p className="text-gray-500">You don't have any fees assigned yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <span>Payment History</span>
                </CardTitle>
                <CardDescription>
                  Track all your payment transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 bg-white/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              {getPaymentMethodIcon(payment.paymentMethod)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {payment.paymentMethod.replace('_', ' ')} Payment
                              </h4>
                              <p className="text-sm text-gray-500">Ref: {payment.reference}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-600">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-gray-500">{formatDate(payment.paymentDate)}</p>
                          </div>
                        </div>

                        {payment.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{payment.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
                    <p className="text-gray-500">You haven't made any payments yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
