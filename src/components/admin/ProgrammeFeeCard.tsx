'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit, Save, X, Loader2 } from 'lucide-react'

interface ProgrammeFeeStructure {
  programme: string
  admission: number
  tuition: number
  accommodation: number
  library: number
  laboratory?: number
  examination: number
  total: number
}

interface ProgrammeFeeCardProps {
  programme: string
  feeData: ProgrammeFeeStructure
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: (fees: ProgrammeFeeStructure) => Promise<void>
  saving: boolean
}

export default function ProgrammeFeeCard({
  programme,
  feeData,
  isEditing,
  onEdit,
  onCancel,
  onSave,
  saving
}: ProgrammeFeeCardProps) {
  const [localFees, setLocalFees] = useState<ProgrammeFeeStructure>(feeData)

  useEffect(() => {
    setLocalFees(feeData)
  }, [feeData])

  const calculateTotal = (fees: Omit<ProgrammeFeeStructure, 'programme' | 'total'>) => {
    return (fees.admission || 0) + 
           (fees.tuition || 0) + 
           (fees.accommodation || 0) + 
           (fees.library || 0) + 
           (fees.laboratory || 0) + 
           (fees.examination || 0)
  }

  const handleSave = async () => {
    const total = calculateTotal(localFees)
    await onSave({ ...localFees, total, programme })
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{programme}</CardTitle>
            <CardDescription className="mt-1">
              Total: ${calculateTotal(localFees).toLocaleString()}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setLocalFees(feeData)
                    onCancel()
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-gray-600">Admission Fee</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={localFees.admission}
                  onChange={(e) => setLocalFees({
                    ...localFees,
                    admission: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900 font-semibold">${localFees.admission.toLocaleString()}</p>
              )}
            </div>
            <div>
              <Label className="text-sm text-gray-600">Tuition Fee</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={localFees.tuition}
                  onChange={(e) => setLocalFees({
                    ...localFees,
                    tuition: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900 font-semibold">${localFees.tuition.toLocaleString()}</p>
              )}
            </div>
            <div>
              <Label className="text-sm text-gray-600">Accommodation</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={localFees.accommodation}
                  onChange={(e) => setLocalFees({
                    ...localFees,
                    accommodation: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900 font-semibold">${localFees.accommodation.toLocaleString()}</p>
              )}
            </div>
            <div>
              <Label className="text-sm text-gray-600">Library Fee</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={localFees.library}
                  onChange={(e) => setLocalFees({
                    ...localFees,
                    library: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900 font-semibold">${localFees.library.toLocaleString()}</p>
              )}
            </div>
            {localFees.laboratory !== undefined && (
              <div>
                <Label className="text-sm text-gray-600">Laboratory Fee</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={localFees.laboratory || 0}
                    onChange={(e) => setLocalFees({
                      ...localFees,
                      laboratory: parseFloat(e.target.value) || 0
                    })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-900 font-semibold">${(localFees.laboratory || 0).toLocaleString()}</p>
                )}
              </div>
            )}
            <div>
              <Label className="text-sm text-gray-600">Examination Fee</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={localFees.examination}
                  onChange={(e) => setLocalFees({
                    ...localFees,
                    examination: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1"
                />
              ) : (
                <p className="text-gray-900 font-semibold">${localFees.examination.toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Total</Label>
              <p className="text-xl font-bold text-blue-600">
                ${calculateTotal(localFees).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

