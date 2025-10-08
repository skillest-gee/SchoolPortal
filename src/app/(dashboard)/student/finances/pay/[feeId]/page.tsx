'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  ArrowLeft, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Receipt,
  Smartphone,
  Building2
} from 'lucide-react'

const paymentSchema = z.object({
  amount: z.string().min(1, 'Amount is required').transform(val => parseFloat(val)),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  reference: z.string().min(1, 'Payment reference is required'),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

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
  student: {
    id: string
    name: string
    email: string
  }
}

export default function PaymentPage({ params }: { params: { feeId: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fee, setFee] = useState<Fee | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  })

  const watchedAmount = watch('amount')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchFee()
  }, [session, status, router, params.feeId])

  const fetchFee = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/finance/fees?studentId=${session?.user.id}`)
      const data = await response.json()

      if (data.success) {
        const foundFee = data.data.find((f: Fee) => f.id === params.feeId)
        if (foundFee) {
          setFee(foundFee)
          setValue('amount', foundFee.remaining.toString())
        } else {
          setError('Fee not found or you do not have access to it')
        }
      } else {
        setError('Failed to load fee information')
      }

    } catch (error) {
      console.error('Error fetching fee:', error)
      setError('Failed to load fee information')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: PaymentFormData) => {
    if (!fee) return

    // Validate payment amount
    if (data.amount > fee.remaining) {
      setError(`Payment amount cannot exceed remaining balance of $${fee.remaining.toFixed(2)}`)
      return
    }

    if (data.amount <= 0) {
      setError('Payment amount must be greater than 0')
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/finance/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          feeId: fee.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process payment')
      }

      setSuccess('Payment processed successfully!')
      
      // Redirect to finances page after a short delay
      setTimeout(() => {
        router.push('/student/finances')
      }, 3000)

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process payment')
    } finally {
      setProcessing(false)
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <DollarSign className="h-5 w-5" />
      case 'BANK_TRANSFER':
        return <Building2 className="h-5 w-5" />
      case 'MOBILE_MONEY':
        return <Smartphone className="h-5 w-5" />
      case 'CARD':
        return <CreditCard className="h-5 w-5" />
      case 'CHEQUE':
        return <Receipt className="h-5 w-5" />
      default:
        return <DollarSign className="h-5 w-5" />
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-lg font-medium text-gray-600">Loading payment information...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  if (!fee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fee Not Found</h2>
          <p className="text-gray-600 mb-4">The fee you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/student/finances')}>
            Back to Finances
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/student/finances')}
                className="bg-white/50 hover:bg-white/80 border-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Finances
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Make Payment
                </h1>
                <p className="text-gray-600 mt-1">Process your fee payment</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Fee Information */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-green-600" />
                <span>Fee Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Badge className={getFeeTypeColor(fee.feeType)}>
                  {fee.feeType.replace('_', ' ')}
                </Badge>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(fee.amount)}</p>
                  <p className="text-sm text-gray-500">Total Amount</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{fee.description}</h4>
                <p className="text-sm text-gray-600">
                  {fee.academicYear} {fee.semester && `• ${fee.semester} Semester`}
                </p>
                <p className="text-sm text-gray-600">Due: {formatDate(fee.dueDate)}</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-medium">{formatCurrency(fee.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(fee.totalPaid)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-900">Remaining Balance:</span>
                    <span className="font-bold text-red-600">{formatCurrency(fee.remaining)}</span>
                  </div>
                </div>
              </div>

              {fee.isOverdue && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <p className="text-sm font-medium text-red-800">This fee is overdue</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Payment Information</span>
              </CardTitle>
              <CardDescription>
                Enter your payment details to process the transaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Payment Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={fee.remaining}
                    {...register('amount')}
                    placeholder="0.00"
                    className="text-lg font-medium"
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-500">{errors.amount.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Maximum: {formatCurrency(fee.remaining)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select onValueChange={(value) => setValue('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Cash</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="BANK_TRANSFER">
                        <div className="flex items-center space-x-2">
                          <Building2 className="h-4 w-4" />
                          <span>Bank Transfer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MOBILE_MONEY">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-4 w-4" />
                          <span>Mobile Money</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CARD">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Credit/Debit Card</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="CHEQUE">
                        <div className="flex items-center space-x-2">
                          <Receipt className="h-4 w-4" />
                          <span>Cheque</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Payment Reference</Label>
                  <Input
                    id="reference"
                    {...register('reference')}
                    placeholder="Enter transaction reference or receipt number"
                  />
                  {errors.reference && (
                    <p className="text-sm text-red-500">{errors.reference.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Provide the transaction ID, receipt number, or reference from your payment
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>

                {/* Payment Summary */}
                {watchedAmount && parseFloat(String(watchedAmount)) > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Payment Amount:</span>
                        <span className="font-medium text-blue-900">{formatCurrency(parseFloat(String(watchedAmount)))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Remaining After Payment:</span>
                        <span className="font-medium text-blue-900">
                          {formatCurrency(fee.remaining - parseFloat(String(watchedAmount)))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={processing || !watchedAmount || parseFloat(String(watchedAmount)) <= 0}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-medium"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-5 w-5" />
                      Process Payment
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
