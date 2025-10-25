'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Wrench, 
  Clock, 
  RefreshCw, 
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

export default function MaintenancePage() {
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const checkAgain = () => {
    setLastChecked(new Date())
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Wrench className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">
              System Maintenance
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 mt-2">
              We're currently performing scheduled maintenance to improve your experience
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Estimated Duration:</strong> 30 minutes to 2 hours
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <p className="text-gray-600">
                Our technical team is working hard to bring you an improved experience. 
                During this time, the system will be temporarily unavailable.
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
              </div>

              <Button 
                onClick={checkAgain}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Need Immediate Assistance?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">support@university.edu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">IT Support Office</span>
                </div>
              </div>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>We apologize for any inconvenience caused.</p>
              <p>Thank you for your patience.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
