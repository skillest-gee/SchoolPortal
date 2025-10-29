'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import Loading from '@/components/ui/loading'
import { showSuccess, showError } from '@/lib/toast'
import ProgrammeFeeCard from '@/components/admin/ProgrammeFeeCard'

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

const DEFAULT_PROGRAMMES = [
  'BACHELOR OF SCIENCE (INFORMATION TECHNOLOGY)',
  'BACHELOR OF SCIENCE (COMPUTER SCIENCE)',
  'BACHELOR OF SCIENCE (SOFTWARE ENGINEERING)',
  'BACHELOR OF ARTS (BUSINESS ADMINISTRATION)',
  'BACHELOR OF SCIENCE (ACCOUNTING)'
]

export default function ProgrammeFeeManagement() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feeStructures, setFeeStructures] = useState<Record<string, ProgrammeFeeStructure>>({})
  const [editingProgramme, setEditingProgramme] = useState<string | null>(null)
  const [newProgrammeName, setNewProgrammeName] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/auth/login')
      return
    }

    loadFeeStructures()
  }, [session, status, router])

  const loadFeeStructures = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/programme-fees')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setFeeStructures(data.data || {})
        }
      } else {
        // Load from default structure
        const defaultStructures = await fetch('/api/admin/programme-fees/default').then(r => r.ok ? r.json() : null)
        if (defaultStructures?.success) {
          setFeeStructures(defaultStructures.data)
        }
      }
    } catch (error) {
      console.error('Error loading fee structures:', error)
      showError('Failed to load programme fees')
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = (fees: Omit<ProgrammeFeeStructure, 'programme' | 'total'>) => {
    return (fees.admission || 0) + 
           (fees.tuition || 0) + 
           (fees.accommodation || 0) + 
           (fees.library || 0) + 
           (fees.laboratory || 0) + 
           (fees.examination || 0)
  }

  const handleSave = async (programme: string, feeData: ProgrammeFeeStructure) => {
    try {
      setSaving(true)
      
      const total = calculateTotal(feeData)
      const updatedData = { ...feeData, total, programme }

      const response = await fetch('/api/admin/programme-fees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update fee structure')
      }

      showSuccess(`Fee structure for ${programme} updated successfully!`)
      setEditingProgramme(null)
      await loadFeeStructures()

    } catch (error) {
      console.error('Error saving fee structure:', error)
      showError(error instanceof Error ? error.message : 'Failed to save fee structure')
    } finally {
      setSaving(false)
    }
  }

  const handleCreate = async () => {
    if (!newProgrammeName.trim()) {
      showError('Please enter a programme name')
      return
    }

    try {
      setSaving(true)
      
      const newStructure: ProgrammeFeeStructure = {
        programme: newProgrammeName.trim(),
        admission: 5000,
        tuition: 15000,
        accommodation: 3500,
        library: 500,
        examination: 600,
        total: 24600
      }

      const response = await fetch('/api/admin/programme-fees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStructure),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create fee structure')
      }

      showSuccess(`Fee structure for ${newProgrammeName} created successfully!`)
      setNewProgrammeName('')
      await loadFeeStructures()

    } catch (error) {
      console.error('Error creating fee structure:', error)
      showError(error instanceof Error ? error.message : 'Failed to create fee structure')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading message="Loading programme fees..." />
      </div>
    )
  }

  const programmes = Object.keys(feeStructures).length > 0 
    ? Object.keys(feeStructures)
    : DEFAULT_PROGRAMMES

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Programme Fee Management</h1>
                <p className="mt-2 text-gray-600">Manage fee structures for each programme</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create New Programme Fee */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Create New Programme Fee Structure
            </CardTitle>
            <CardDescription>
              Add fee structure for a new programme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="newProgramme">Programme Name</Label>
                <Input
                  id="newProgramme"
                  value={newProgrammeName}
                  onChange={(e) => setNewProgrammeName(e.target.value)}
                  placeholder="e.g., BACHELOR OF SCIENCE (ENGINEERING)"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={handleCreate}
                  disabled={saving || !newProgrammeName.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Programme Fee Structures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {programmes.map((programme) => {
            const feeData = feeStructures[programme] || {
              programme,
              admission: 5000,
              tuition: 15000,
              accommodation: 3500,
              library: 500,
              examination: 600,
              total: 24600
            }

            // Add laboratory fee if it's a science programme
            if (!feeData.laboratory && 
                (programme.includes('COMPUTER SCIENCE') || 
                 programme.includes('INFORMATION TECHNOLOGY') || 
                 programme.includes('SOFTWARE ENGINEERING'))) {
              feeData.laboratory = 1200
              feeData.total = (feeData.total || 0) + 1200
            }

            return (
              <ProgrammeFeeCard
                key={programme}
                programme={programme}
                feeData={feeData}
                isEditing={editingProgramme === programme}
                onEdit={() => setEditingProgramme(programme)}
                onCancel={() => setEditingProgramme(null)}
                onSave={(fees) => handleSave(programme, fees)}
                saving={saving}
              />
            )
          })}
        </div>
      </main>
    </div>
  )
}

