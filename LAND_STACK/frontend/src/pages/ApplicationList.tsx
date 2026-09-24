import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectItem } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { applicationService } from '@/services/api'
import type { Application } from '@/types'
import { FileText, Filter } from 'lucide-react'

export default function ApplicationList() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [applications, setApplications] = useState<Application[]>([])
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterStatus) params.status = filterStatus
      const response = await applicationService.list(params)
      setApplications(response.data.data || [])
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load applications', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    pending: 'bg-yellow-400/20 text-yellow-400',
    under_review: 'bg-blue-400/20 text-blue-400',
    approved: 'bg-green-400/20 text-green-400',
    rejected: 'bg-red-400/20 text-red-400',
    escalated: 'bg-orange-400/20 text-orange-400',
  }

  useEffect(() => {
    const timer = setTimeout(loadApplications, 500)
    return () => clearTimeout(timer)
  }, [filterStatus])

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Applications</h1>
      <p className="text-muted-foreground mb-8">View and manage all land applications</p>

      <Card className="bg-card/80 backdrop-blur-sm border-border mb-8">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-cyan-400" />
            <Label className="text-white">Filter by Status:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <select className="rounded-md border border-input bg-background px-3 py-1 text-sm">
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="escalated">Escalated</option>
              </select>
            </Select>
            <Button variant="outline" size="sm" onClick={loadApplications} className="ml-auto">Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center text-cyan-400">Loading applications...</div>
      ) : (
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-white">All Applications ({applications.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm text-muted-foreground p-3">ID</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Type</th>
                    <th className="text-left text-sm text-muted-foreground p-3">ULPIN</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Status</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Submitted</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-b border-border/50 hover:bg-cyan-400/5 cursor-pointer" onClick={() => navigate(`/applications/${app.id}`)}>
                      <td className="p-3 text-sm text-white font-medium">{app.id}</td>
                      <td className="p-3 text-sm text-muted-foreground">{app.type}</td>
                      <td className="p-3 text-sm text-muted-foreground">{app.ulpin}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[app.status]}`}>{app.status}</span></td>
                      <td className="p-3 text-sm text-muted-foreground">{new Date(app.submittedAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/applications/${app.id}`) }}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {applications.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No applications found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
