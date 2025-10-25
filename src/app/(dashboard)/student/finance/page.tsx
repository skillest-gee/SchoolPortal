'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface Fee {
  id: string
  type: string
  description: string
  amount: number
  paidAmount: number
  outstandingAmount: number
  dueDate: string
  status: string
  createdAt: string
  payments: Array<{
    id: string
    amount: number
    status: string
    createdAt: string
  }>
}

interface Payment {
  id: string
  amount: number
  paymentMethod: string
  reference: string
  status: string
  createdAt: string
  fee: {
    type: string
    description: string
    amount: number
  }
}

export default function StudentFinancePortal() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fees, setFees] = useState<Fee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState({
    totalFees: 0,
    paidAmount: 0,
    outstandingAmount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedFee, setSelectedFee] = useState('')
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

    fetchFinanceData()
  }, [session, status, router])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      
      // Fetch fees
      const feesResponse = await fetch('/api/fees')
      if (feesResponse.ok) {
        const feesData = await feesResponse.json()
        if (feesData.success) {
          setFees(feesData.data.summary.fees)
          setSummary({
            totalFees: feesData.data.summary.totalFees,
            paidAmount: feesData.data.summary.paidAmount,
            outstandingAmount: feesData.data.summary.outstandingAmount
          })
        }
      }

      // Fetch payments
      const paymentsResponse = await fetch('/api/payments')
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        if (paymentsData.success) {
          setPayments(paymentsData.data)
        }
      }
    } catch (error) {
      console.error('Error fetching finance data:', error)
      setError('Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedFee || !paymentForm.amount) {
      setError('Please select a fee and enter payment amount')
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feeId: selectedFee,
          amount: parseFloat(paymentForm.amount),
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference,
          notes: paymentForm.notes
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Payment recorded successfully!')
        setPaymentForm({
          amount: '',
          paymentMethod: 'BANK_TRANSFER',
          reference: '',
          notes: ''
        })
        setSelectedFee('')
        fetchFinanceData()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to record payment')
      }
    } catch (error) {
      setError('Failed to record payment')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading finance portal..." />
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  const outstandingFees = fees.filter(fee => fee.outstandingAmount > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Finance Portal</h1>
            <p className="mt-2 text-gray-600">Manage your fees and payments</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Fees</p>
                  <p className="text-2xl font-bold text-gray-900">${summary.totalFees.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid Amount</p>
                  <p className="text-2xl font-bold text-green-600">${summary.paidAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Outstanding</p>
                  <p className="text-2xl font-bold text-red-600">${summary.outstandingAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Make Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Make Payment
              </CardTitle>
              <CardDescription>
                Record a payment for your fees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fee">Select Fee</Label>
                <Select value={selectedFee} onValueChange={setSelectedFee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a fee to pay" />
                  </SelectTrigger>
                  <SelectContent>
                    {outstandingFees.map(fee => (
                      <SelectItem key={fee.id} value={fee.id}>
                        {fee.description} - Outstanding: ${fee.outstandingAmount.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFee && (
                <>
                  <div>
                    <Label htmlFor="amount">Payment Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm(prev => ({ ...prev, paymentMethod: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      value={paymentForm.reference}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, reference: e.target.value }))}
                      placeholder="Payment reference"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes"
                    />
                  </div>

                  <Button 
                    onClick={handlePayment} 
                    disabled={!paymentForm.amount}
                    className="w-full"
                  >
                    Record Payment
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fee Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Fee Details
              </CardTitle>
              <CardDescription>
                Your current fee status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fees.length > 0 ? (
                  fees.map(fee => (
                    <div key={fee.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{fee.description}</h3>
                        <Badge variant={fee.status === 'PAID' ? 'default' : 'secondary'}>
                          {fee.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <span className="ml-2 font-semibold">${fee.amount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Paid:</span>
                          <span className="ml-2 font-semibold text-green-600">${fee.paidAmount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Outstanding:</span>
                          <span className="ml-2 font-semibold text-red-600">${fee.outstandingAmount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Due:</span>
                          <span className="ml-2">{new Date(fee.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">No fees found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Payment History
            </CardTitle>
            <CardDescription>
              Your recent payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-4">
                {payments.map(payment => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{payment.fee.description}</h3>
                      <Badge variant="default">
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Amount:</span>
                        <span className="ml-2 font-semibold">${payment.amount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Method:</span>
                        <span className="ml-2">{payment.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reference:</span>
                        <span className="ml-2">{payment.reference}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2">{new Date(payment.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No payment history found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
