import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { parcelService, applicationService, anomalyService } from '@/services/api'
import type { Parcel, Application, AnomalyAlert } from '@/types'
import { AlertTriangle, CheckCircle, Clock, Search, FileText } from 'lucide-react'

export default function OfficerDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [pendingApps, setPendingApps] = useState<Application[]>([])
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([])
  const [stats, setStats] = useState({ aiAlerts: 0, openDisputes: 0, pendingApprovals: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const [appRes, anomalyRes] = await Promise.all([
        applicationService.list({ status: 'pending' }),
        anomalyService.list(),
      ])
      const aList = Array.isArray(appRes.data) ? appRes.data : appRes.data?.data || []
      const anList = Array.isArray(anomalyRes.data) ? anomalyRes.data : anomalyRes.data?.data || []
      setPendingApps(aList)
      setAnomalies(anList)
      setStats({
        aiAlerts: anList.length,
        openDisputes: 7,
        pendingApprovals: aList.length,
      })
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load dashboard', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (appId: string | number, status: string) => {
    try {
      await applicationService.updateStatus(appId, status)
      toast({ title: 'Success', description: `Application ${status}` })
      loadDashboardData()
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-cyan-400">Loading dashboard...</div>
  }

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Officer Dashboard</h1>
      <p className="text-muted-foreground mb-8">Manage land records, applications, and anomalies</p>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'AI Alerts', value: stats.aiAlerts, icon: AlertTriangle, color: 'bg-red-400/20 text-red-400', bgColor: 'border-red-400/20' },
          { label: 'Open Disputes', value: stats.openDisputes, icon: AlertTriangle, color: 'bg-orange-400/20 text-orange-400', bgColor: 'border-orange-400/20' },
          { label: 'Pending Approvals', value: stats.pendingApprovals, icon: Clock, color: 'bg-yellow-400/20 text-yellow-400', bgColor: 'border-yellow-400/20' },
          { label: 'Processed Today', value: Math.floor(Math.random() * 20) + 5, icon: CheckCircle, color: 'bg-green-400/20 text-green-400', bgColor: 'border-green-400/20' },
        ].map((stat, i) => (
          <Card key={i} className={`bg-card/80 backdrop-blur-sm border ${stat.bgColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending Applications Table */}
      <Card className="bg-card/80 backdrop-blur-sm border-border mb-8">
        <CardHeader>
          <CardTitle className="text-white">Pending Applications</CardTitle>
          <CardDescription className="text-muted-foreground">Review and approve/reject applications</CardDescription>
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
                {pendingApps.map((app) => (
                  <tr key={app.id} className="border-b border-border/50 hover:bg-cyan-400/5">
                    <td className="p-3 text-sm text-white">{app.id}</td>
                    <td className="p-3 text-sm text-muted-foreground">{app.type}</td>
                    <td className="p-3 text-sm text-muted-foreground">{app.ulpin}</td>
                    <td className="p-3"><span className="px-2 py-1 rounded text-xs bg-yellow-400/20 text-yellow-400">{app.status}</span></td>
                    <td className="p-3 text-sm text-muted-foreground">{new Date((app as any).submitted_at || app.submittedAt || Date.now()).toLocaleDateString()}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => navigate(`/applications/${app.id}`)}>View</Button>
                        <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => handleStatusChange(app.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleStatusChange(app.id, 'rejected')}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Alerts */}
      <Card className="bg-card/80 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="text-white">Anomaly Alerts</CardTitle>
          <CardDescription className="text-muted-foreground">AI-detected anomalies requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {anomalies.slice(0, 10).map((anomaly) => (
              <div key={anomaly.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${
                    anomaly.severity === 'critical' ? 'text-red-400' :
                    anomaly.severity === 'high' ? 'text-orange-400' :
                    'text-yellow-400'
                  }`} />
                  <div>
                    <p className="text-white text-sm font-medium">{anomaly.type}</p>
                    <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    anomaly.severity === 'critical' ? 'bg-red-400/20 text-red-400' :
                    anomaly.severity === 'high' ? 'bg-orange-400/20 text-orange-400' :
                    'bg-yellow-400/20 text-yellow-400'
                  }`}>
                    {anomaly.severity}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/parcels/${anomaly.parcelId}`)}>View</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
