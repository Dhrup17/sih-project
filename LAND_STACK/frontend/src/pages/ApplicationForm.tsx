import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { applicationService } from '@/services/api'
import { useAuth } from '@/hooks/useAuth'
import { FileText } from 'lucide-react'

const applicationTypes = [
  { value: 'ownership_transfer', label: 'Ownership Transfer' },
  { value: 'mutation', label: 'Mutation' },
  { value: 'survey', label: 'New Survey' },
  { value: 'encumbrance', label: 'Encumbrance Check' },
  { value: 'tax_query', label: 'Tax Query' },
  { value: 'dispute', label: 'Dispute Filing' },
]

export default function ApplicationForm() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [ulpin, setUlpin] = useState(searchParams.get('ulpin') || '')
  const [appType, setAppType] = useState('')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ulpin || !appType) {
      setError('ULPIN and application type are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await applicationService.create({ type: appType, ulpin, comments })
      toast({ title: 'Success', description: 'Application submitted successfully' })
      navigate('/applications')
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit application'
      setError(message)
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 pt-20 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Submit Application</h1>
      <p className="text-muted-foreground mb-8">File a new land-related application</p>

      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-400" /> New Application</CardTitle>
          <CardDescription className="text-muted-foreground">Fill in the details below to submit your application</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="text-red-400 text-sm bg-red-400/10 p-2 rounded">{error}</div>}
            
            <div>
              <Label htmlFor="ulpin">ULPIN</Label>
              <Input
                id="ulpin"
                value={ulpin}
                onChange={(e) => setUlpin(e.target.value)}
                placeholder="Enter ULPIN"
                required
                className="bg-background border-border mt-1"
              />
            </div>

            <div>
              <Label>Application Type</Label>
              <Select value={appType} onValueChange={setAppType}>
                <select className="w-full rounded-md border border-input bg-background px-3 py-1 text-sm mt-1">
                  <option value="">Select application type...</option>
                  {applicationTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </Select>
            </div>

            <div>
              <Label htmlFor="comments">Comments / Additional Information</Label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any additional comments..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 min-h-[120px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="bg-cyan-500 text-black hover:bg-cyan-400" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate('/applications')}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
