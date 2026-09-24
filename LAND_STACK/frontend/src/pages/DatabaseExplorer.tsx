import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { databaseService } from '@/services/api'
import { Database, Server, Compass, CheckCircle2, ShieldCheck, Play, Code } from 'lucide-react'

export default function DatabaseExplorer() {
  const { toast } = useToast()
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [queryRadius, setQueryRadius] = useState(2.5)
  const [spatialResults, setSpatialResults] = useState<any>(null)
  const [runningQuery, setRunningQuery] = useState(false)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    setLoading(true)
    try {
      const res = await databaseService.getStatus()
      setDbStatus(res.data)
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to inspect database status', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleTestSpatialQuery = async () => {
    setRunningQuery(true)
    try {
      const res = await databaseService.querySpatial(80.9462, 26.8467, queryRadius)
      setSpatialResults(res.data)
      toast({
        title: 'Spatial Query Executed',
        description: `Found ${res.data.parcels_found} parcels within ${queryRadius} km radius.`,
      })
    } catch (err) {
      toast({ title: 'Query Error', description: 'Failed to execute spatial query', variant: 'destructive' })
    } finally {
      setRunningQuery(false)
    }
  }

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-emerald-950/40 p-6 rounded-2xl border border-emerald-500/20 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              POSTGIS SPATIAL ARCHITECTURE
            </span>
            <span className="text-xs text-zinc-400">SRID 4326: WGS84 Ellipsoid Standard</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Spatial Database & PostGIS Management</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Inspect spatial schema, spatial indexes (GIST), native PostGIS procedures, and execute real-time spatial proximity queries.
          </p>
        </div>

        <Button
          onClick={loadStatus}
          variant="outline"
          className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"
        >
          <Database className="w-4 h-4 mr-2" /> Refresh Status
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Spatial Engine', value: dbStatus?.engine || 'PostGIS Ready', icon: Server, color: 'text-cyan-400' },
          { label: 'Registered Parcels', value: dbStatus?.metrics?.total_parcels || 0, icon: Compass, color: 'text-emerald-400' },
          { label: 'Satellite Scenes', value: dbStatus?.metrics?.satellite_scenes || 0, icon: ShieldCheck, color: 'text-blue-400' },
          { label: 'AI Anomaly Records', value: dbStatus?.metrics?.anomalies_logged || 0, icon: CheckCircle2, color: 'text-red-400' },
        ].map((item, idx) => (
          <Card key={idx} className="bg-zinc-900/80 border-border">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">{item.label}</p>
                <p className="text-xl font-bold text-white mt-1 truncate">{item.value}</p>
              </div>
              <item.icon className={`w-8 h-8 ${item.color} opacity-80`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Spatial Capabilities & Interactive Query */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Spatial Features (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="bg-zinc-900/80 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-semibold">Enabled Spatial GIS Capabilities</CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Spatial functions enabled for boundary checking, distance calculation, and routing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { name: 'ST_Centroid', desc: 'Auto centroid generation for parcel pins' },
                  { name: 'ST_DWithin & Proximity', desc: 'Radius search within meters' },
                  { name: 'ST_Contains / Geofence', desc: 'Point-in-polygon vehicle detection' },
                  { name: 'GIST Spatial Indexing', desc: 'Fast bounding-box spatial trees' },
                  { name: 'ST_Area (Geography)', desc: 'Precise geodesic land area in m²' },
                  { name: 'WGS84 SRID 4326', desc: 'Standard satellite & GPS alignment' },
                ].map((feat, i) => (
                  <div key={i} className="p-3 bg-zinc-950 rounded-lg border border-border">
                    <div className="font-mono font-bold text-cyan-300">{feat.name}</div>
                    <p className="text-zinc-400 mt-1">{feat.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-zinc-950 rounded-lg border border-border text-xs space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Standalone PostGIS DDL Available
                </div>
                <p className="text-zinc-400">
                  A complete, self-contained PostgreSQL + PostGIS SQL script is located at{' '}
                  <code className="text-cyan-300">backend/database/init_postgis.sql</code> ready to deploy to any PostgreSQL server with PostGIS.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Live Spatial Proximity Query Tester (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="bg-zinc-900/80 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-semibold flex items-center justify-between">
                <span>Spatial Proximity Query Tester</span>
                <Compass className="w-4 h-4 text-cyan-400" />
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Execute ST_DWithin radial proximity query around Lucknow central benchmark
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                  <span>Search Radius: <strong>{queryRadius} km</strong></span>
                  <span className="text-zinc-500">Benchmark: (26.8467° N, 80.9462° E)</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={queryRadius}
                  onChange={(e) => setQueryRadius(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <Button
                onClick={handleTestSpatialQuery}
                disabled={runningQuery}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs py-2"
              >
                <Play className="w-3.5 h-3.5 mr-1.5" />
                {runningQuery ? 'Computing Spatial Intersect...' : `Execute Spatial Radius Query (${queryRadius} km)`}
              </Button>

              {/* Spatial Results Table */}
              {spatialResults && (
                <div className="space-y-2 max-h-64 overflow-y-auto pt-2 border-t border-border/50">
                  <p className="text-xs text-zinc-400 font-semibold">
                    Found {spatialResults.parcels_found} matching cadastral parcels:
                  </p>
                  {spatialResults.parcels.map((p: any) => (
                    <div key={p.ulpin} className="p-2.5 bg-zinc-950 rounded-lg border border-border text-xs flex justify-between items-center">
                      <div>
                        <strong className="text-white">{p.ulpin}</strong>
                        <p className="text-zinc-400 text-[11px]">{p.land_use} | {Math.round(p.area_sqm)} m²</p>
                      </div>
                      <div className="text-right">
                        <span className="text-cyan-400 font-mono font-bold">{p.distance_meters} m</span>
                        <p className="text-zinc-500 text-[10px]">from center</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
