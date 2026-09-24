import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { applicationService } from '@/services/api'
import type { Application } from '@/types'
import { FileText, MapPin, Clock, History, ChevronRight } from 'lucide-react'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [statusComments, setStatusComments] = useState('')

  useEffect(() => {
    if (id) loadApplication()
  }, [id])

  const loadApplication = async () => {
    setLoading(true)
    try {
      const response = await applicationService.getById(id!)
      setApplication(response.data.data)
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load application', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus || !id) return
    try {
      await applicationService.updateStatus(id, newStatus, statusComments || undefined)
      toast({ title: 'Success', description: `Status updated to ${newStatus}` })
      loadApplication()
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-cyan-400">Loading application...</div>
  }

  if (!application) {
    return (
      <div className="p-6 pt-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Application Not Found</h2>
        <Button onClick={() => navigate('/applications')}>Back to List</Button>
      </div>
    )
  }

  const statusColors = {
    pending: 'bg-yellow-400/20 text-yellow-400',
    under_review: 'bg-blue-400/20 text-blue-400',
    approved: 'bg-green-400/20 text-green-400',
    rejected: 'bg-red-400/20 text-red-400',
    escalated: 'bg-orange-400/20 text-orange-400',
  }

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Application Detail</h1>
          <p className="text-muted-foreground">ID: {application.id} | Type: {application.type}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/applications')}>Back to List</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-400" /> Application Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">ID:</span><span className="text-white">{application.id}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><span className="text-white">{application.type}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">ULPIN:</span><span className="text-white">{application.ulpin}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Status:</span><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[application.status]}`}>{application.status}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Submitted:</span><span className="text-white">{new Date(application.submittedAt).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Updated:</span><span className="text-white">{new Date(application.updatedAt).toLocaleString()}</span></div>
            {application.comments && (
              <div className="mt-2 p-2 bg-background/50 rounded border border-border">
                <p className="text-xs text-muted-foreground">Comments</p>
                <p className="text-white text-sm">{application.comments}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><MapPin className="h-5 w-5 text-cyan-400" /> Parcel Info</CardTitle>
          </CardHeader>
          <CardContent>
            {application.parcel ? (
              <div className="space-y-2">
                <div><span className="text-muted-foreground">ULPIN:</span> <span className="text-white">{application.parcel.ulpin}</span></div>
                <div><span className="text-muted-foreground">Survey No:</span> <span className="text-white">{application.parcel.surveyNumber}</span></div>
                <div><span className="text-muted-foreground">Area:</span> <span className="text-white">{application.parcel.area} acres</span></div>
                <div><span className="text-muted-foreground">Land Use:</span> <span className="text-white">{application.parcel.landUse}</span></div>
              </div>
            ) : (
              <p className="text-muted-foreground">No parcel data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2"><History className="h-5 w-5 text-cyan-400" /> Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(application.statusHistory || []).map((entry, index) => (
                <div key={entry.id} className="flex gap-3 items-start">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      index === 0 ? 'bg-cyan-400' : 'bg-border'
                    }`} />
                    {index < (application.statusHistory || []).length - 1 && <div className="w-px h-full bg-border mt-1" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{entry.status}</p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.updatedAt || entry.changed_at || '').toLocaleString()} by {entry.updatedBy || entry.changed_by}</p>
                    {entry.comments && <p className="text-xs text-muted-foreground mt-1">{entry.comments}</p>}
                  </div>

                </div>
              ))}
              {(!application.statusHistory || application.statusHistory.length === 0) && (
                <p className="text-sm text-muted-foreground">No status history available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Officer Actions */}
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-white">Update Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Label>New Status</Label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-md border border-border bg-zinc-900 px-3 py-2 text-sm text-white mt-1 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              >
                <option value="">Select status...</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>
            <div className="flex-1">
              <Label>Comments</Label>
              <Input value={statusComments} onChange={(e) => setStatusComments(e.target.value)} placeholder="Add comments..." className="bg-background border-border mt-1" />
            </div>
            <Button onClick={handleStatusUpdate} className="bg-cyan-500 text-black hover:bg-cyan-400">Update</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
