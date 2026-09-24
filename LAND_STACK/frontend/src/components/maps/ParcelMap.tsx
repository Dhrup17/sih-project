import React, { useRef, useEffect, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Layers, Compass, Navigation, AlertTriangle } from 'lucide-react'

interface ParcelMapProps {
  geojson?: any
  height?: string
  onParcelClick?: (properties: any) => void
  routeGeojson?: any
  activePatrol?: {
    latitude: number
    longitude: number
    heading_degrees?: number
    speed_kmh?: number
    officer_name?: string
  }
  anomalies?: Array<{
    ulpin: string
    detection_type?: string
    confidence_score?: number
  }>
  onNavigateToParcel?: (ulpin: string) => void
  onInspectAI?: (ulpin: string) => void
}

export default function ParcelMap({
  geojson,
  height = '500px',
  onParcelClick,
  routeGeojson,
  activePatrol,
  anomalies = [],
  onNavigateToParcel,
  onInspectAI,
}: ParcelMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const patrolMarkerRef = useRef<maplibregl.Marker | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapStyle, setMapStyle] = useState<'satellite' | 'dark' | 'streets'>('satellite')

  // Available map basemaps
  const getStyleDefinition = (type: 'satellite' | 'dark' | 'streets') => {
    let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
    let attribution = '© Esri Satellite Imagery'

    if (type === 'streets') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      attribution = '© OpenStreetMap contributors'
    } else if (type === 'dark') {
      tileUrl = 'https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
      attribution = '© CartoDB'
    }

    return {
      version: 8 as const,
      sources: {
        basemap: {
          type: 'raster' as const,
          tiles: [tileUrl],
          tileSize: 256,
          attribution,
        },
      },
      layers: [
        {
          id: 'basemap-layer',
          type: 'raster' as const,
          source: 'basemap',
        },
      ],
    }
  }

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current) return

    const initialMap = new maplibregl.Map({
      container: mapContainer.current,
      style: getStyleDefinition(mapStyle),
      center: [80.9462, 26.8467], // Lucknow, UP
      zoom: 13,
      pitch: 20,
    })

    initialMap.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
    initialMap.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')

    initialMap.on('load', () => {
      map.current = initialMap
      setLoading(false)
      renderSpatialLayers()
    })

    return () => {
      initialMap.remove()
      map.current = null
    }
  }, [mapStyle])

  // Re-render spatial layers whenever geojson or route changes
  useEffect(() => {
    if (!map.current || loading) return
    renderSpatialLayers()
  }, [geojson, routeGeojson, anomalies, loading])

  // Update real-time patrol GPS marker
  useEffect(() => {
    if (!map.current || !activePatrol) return

    const el = document.createElement('div')
    el.className = 'patrol-gps-marker'
    el.innerHTML = `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(6, 182, 212, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 22px; height: 22px; border-radius: 50%; background: #06b6d4; border: 2.5px solid #ffffff; box-shadow: 0 0 14px #06b6d4; display: flex; align-items: center; justify-content: center; transform: rotate(${activePatrol.heading_degrees || 0}deg);">
          <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 9px solid #09090b; transform: translateY(-1px);"></div>
        </div>
      </div>
    `

    if (patrolMarkerRef.current) {
      patrolMarkerRef.current.setLngLat([activePatrol.longitude, activePatrol.latitude])
    } else {
      patrolMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([activePatrol.longitude, activePatrol.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="color: #09090b; font-family: sans-serif; padding: 4px;">
              <strong style="color: #0284c7;">${activePatrol.officer_name || 'Field Patrol'}</strong>
              <p style="margin: 2px 0 0; font-size: 11px;">Speed: ${activePatrol.speed_kmh || 0} km/h</p>
              <p style="margin: 2px 0 0; font-size: 11px;">Heading: ${activePatrol.heading_degrees || 0}°</p>
            </div>
          `)
        )
        .addTo(map.current)
    }
  }, [activePatrol])

  const renderSpatialLayers = () => {
    const m = map.current
    if (!m) return

    // 1. Parcels Layer
    if (geojson) {
      if (m.getSource('parcels-source')) {
        ;(m.getSource('parcels-source') as maplibregl.GeoJSONSource).setData(geojson)
      } else {
        m.addSource('parcels-source', {
          type: 'geojson',
          data: geojson,
        })

        // Land Use Color-coded Fill
        m.addLayer({
          id: 'parcels-fill',
          type: 'fill',
          source: 'parcels-source',
          paint: {
            'fill-color': [
              'match',
              ['get', 'land_use'],
              'Agricultural', '#22c55e',
              'Residential', '#3b82f6',
              'Commercial', '#a855f7',
              'Industrial', '#f97316',
              'Forest', '#15803d',
              '#06b6d4', // Default cyan
            ],
            'fill-opacity': 0.45,
          },
        })

        // Crisp border lines
        m.addLayer({
          id: 'parcels-line',
          type: 'line',
          source: 'parcels-source',
          paint: {
            'line-color': '#38bdf8',
            'line-width': 2.5,
            'line-opacity': 0.9,
          },
        })

        // Click interaction
        m.on('click', 'parcels-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const props = e.features[0].properties || {}
            const ulpin = props.ulpin || 'Unknown'
            const hasAnomaly = anomalies.some((a) => a.ulpin === ulpin)

            const popupNode = document.createElement('div')
            popupNode.style.minWidth = '220px'
            popupNode.style.fontFamily = 'Inter, sans-serif'
            popupNode.style.color = '#09090b'
            popupNode.innerHTML = `
              <div style="margin-bottom: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                  <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0284c7;">${ulpin}</h4>
                  ${
                    hasAnomaly
                      ? '<span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;">AI ALERT</span>'
                      : ''
                  }
                </div>
                <p style="margin: 3px 0 0; font-size: 11px; color: #475569;">Survey: <strong>${props.survey_number || 'N/A'}</strong></p>
                <p style="margin: 2px 0 0; font-size: 11px; color: #475569;">Land Use: <strong>${props.land_use || 'General'}</strong></p>
                <p style="margin: 2px 0 0; font-size: 11px; color: #475569;">Area: <strong>${Number(props.area || 0).toLocaleString()} m²</strong></p>
              </div>
              <div style="display: flex; gap: 6px; margin-top: 8px;">
                <button id="btn-popup-ai-${ulpin}" style="flex: 1; padding: 5px 8px; font-size: 11px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Inspect AI</button>
                <button id="btn-popup-nav-${ulpin}" style="flex: 1; padding: 5px 8px; font-size: 11px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Navigate</button>
              </div>
            `

            new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' })
              .setLngLat(e.lngLat)
              .setDOMContent(popupNode)
              .addTo(m)

            setTimeout(() => {
              const btnAi = document.getElementById(`btn-popup-ai-${ulpin}`)
              const btnNav = document.getElementById(`btn-popup-nav-${ulpin}`)
              if (btnAi && onInspectAI) btnAi.onclick = () => onInspectAI(ulpin)
              if (btnNav && onNavigateToParcel) btnNav.onclick = () => onNavigateToParcel(ulpin)
            }, 50)

            if (onParcelClick) onParcelClick(props)
          }
        })

        m.on('mouseenter', 'parcels-fill', () => {
          m.getCanvas().style.cursor = 'pointer'
        })
        m.on('mouseleave', 'parcels-fill', () => {
          m.getCanvas().style.cursor = ''
        })
      }

      // Auto fit bounds
      try {
        const bounds = new maplibregl.LngLatBounds()
        let hasCoords = false
        const features = geojson.type === 'FeatureCollection' ? geojson.features : [geojson]
        features.forEach((f: any) => {
          if (f?.geometry?.coordinates?.[0]) {
            f.geometry.coordinates[0].forEach((c: [number, number]) => {
              bounds.extend(c)
              hasCoords = true
            })
          }
        })
        if (hasCoords) {
          m.fitBounds(bounds, { padding: 45, maxZoom: 16 })
        }
      } catch (err) {
        // Fallback gracefully
      }
    }

    // 2. Navigation Route Layer
    if (routeGeojson) {
      if (m.getSource('route-source')) {
        ;(m.getSource('route-source') as maplibregl.GeoJSONSource).setData(routeGeojson)
      } else {
        m.addSource('route-source', {
          type: 'geojson',
          data: routeGeojson,
        })

        // Route casing / glow
        m.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route-source',
          paint: {
            'line-color': '#0284c7',
            'line-width': 8,
            'line-opacity': 0.5,
          },
        })

        // Route main line
        m.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-source',
          paint: {
            'line-color': '#38bdf8',
            'line-width': 4,
            'line-dasharray': [1, 1],
          },
        })
      }
    }
  }

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border shadow-2xl bg-zinc-950">
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-cyan-400 font-medium">
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            Loading GIS Map Layers...
          </div>
        </div>
      )}

      {/* Map Style Controls */}
      <div className="absolute top-3 left-3 z-10 flex gap-1.5 p-1 bg-black/80 backdrop-blur-md rounded-lg border border-border">
        <button
          onClick={() => setMapStyle('satellite')}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
            mapStyle === 'satellite'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> Satellite
        </button>
        <button
          onClick={() => setMapStyle('dark')}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
            mapStyle === 'dark'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" /> Dark GIS
        </button>
        <button
          onClick={() => setMapStyle('streets')}
          className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all ${
            mapStyle === 'streets'
              ? 'bg-cyan-500 text-black shadow-md'
              : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" /> Streets
        </button>
      </div>

      {/* Map Legend Indicator */}
      <div className="absolute bottom-3 right-3 z-10 p-2.5 bg-black/85 backdrop-blur-md rounded-lg border border-border text-xs text-zinc-300 space-y-1">
        <div className="font-semibold text-white mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          Cadastral Land Use
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-green-500"></span> Agricultural
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-500"></span> Residential
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-purple-500"></span> Commercial
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-orange-500"></span> Industrial
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-700"></span> Forest Reserve
        </div>
      </div>

      {/* MapLibre Canvas Container */}
      <div ref={mapContainer} style={{ width: '100%', height }} className="w-full" />
    </div>
  )
}
