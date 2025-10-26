'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  Download, 
  FileText, 
  Award, 
  BookOpen,
  Loader2,
  TrendingUp
} from 'lucide-react'
import Loading from '@/components/ui/loading'

interface TranscriptRecord {
  courseCode: string
  courseTitle: string
  credits: number
  grade: number | string
  letterGrade: string
  semester: string
  academicYear: string
  status: string
}

interface TranscriptData {
  student: {
    studentId: string
    name: string
    programme: string
    level: string
    gpa: string
    totalCreditsEarned: number
    totalCreditsAttempted: number
  }
  records: TranscriptRecord[]
}

export default function StudentTranscriptPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [transcript, setTranscript] = useState<TranscriptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'STUDENT') {
      router.push('/auth/login')
      return
    }

    fetchTranscript()
  }, [session, status, router])

  const fetchTranscript = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/students/transcript')
      const data = await response.json()

      if (data.success) {
        setTranscript(data.data)
      } else {
        setError(data.error || 'Failed to load transcript')
      }
    } catch (error) {
      console.error('Error fetching transcript:', error)
      setError('Failed to load transcript')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      setDownloading(true)
      // In a real implementation, this would generate and download a PDF
      // For now, we'll create a text version
      
      if (!transcript) return

      let text = 'OFFICIAL ACADEMIC TRANSCRIPT\n'
      text += '='.repeat(50) + '\n\n'
      text += `Student ID: ${transcript.student.studentId}\n`
      text += `Name: ${transcript.student.name}\n`
      text += `Programme: ${transcript.student.programme}\n`
      text += `Level: ${transcript.student.level}\n`
      text += `GPA: ${transcript.student.gpa}\n`
      text += `Total Credits Earned: ${transcript.student.totalCreditsEarned}\n`
      text += '\n' + '='.repeat(50) + '\n'
      text += 'COURSE HISTORY\n'
      text += '='.repeat(50) + '\n\n'

      transcript.records.forEach(record => {
        text += `${record.courseCode} - ${record.courseTitle}\n`
        text += `  Credits: ${record.credits} | Grade: ${record.letterGrade} (${record.grade}) | ${record.academicYear} - ${record.semester}\n\n`
      })

      // Create and download file
      const blob = new Blob([text], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transcript_${transcript.student.studentId}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error downloading transcript:', error)
      setError('Failed to download transcript')
    } finally {
      setDownloading(false)
    }
  }

  const getGradeColor = (letterGrade: string) => {
    if (letterGrade === 'A') return 'bg-green-100 text-green-800'
    if (letterGrade === 'B+' || letterGrade === 'B') return 'bg-blue-100 text-blue-800'
    if (letterGrade === 'C+' || letterGrade === 'C') return 'bg-yellow-100 text-yellow-800'
    if (letterGrade === 'D+' || letterGrade === 'D') return 'bg-orange-100 text-orange-800'
    return 'bg-red-100 text-red-800'
  }

  if (status === 'loading' || loading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <Button onClick={fetchTranscript} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!transcript) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Transcript</h1>
          <p className="text-gray-600">Official academic record and grades</p>
        </div>

        {/* Student Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <GraduationCap className="h-6 w-6 mr-2 text-blue-600" />
                Student Information
              </CardTitle>
              <Button 
                onClick={handleDownload} 
                disabled={downloading}
                variant="outline"
              >
                {downloading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Transcript
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Student ID</label>
                <p className="text-gray-900 font-semibold">{transcript.student.studentId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900 font-semibold">{transcript.student.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Programme</label>
                <p className="text-gray-900">{transcript.student.programme}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Level</label>
                <p className="text-gray-900">{transcript.student.level}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">GPA</label>
                <p className="text-gray-900 font-bold text-lg">{transcript.student.gpa}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Credits Earned</label>
                <p className="text-gray-900">{transcript.student.totalCreditsEarned} / {transcript.student.totalCreditsAttempted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transcript Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-6 w-6 mr-2 text-green-600" />
              Course History
            </CardTitle>
            <CardDescription>
              Complete academic record and grades
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transcript.records.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Found</h3>
                <p className="text-gray-600">No academic records available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transcript.records.map((record, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{record.courseCode}</h3>
                          <Badge variant="outline">{record.courseTitle}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {record.academicYear} • {record.semester}
                        </p>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            Credits: {record.credits}
                          </span>
                          <span className="text-sm text-gray-600">
                            Status: {record.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getGradeColor(record.letterGrade)}>
                          {record.letterGrade}
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">{record.grade}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

