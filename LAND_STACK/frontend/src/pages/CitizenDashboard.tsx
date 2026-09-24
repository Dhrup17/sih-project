import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import { parcelService, applicationService } from '@/services/api'
import type { Parcel, Application } from '@/types'
import { Search, FileText, MapPin, ArrowRight } from 'lucide-react'

export default function CitizenDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [parcels, setParcels] = useState<Parcel[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const response = await parcelService.search({ ulpin: searchQuery })
      const data = Array.isArray(response.data) ? response.data : response.data?.data || []
      setParcels(data)
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to search parcels', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSearch = async () => {
    setLoading(true)
    try {
      const [parcelRes, appRes] = await Promise.all([
        parcelService.search({}),
        applicationService.list({ userId: user?.id ? String(user.id) : undefined }),
      ])
      const pList = Array.isArray(parcelRes.data) ? parcelRes.data : parcelRes.data?.data || []
      const aList = Array.isArray(appRes.data) ? appRes.data : appRes.data?.data || []
      setParcels(pList.slice(0, 5))
      setApplications(aList.slice(0, 5))
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name}</h1>
      <p className="text-muted-foreground mb-8">Manage your land records and applications</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-colors" onClick={() => navigate('/applications/new')}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <FileText className="h-10 w-10 text-cyan-400 mb-3" />
            <h3 className="text-white font-semibold mb-1">Submit Application</h3>
            <p className="text-sm text-muted-foreground">File a new land-related application</p>
            <ArrowRight className="h-4 w-4 text-cyan-400 mt-3" />
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-colors" onClick={() => navigate('/parcels')}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <MapPin className="h-10 w-10 text-cyan-400 mb-3" />
            <h3 className="text-white font-semibold mb-1">Search Parcel</h3>
            <p className="text-sm text-muted-foreground">Find parcel by ULPIN or survey number</p>
            <ArrowRight className="h-4 w-4 text-cyan-400 mt-3" />
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm border-cyan-500/20 hover:border-cyan-500/40 cursor-pointer transition-colors" onClick={handleQuickSearch}>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Search className="h-10 w-10 text-cyan-400 mb-3" />
            <h3 className="text-white font-semibold mb-1">Quick Search</h3>
            <p className="text-sm text-muted-foreground">Recent parcels and applications</p>
            <ArrowRight className="h-4 w-4 text-cyan-400 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="bg-card/80 backdrop-blur-sm border-border mb-8">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by ULPIN or Survey Number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background border-border flex-1"
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Applications', value: applications.length, color: 'text-cyan-400' },
          { label: 'Pending', value: applications.filter(a => a.status === 'pending').length, color: 'text-yellow-400' },
          { label: 'Parcels Found', value: parcels.length, color: 'text-green-400' },
          { label: 'Land Records', value: parcels.reduce((sum, p) => sum + ((p as any).ownership_records?.length || (p as any).ownership?.length || 1), 0), color: 'text-purple-400' },
        ].map((stat, i) => (
          <Card key={i} className="bg-card/80 backdrop-blur-sm border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Applications */}
      {applications.length > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border-border mb-8">
          <CardHeader>
            <CardTitle className="text-white">Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
                  <div>
                    <p className="text-white text-sm font-medium">{app.type} - {app.id}</p>
                    <p className="text-xs text-muted-foreground">ULPIN: {app.ulpin} | Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    app.status === 'approved' ? 'bg-green-400/20 text-green-400' :
                    app.status === 'rejected' ? 'bg-red-400/20 text-red-400' :
                    'bg-yellow-400/20 text-yellow-400'
                  }`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {parcels.length > 0 && (
        <Card className="bg-card/80 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle className="text-white">Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parcels.map((parcel) => (
                <div key={parcel.ulpin} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border hover:border-cyan-500/40 cursor-pointer transition-colors" onClick={() => navigate(`/parcels/${parcel.ulpin}`)}>
                  <div>
                    <p className="text-white text-sm font-medium">ULPIN: {parcel.ulpin}</p>
                    <p className="text-xs text-muted-foreground">Survey: {parcel.surveyNumber} | Area: {parcel.area} acres | {parcel.landUse}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-cyan-400" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
