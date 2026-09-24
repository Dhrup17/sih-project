import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ParcelMap from '@/components/maps/ParcelMap'
import { useToast } from '@/components/ui/toast'
import { parcelService } from '@/services/api'
import type { Parcel, Application } from '@/types'
import { FileText, Building2, Receipt, FileCheck, AlertTriangle, Clock, ExternalLink } from 'lucide-react'

export default function ParcelProfile() {
  const { ulpin } = useParams<{ ulpin: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (ulpin) loadParcel()
  }, [ulpin])

  const loadParcel = async () => {
    setLoading(true)
    try {
      const response = await parcelService.getByULPIN(ulpin!)
      setParcel(response.data?.data || response.data)
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load parcel data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (action: string) => {
    if (action === 'submit-application') {
      navigate(`/applications/new?ulpin=${ulpin}`)
    } else if (action === 'change-detection') {
      navigate(`/ai-monitoring?ulpin=${ulpin}`)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-cyan-400 text-xl">Loading Parcel...</div>
  }

  if (!parcel) {
    return (
      <div className="p-6 pt-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Parcel Not Found</h2>
        <Button onClick={() => navigate('/parcels')}>Back to Search</Button>
      </div>
    )
  }

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Parcel Profile</h1>
          <p className="text-muted-foreground">ULPIN: {parcel.ulpin} | Survey: {parcel.surveyNumber}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleAction('change-detection')}>
            <AlertTriangle className="h-4 w-4 mr-2" />Run Change Detection
          </Button>
          <Button onClick={() => handleAction('submit-application')} className="bg-cyan-500 text-black hover:bg-cyan-400">
            <FileText className="h-4 w-4 mr-2" />Submit Application
          </Button>
        </div>
      </div>

      {/* Hero Map */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white mb-3">Parcel Boundary Map</h2>
        {parcel.geometry && (
          <ParcelMap geojson={parcel.geometry} height="400px" />
        )}
        {!parcel.geometry && (
          <div className="h-64 bg-card/50 border border-border rounded-lg flex items-center justify-center text-muted-foreground">
            No map data available
          </div>
        )}
      </div>

      {/* Unified Land Profile Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ownership">Ownership (RoR)</TabsTrigger>
          <TabsTrigger value="tax">Tax Records</TabsTrigger>
          <TabsTrigger value="registration">Registrations</TabsTrigger>
          <TabsTrigger value="encumbrances">Encumbrances</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'ULPIN', value: parcel.ulpin },
                  { label: 'Survey No', value: parcel.surveyNumber },
                  { label: 'Area', value: `${parcel.area} acres` },
                  { label: 'Land Use', value: parcel.landUse },
                  { label: 'District', value: parcel.district },
                  { label: 'Taluk', value: parcel.taluk },
                  { label: 'Village', value: parcel.village },
                  { label: 'State', value: parcel.state },
                ].map((item, i) => (
                  <div key={i} className="bg-background/50 p-3 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-white font-medium">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ownership">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Building2 className="h-5 w-5 text-cyan-400" /> Ownership Records (RoR)</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm text-muted-foreground p-3">Owner</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Percentage</th>
                    <th className="text-left text-sm text-muted-foreground p-3">RoR Number</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {((parcel as any).ownership_records || (parcel as any).ownership || []).map((record: any) => (
                    <tr key={record.id} className="border-b border-border/50">
                      <td className="p-3 text-white">{record.owner_name || record.ownerName}</td>
                      <td className="p-3 text-white">{record.share || record.ownershipPercentage || 100}%</td>
                      <td className="p-3 text-muted-foreground">{record.rorNumber || 'ROR-2024'}</td>
                      <td className="p-3 text-muted-foreground">{new Date(record.created_at || record.rorDate || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Receipt className="h-5 w-5 text-cyan-400" /> Tax Records</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm text-muted-foreground p-3">Year</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Amount</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Paid Date</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {((parcel as any).tax_records || (parcel as any).taxRecords || []).map((record: any) => (
                    <tr key={record.id} className="border-b border-border/50">
                      <td className="p-3 text-white">{record.assessment_year || record.year}</td>
                      <td className="p-3 text-white">₹{record.tax_amount || record.taxAmount}</td>
                      <td className="p-3 text-muted-foreground">
                        {record.paid_date || record.paidDate ? new Date(record.paid_date || record.paidDate).toLocaleDateString() : 'Pending'}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          (record.status || '').toLowerCase() === 'paid' ? 'bg-green-400/20 text-green-400' :
                          (record.status || '').toLowerCase() === 'overdue' ? 'bg-red-400/20 text-red-400' :
                          'bg-yellow-400/20 text-yellow-400'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registration">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><FileCheck className="h-5 w-5 text-cyan-400" /> Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-sm text-muted-foreground p-3">Reg No</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Date</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Type</th>
                    <th className="text-left text-sm text-muted-foreground p-3">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(parcel.registrations || []).map((record) => (
                    <tr key={record.id} className="border-b border-border/50">
                      <td className="p-3 text-white">{record.registrationNumber}</td>
                      <td className="p-3 text-muted-foreground">{new Date(record.registrationDate).toLocaleDateString()}</td>
                      <td className="p-3 text-muted-foreground">{record.documentType}</td>
                      <td className="p-3 text-white">₹{record.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="encumbrances">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-cyan-400" /> Encumbrances</CardTitle>
            </CardHeader>
            <CardContent>
              {(parcel.encumbrances || []).length === 0 ? (
                <p className="text-muted-foreground">No encumbrances found</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-sm text-muted-foreground p-3">Type</th>
                      <th className="text-left text-sm text-muted-foreground p-3">Description</th>
                      <th className="text-left text-sm text-muted-foreground p-3">Date</th>
                      <th className="text-left text-sm text-muted-foreground p-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(parcel.encumbrances || []).map((record) => (
                      <tr key={record.id} className="border-b border-border/50">
                        <td className="p-3 text-white">{record.type}</td>
                        <td className="p-3 text-muted-foreground">{record.description}</td>
                        <td className="p-3 text-muted-foreground">{new Date(record.date).toLocaleDateString()}</td>
                        <td className="p-3 text-white">₹{record.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-400" /> Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {(parcel.documents || []).length === 0 ? (
                <p className="text-muted-foreground">No documents found</p>
              ) : (
                <div className="space-y-2">
                  {(parcel.documents || []).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
                      <div>
                        <p className="text-white text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type} | Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => window.open(doc.url, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-1" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><FileText className="h-5 w-5 text-cyan-400" /> Linked Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {(parcel.applications || []).length === 0 ? (
                <p className="text-muted-foreground">No applications linked to this parcel</p>
              ) : (
                <div className="space-y-3">
                  {(parcel.applications || []).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border hover:border-cyan-500/40 cursor-pointer" onClick={() => navigate(`/applications/${app.id}`)}>
                      <div>
                        <p className="text-white text-sm font-medium">{app.type} - {app.id}</p>
                        <p className="text-xs text-muted-foreground">Submitted: {new Date(app.submittedAt).toLocaleDateString()}</p>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <Card className="bg-card/80 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-cyan-400" /> Anomaly Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {(parcel.anomalies || []).length === 0 ? (
                <p className="text-muted-foreground">No anomalies detected</p>
              ) : (
                <div className="space-y-3">
                  {(parcel.anomalies || []).map((anomaly) => (
                    <div key={anomaly.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border">
                      <div>
                        <p className="text-white text-sm font-medium">{anomaly.type}</p>
                        <p className="text-xs text-muted-foreground">{anomaly.description}</p>
                        <p className="text-xs text-muted-foreground">Detected: {new Date(anomaly.detectedAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        anomaly.severity === 'critical' ? 'bg-red-400/20 text-red-400' :
                        anomaly.severity === 'high' ? 'bg-orange-400/20 text-orange-400' :
                        'bg-yellow-400/20 text-yellow-400'
                      }`}>
                        {anomaly.severity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
