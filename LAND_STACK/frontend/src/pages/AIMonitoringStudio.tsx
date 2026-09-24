import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { aiService, parcelService, anomalyService } from '@/services/api'
import type { Parcel, SatelliteScene, AIDetectionResult, AnomalyAlert } from '@/types'
import {
  Scan,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Layers,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Navigation,
  FileCheck,
  Eye,
  Sliders,
  Maximize2
} from 'lucide-react'

export default function AIMonitoringStudio() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { toast } = useToast()

  const [parcels, setParcels] = useState<Parcel[]>([])
  const [selectedUlpin, setSelectedUlpin] = useState<string>(searchParams.get('ulpin') || 'ULPIN-UP-LKO-001')
  const [scenes, setScenes] = useState<SatelliteScene[]>([])
  const [detectionResult, setDetectionResult] = useState<AIDetectionResult | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [activeView, setActiveView] = useState<'slider' | 'heatmap' | 'split'>('slider')
  const [sliderPosition, setSliderPosition] = useState(50)
  const [uploading, setUploading] = useState(false)
  const [recentAnomalies, setRecentAnomalies] = useState<AnomalyAlert[]>([])

  const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000'

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (selectedUlpin) {
      loadParcelScenes(selectedUlpin)
    }
  }, [selectedUlpin])

  const loadInitialData = async () => {
    try {
      const [parcelRes, anomalyRes] = await Promise.all([
        parcelService.search({}),
        anomalyService.list(),
      ])
      const pList = Array.isArray(parcelRes.data) ? parcelRes.data : (parcelRes.data as any)?.data || []
      setParcels(pList)

      const aList = Array.isArray(anomalyRes.data) ? anomalyRes.data : (anomalyRes.data as any)?.data || []
      setRecentAnomalies(aList)

      if (pList.length > 0 && !selectedUlpin) {
        setSelectedUlpin(pList[0].ulpin)
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load initial parcel data', variant: 'destructive' })
    }
  }

  const loadParcelScenes = async (ulpin: string) => {
    try {
      const res = await aiService.getScenes(ulpin)
      setScenes(res.data || [])
      setDetectionResult(null)
    } catch (err) {
      toast({ title: 'Notice', description: 'Generating initial satellite imagery baseline for parcel...', variant: 'default' })
    }
  }

  const handleRunAIDetection = async () => {
    if (!selectedUlpin) return
    setIsScanning(true)
    try {
      const res = await aiService.detectChange(selectedUlpin)
      setDetectionResult(res.data)
      setActiveView('heatmap')
      toast({
        title: res.data.change_detected ? '⚠️ AI Anomaly Detected!' : '✓ Land Verified Normal',
        description: res.data.description,
        variant: res.data.change_detected ? 'destructive' : 'default',
      })
    } catch (err) {
      toast({ title: 'Detection Error', description: 'Failed to complete AI change analysis', variant: 'destructive' })
    } finally {
      setIsScanning(false)
    }
  }

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedUlpin) return

    setUploading(true)
    const formData = new FormData()
    formData.append('ulpin', selectedUlpin)
    formData.append('image_type', 'acquisition')
    formData.append('sensor_name', 'Custom_UAV_Drone_Survey')
    formData.append('file', file)

    try {
      await aiService.uploadSatelliteImage(formData)
      toast({ title: 'Upload Successful', description: 'New satellite image registered. Running AI comparison...' })
      await loadParcelScenes(selectedUlpin)
      handleRunAIDetection()
    } catch (err) {
      toast({ title: 'Upload Failed', description: 'Unable to upload image file', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const baselineScene = scenes.find((s) => s.image_type === 'baseline') || scenes[0]
  const latestScene = scenes.find((s) => s.image_type === 'acquisition') || scenes[scenes.length - 1]

  const beforeUrl = baselineScene ? `${API_BASE}${baselineScene.image_path}` : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'
  const afterUrl = latestScene ? `${API_BASE}${latestScene.image_path}` : 'https://images.unsplash.com/photo-1524813686514-a57563d77d66?w=800'
  const heatmapUrl = detectionResult?.diff_heatmap_url ? `${API_BASE}${detectionResult.diff_heatmap_url}` : afterUrl

  return (
    <div className="p-6 pt-20 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-cyan-950/40 p-6 rounded-2xl border border-cyan-500/20 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              AI COMPUTER VISION SUITE
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sentinel-2 & PlanetScope High-Res Telemetry
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">AI Land Monitoring & Change Detection</h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Autonomous spectral change analysis comparing historical database baseline images with latest satellite/drone acquisitions to detect unauthorized construction, deforestation, and boundary encroachment.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRunAIDetection}
            disabled={isScanning}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold shadow-lg shadow-cyan-500/25 px-5"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Scanning Parcel...
              </>
            ) : (
              <>
                <Scan className="w-4 h-4 mr-2" /> Run AI Change Detection
              </>
            )}
          </Button>

          {detectionResult?.change_detected && (
            <Button
              onClick={() => navigate(`/gps-nav?ulpin=${selectedUlpin}`)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/25"
            >
              <Navigation className="w-4 h-4 mr-2" /> Dispatch GPS Patrol
            </Button>
          )}
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Parcel Selector & Upload (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Parcel Selector Card */}
          <Card className="bg-zinc-900/80 border-border backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base font-semibold flex items-center justify-between">
                <span>Select Target Parcel</span>
                <span className="text-xs font-normal text-zinc-400">{parcels.length} Registered</span>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Choose a cadastral parcel to inspect remote sensing baseline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={selectedUlpin}
                onChange={(e) => setSelectedUlpin(e.target.value)}
                className="w-full bg-zinc-950 border border-border text-white text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-cyan-400"
              >
                {parcels.map((p) => (
                  <option key={p.ulpin} value={p.ulpin}>
                    {p.ulpin} ({p.land_use || 'General'} - {Math.round(p.area)} m²)
                  </option>
                ))}
              </select>

              {/* Upload Custom Imagery */}
              <div className="pt-2 border-t border-border/60">
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  Upload Custom Satellite / Drone Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomUpload}
                  disabled={uploading}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer border border-border rounded-lg bg-zinc-950"
                />
                {uploading && <p className="text-xs text-cyan-400 mt-1 animate-pulse">Uploading and registering image...</p>}
              </div>
            </CardContent>
          </Card>

          {/* AI Detection Summary HUD */}
          {detectionResult ? (
            <Card className={`border backdrop-blur-md transition-all ${
              detectionResult.change_detected
                ? 'bg-red-950/20 border-red-500/40 shadow-xl shadow-red-950/30'
                : 'bg-emerald-950/20 border-emerald-500/40 shadow-xl shadow-emerald-950/30'
            }`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base font-bold flex items-center gap-2">
                    {detectionResult.change_detected ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span>AI Anomaly Identified</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Land In Compliance</span>
                      </>
                    )}
                  </CardTitle>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    detectionResult.change_detected ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {Math.round(detectionResult.confidence_score * 100)}% Confidence
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-black/40 rounded-lg border border-border/50">
                    <span className="text-zinc-400 block">Classification:</span>
                    <strong className="text-white text-sm">{detectionResult.detection_type}</strong>
                  </div>
                  <div className="p-2.5 bg-black/40 rounded-lg border border-border/50">
                    <span className="text-zinc-400 block">Affected Area:</span>
                    <strong className="text-white text-sm">{detectionResult.affected_area_sqm} m² ({detectionResult.change_percentage}%)</strong>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-lg border border-border/50 text-xs">
                  <span className="text-zinc-400 font-semibold block mb-1">AI Diagnostic:</span>
                  <p className="text-zinc-200 leading-relaxed">{detectionResult.description}</p>
                </div>

                <div className="p-3 bg-cyan-950/30 rounded-lg border border-cyan-500/30 text-xs">
                  <span className="text-cyan-400 font-semibold block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Recommended Legal Action:
                  </span>
                  <p className="text-cyan-100">{detectionResult.recommendation}</p>
                </div>

                <Button
                  onClick={() => navigate(`/gps-nav?ulpin=${selectedUlpin}`)}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs py-2"
                >
                  <Navigation className="w-3.5 h-3.5 mr-1.5" /> Navigate Field Officer to Coordinates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-900/60 border-border p-6 text-center text-zinc-400 space-y-2">
              <Scan className="w-10 h-10 text-cyan-400/50 mx-auto animate-pulse" />
              <p className="text-sm font-medium text-zinc-300">Ready for Spectral Scan</p>
              <p className="text-xs">Click "Run AI Change Detection" to initiate computer vision alignment and edge difference analysis.</p>
            </Card>
          )}

          {/* Recent Anomalies Feed */}
          <Card className="bg-zinc-900/80 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Active Surveillance Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-48 overflow-y-auto">
              {recentAnomalies.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedUlpin(a.ulpin || '')}
                  className={`p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    selectedUlpin === a.ulpin
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                      : 'bg-zinc-950/60 border-border text-zinc-400 hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex justify-between font-semibold text-white">
                    <span>{a.ulpin}</span>
                    <span className="text-red-400 font-normal">{a.detection_type || a.type}</span>
                  </div>
                  <p className="truncate text-zinc-400 text-[11px] mt-0.5">{a.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Imagery Comparison Canvas (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* View Mode Switcher */}
          <div className="flex items-center justify-between bg-zinc-900/90 p-2 rounded-xl border border-border">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveView('slider')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'slider' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" /> Interactive Slider
              </button>
              <button
                onClick={() => setActiveView('heatmap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'heatmap' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> AI Difference Heatmap
              </button>
              <button
                onClick={() => setActiveView('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeView === 'split' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Side-by-Side Split
              </button>
            </div>

            <div className="text-xs text-zinc-400 flex items-center gap-3 pr-2">
              <span>Parcel: <strong className="text-cyan-400">{selectedUlpin}</strong></span>
              <span>Resolution: <strong className="text-white">3m Ground Sample</strong></span>
            </div>
          </div>

          {/* Visual Display Container */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-black shadow-2xl min-h-[500px] flex items-center justify-center">
            {isScanning && (
              <div className="absolute inset-0 bg-black/70 z-30 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-cyan-400/20 border-t-cyan-400 rounded-full animate-spin"></div>
                  <Scan className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-white tracking-wide">Executing Computer Vision Convolution & Edge Masking...</p>
                <p className="text-xs text-cyan-400">Comparing Sentinel-2 baseline vs Recent acquisition</p>
              </div>
            )}

            {/* Mode 1: Interactive Swipe Slider */}
            {activeView === 'slider' && (
              <div className="relative w-full h-[520px] select-none overflow-hidden group">
                {/* Background Image: Latest Acquisition */}
                <img
                  src={afterUrl}
                  alt="Recent Satellite Acquisition"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 z-10 bg-black/75 px-3 py-1 rounded-full text-xs font-semibold text-cyan-300 border border-cyan-500/30">
                  Latest Acquisition (2024)
                </div>

                {/* Foreground Image: Baseline (Clipped by slider position) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img
                    src={beforeUrl}
                    alt="Historical Baseline"
                    className="absolute inset-y-0 left-0 h-full object-cover max-w-none"
                    style={{ width: '100%', minWidth: '700px' }}
                  />
                  <div className="absolute top-4 left-4 z-10 bg-black/75 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-emerald-500/30">
                    Registration Baseline (2023)
                  </div>
                </div>

                {/* Slider Divider Line */}
                <div
                  className="absolute inset-y-0 z-20 w-1 bg-cyan-400 shadow-[0_0_15px_#00e5ff] cursor-ew-resize flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-7 h-7 rounded-full bg-cyan-400 text-black shadow-lg flex items-center justify-center font-bold text-xs">
                    ↔
                  </div>
                </div>

                {/* Range input for scrubbing */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
                />
              </div>
            )}

            {/* Mode 2: AI Difference Heatmap */}
            {activeView === 'heatmap' && (
              <div className="relative w-full h-[520px] flex items-center justify-center bg-black">
                <img
                  src={heatmapUrl}
                  alt="AI Difference Heatmap"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-4 left-4 bg-black/85 backdrop-blur-md p-3 rounded-xl border border-border text-xs space-y-1.5">
                  <p className="font-semibold text-white">AI Spectral Anomaly Heatmap</p>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="w-3 h-3 rounded bg-red-500"></span> Unauthorized Concrete / Structure
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="w-3 h-3 rounded bg-amber-400"></span> Canopy Loss / Deforestation
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="w-3 h-3 rounded bg-fuchsia-500"></span> Cadastral Boundary Encroachment
                  </div>
                </div>
              </div>
            )}

            {/* Mode 3: Side-by-Side Split */}
            {activeView === 'split' && (
              <div className="grid grid-cols-2 w-full h-[520px] gap-2 p-2 bg-zinc-950">
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={beforeUrl} alt="Baseline" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-xs text-emerald-400 font-semibold">
                    Registration Baseline
                  </div>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={afterUrl} alt="Latest" className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded text-xs text-cyan-400 font-semibold">
                    Latest Satellite Scene
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
