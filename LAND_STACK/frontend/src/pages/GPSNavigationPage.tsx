import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import ParcelMap from '@/components/maps/ParcelMap'
import { gpsService, parcelService } from '@/services/api'
import type { Parcel, NavigationRoute, GPSTelemetry } from '@/types'
import {
  Navigation,
  Compass,
  Gauge,
  Radio,
  MapPin,
  AlertCircle,
  Play,
  Square,
  CheckCircle,
  ArrowRight,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Flag
} from 'lucide-react'

export default function GPSNavigationPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const targetParam = searchParams.get('ulpin') || 'ULPIN-UP-LKO-001'

  const [parcels, setParcels] = useState<Parcel[]>([])
  const [allGeojson, setAllGeojson] = useState<any>(null)
  const [selectedUlpin, setSelectedUlpin] = useState<string>(targetParam)
  const [navRoute, setNavRoute] = useState<NavigationRoute | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [trackingMode, setTrackingMode] = useState<'simulation' | 'device'>('simulation')

  // Live Telemetry State
  const [currentGPS, setCurrentGPS] = useState<GPSTelemetry>({
    device_id: 'PATROL-OFFICER-01',
    officer_name: 'Vikram Patel (Field Inspector)',
    latitude: 26.8450,
    longitude: 80.9420,
    altitude: 122.4,
    speed_kmh: 38.5,
    heading_degrees: 45.0,
    accuracy_meters: 3.0,
    status: 'en_route',
    timestamp: new Date().toISOString(),
  })

  const [geofenceInside, setGeofenceInside] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const simIntervalRef = useRef<any>(null)
  const simStepRef = useRef(0)

  useEffect(() => {
    loadParcels()
  }, [])

  useEffect(() => {
    if (selectedUlpin) {
      calculateRoute(selectedUlpin)
    }
  }, [selectedUlpin])

  const loadParcels = async () => {
    try {
      const [pRes, gRes] = await Promise.all([
        parcelService.search({}),
        parcelService.getAllGeojson(),
      ])
      const pList = Array.isArray(pRes.data) ? pRes.data : (pRes.data as any)?.data || []
      setParcels(pList)
      setAllGeojson(gRes.data)
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load parcels for navigation', variant: 'destructive' })
    }
  }

  const calculateRoute = async (targetUlpin: string) => {
    try {
      const res = await gpsService.getRoute({
        start_lat: currentGPS.latitude,
        start_lon: currentGPS.longitude,
        target_ulpin: targetUlpin,
        mode: 'driving',
      })
      setNavRoute(res.data)
      setCurrentStepIndex(0)
      toast({
        title: 'Route Calculated',
        description: `Distance: ${res.data.total_distance_km} km | ETA: ${res.data.eta_minutes} mins`,
      })
    } catch (err) {
      toast({ title: 'Routing Error', description: 'Could not compute road path', variant: 'destructive' })
    }
  }

  // Handle Simulation Start/Stop
  const toggleNavigation = () => {
    if (isNavigating) {
      // Stop
      clearInterval(simIntervalRef.current)
      setIsNavigating(false)
      toast({ title: 'Navigation Ended', description: 'Inspection route cancelled' })
    } else {
      // Start
      if (!navRoute) return
      setIsNavigating(true)
      simStepRef.current = 0

      const coords = navRoute.route_geojson.geometry.coordinates

      simIntervalRef.current = setInterval(async () => {
        if (simStepRef.current < coords.length) {
          const pt = coords[simStepRef.current]
          const nextPt = coords[Math.min(simStepRef.current + 1, coords.length - 1)]

          const newHeading = Math.round(
            (Math.atan2(nextPt[0] - pt[0], nextPt[1] - pt[1]) * 180) / Math.PI + 360
          ) % 360

          const updatedGPS: GPSTelemetry = {
            device_id: 'PATROL-OFFICER-01',
            officer_name: 'Vikram Patel (Field Inspector)',
            latitude: pt[1],
            longitude: pt[0],
            altitude: 124.0 + Math.random() * 2,
            speed_kmh: Math.round(32.0 + Math.random() * 10),
            heading_degrees: newHeading,
            accuracy_meters: 2.8,
            status: 'en_route',
            target_ulpin: selectedUlpin,
            timestamp: new Date().toISOString(),
          }

          setCurrentGPS(updatedGPS)

          // Send telemetry to backend
          gpsService.sendTelemetry(updatedGPS).catch(() => {})

          // Update active turn maneuver
          const progressRatio = simStepRef.current / (coords.length - 1)
          const maneuverIdx = Math.min(
            Math.floor(progressRatio * (navRoute.maneuvers.length || 1)),
            navRoute.maneuvers.length - 1
          )
          setCurrentStepIndex(maneuverIdx)

          // Geofence check
          try {
            const geoRes = await gpsService.checkGeofence(pt[1], pt[0], selectedUlpin)
            if (geoRes.data.is_inside) {
              setGeofenceInside(true)
              toast({
                title: '📍 Geofence Alert: Boundary Entered',
                description: `Inspector has crossed into parcel ${selectedUlpin} boundary perimeter.`,
              })
            }
          } catch (e) {}

          simStepRef.current += 1
        } else {
          // Reached destination
          clearInterval(simIntervalRef.current)
          setIsNavigating(false)
          setGeofenceInside(true)
          toast({
            title: '🎉 Arrived at Destination',
            description: `You have reached parcel ${selectedUlpin}. Ready to begin inspection.`,
          })
        }
      }, 2000)
    }
  }

  // Handle Real Device Geolocation
  const startDeviceGeolocation = () => {
    setTrackingMode('device')
    if (!navigator.geolocation) {
      toast({ title: 'Not Supported', description: 'Browser does not support Geolocation', variant: 'destructive' })
      return
    }

    navigator.geolocation.watchPosition(
      (pos) => {
        const updated: GPSTelemetry = {
          device_id: 'BROWSER-DEVICE-GPS',
          officer_name: 'Field Inspector (Device GPS)',
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitude: pos.coords.altitude || 120.0,
          speed_kmh: Math.round((pos.coords.speed || 0) * 3.6),
          heading_degrees: pos.coords.heading || 0,
          accuracy_meters: pos.coords.accuracy || 5.0,
          status: 'active_patrol',
          target_ulpin: selectedUlpin,
          timestamp: new Date().toISOString(),
        }
        setCurrentGPS(updated)
        gpsService.sendTelemetry(updated).catch(() => {})
      },
      (err) => {
        toast({ title: 'GPS Permission Denied', description: 'Using field patrol telemetry fallback', variant: 'destructive' })
        setTrackingMode('simulation')
      },
      { enableHighAccuracy: true }
    )
  }

  const currentManeuver = navRoute?.maneuvers[currentStepIndex] || navRoute?.maneuvers[0]

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-blue-950/40 p-6 rounded-2xl border border-blue-500/20 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              REAL-TIME GPS TELEMETRY & ROUTING
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Geofence Boundary Radar Active
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">GPS Field Patrol & Turn-by-Turn Navigation</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Live GPS telemetry tracking for field enforcement teams, turn-by-turn navigation guidance to reported anomalies, and automated cadastral boundary geofence breach detection.
          </p>
        </div>

        {/* Start / Stop Nav Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleNavigation}
            className={`font-semibold shadow-lg px-6 ${
              isNavigating
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/25'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
            }`}
          >
            {isNavigating ? (
              <>
                <Square className="w-4 h-4 mr-2" /> Stop Navigation
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Start Navigation
              </>
            )}
          </Button>

          <Button
            onClick={() => navigate(`/ai-monitoring?ulpin=${selectedUlpin}`)}
            variant="outline"
            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
          >
            View Satellite Imagery
          </Button>
        </div>
      </div>

      {/* Geofence Breach Banner */}
      {geofenceInside && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center justify-between text-emerald-300 animate-in slide-in-from-top fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="font-bold text-sm text-white">GEOFENCE BOUNDARY REACHED</p>
              <p className="text-xs text-emerald-200">
                Current GPS position is inside target cadastral parcel <strong>{selectedUlpin}</strong> perimeter.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate(`/parcels/${selectedUlpin}`)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
          >
            Open Land Profile
          </Button>
        </div>
      )}

      {/* Main Grid: HUD + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Telemetry HUD & Maneuvers (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Target Destination Selector */}
          <Card className="bg-zinc-900/80 border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-semibold flex items-center justify-between">
                <span>Select Destination Parcel</span>
                <MapPin className="w-4 h-4 text-cyan-400" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={selectedUlpin}
                onChange={(e) => setSelectedUlpin(e.target.value)}
                className="w-full bg-zinc-950 border border-border text-white text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-cyan-400"
              >
                {parcels.map((p) => (
                  <option key={p.ulpin} value={p.ulpin}>
                    {p.ulpin} - {p.survey_number || p.surveyNumber || 'Survey Parcel'}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={trackingMode === 'simulation' ? 'default' : 'outline'}
                  onClick={() => setTrackingMode('simulation')}
                  className="flex-1 text-xs"
                >
                  <Radio className="w-3.5 h-3.5 mr-1" /> Field Simulator
                </Button>
                <Button
                  size="sm"
                  variant={trackingMode === 'device' ? 'default' : 'outline'}
                  onClick={startDeviceGeolocation}
                  className="flex-1 text-xs"
                >
                  <Compass className="w-3.5 h-3.5 mr-1" /> My Device GPS
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Turn-by-Turn Maneuver Card */}
          {navRoute && (
            <Card className="bg-gradient-to-b from-cyan-950/40 via-zinc-900/90 to-zinc-900 border-cyan-500/30 shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>NEXT MANEUVER</span>
                  <span className="text-cyan-400 font-semibold">
                    Step {currentStepIndex + 1} of {navRoute.maneuvers.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                    {currentManeuver?.type.includes('right') ? (
                      <CornerUpRight className="w-7 h-7" />
                    ) : currentManeuver?.type.includes('left') ? (
                      <CornerUpLeft className="w-7 h-7" />
                    ) : currentManeuver?.type === 'arrive' ? (
                      <Flag className="w-7 h-7 text-emerald-400" />
                    ) : (
                      <ArrowUp className="w-7 h-7" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-base leading-snug">
                      {currentManeuver?.instruction || 'Proceed along designated cadastral route'}
                    </p>
                    <p className="text-xs text-cyan-300 mt-1">
                      In {currentManeuver?.distance_meters || 0} meters
                    </p>
                  </div>
                </div>

                {/* Route Metrics Row */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-center">
                  <div className="p-2 bg-black/40 rounded-lg">
                    <span className="text-zinc-400 text-xs block">Remaining Distance</span>
                    <strong className="text-white text-base">{navRoute.total_distance_km} km</strong>
                  </div>
                  <div className="p-2 bg-black/40 rounded-lg">
                    <span className="text-zinc-400 text-xs block">Estimated Time (ETA)</span>
                    <strong className="text-white text-base">{navRoute.eta_minutes} mins</strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Live Telemetry Sensor Gauges */}
          <Card className="bg-zinc-900/80 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-semibold flex items-center justify-between">
                <span>GPS Telemetry Feed</span>
                <span className="text-xs font-normal text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Signal
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-black/50 rounded-lg border border-border/40">
                  <span className="text-zinc-400 block">Patrol Officer:</span>
                  <strong className="text-white truncate block">{currentGPS.officer_name}</strong>
                </div>
                <div className="p-2.5 bg-black/50 rounded-lg border border-border/40">
                  <span className="text-zinc-400 block">Speed (km/h):</span>
                  <strong className="text-cyan-400 text-sm font-bold">{currentGPS.speed_kmh} km/h</strong>
                </div>
                <div className="p-2.5 bg-black/50 rounded-lg border border-border/40">
                  <span className="text-zinc-400 block">Compass Heading:</span>
                  <strong className="text-white">{currentGPS.heading_degrees}°</strong>
                </div>
                <div className="p-2.5 bg-black/50 rounded-lg border border-border/40">
                  <span className="text-zinc-400 block">GPS Accuracy:</span>
                  <strong className="text-white">±{currentGPS.accuracy_meters}m</strong>
                </div>
              </div>

              <div className="p-2.5 bg-black/50 rounded-lg border border-border/40 space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Latitude:</span>
                  <span className="text-white font-mono">{currentGPS.latitude.toFixed(6)}° N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Longitude:</span>
                  <span className="text-white font-mono">{currentGPS.longitude.toFixed(6)}° E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Altitude:</span>
                  <span className="text-white font-mono">{currentGPS.altitude?.toFixed(1)} m</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Map Canvas (8 cols) */}
        <div className="lg:col-span-8">
          <ParcelMap
            geojson={allGeojson}
            routeGeojson={navRoute?.route_geojson}
            height="680px"
            activePatrol={{
              latitude: currentGPS.latitude,
              longitude: currentGPS.longitude,
              heading_degrees: currentGPS.heading_degrees,
              speed_kmh: currentGPS.speed_kmh,
              officer_name: currentGPS.officer_name,
            }}
            onParcelClick={(props) => {
              if (props?.ulpin) setSelectedUlpin(props.ulpin)
            }}
            onInspectAI={(ulpin) => navigate(`/ai-monitoring?ulpin=${ulpin}`)}
            onNavigateToParcel={(ulpin) => {
              setSelectedUlpin(ulpin)
              calculateRoute(ulpin)
            }}
          />
        </div>
      </div>
    </div>
  )
}
