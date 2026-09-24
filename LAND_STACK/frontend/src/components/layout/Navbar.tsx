import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '../ui/button'
import { useToast } from '../ui/toast'
import {
  MapPin,
  Scan,
  Navigation,
  Database,
  ShieldAlert,
  User,
  LogOut,
  Radio,
  Layers,
  FileText
} from 'lucide-react'

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [wsConnected, setWsConnected] = useState(false)

  // Real-time WebSocket connection
  useEffect(() => {
    const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = (import.meta as any).env?.VITE_API_URL
      ? (import.meta as any).env.VITE_API_URL.replace(/^http/, 'ws').replace('/api/v1', '')
      : 'ws://localhost:8000'
    const wsUrl = `${wsHost}/api/v1/ws/live`

    let socket: WebSocket | null = null
    try {
      socket = new WebSocket(wsUrl)
      socket.onopen = () => {
        setWsConnected(true)
      }
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'ai_alert') {
            toast({
              title: '🚨 LIVE SATELLITE ALERT',
              description: msg.data.description || 'New surface anomaly detected by automated AI surveillance.',
              variant: 'destructive',
            })
          }
        } catch (e) {}
      }
      socket.onclose = () => {
        setWsConnected(false)
      }
      socket.onerror = () => {
        setWsConnected(false)
      }
    } catch (err) {
      setWsConnected(false)
    }

    return () => {
      if (socket) socket.close()
    }
  }, [])

  const navLinks = [
    { label: 'Citizen Portal', path: '/citizen', icon: MapPin },
    { label: 'Officer Dashboard', path: '/officer', icon: ShieldAlert },
    { label: 'AI Land Monitoring', path: '/ai-monitoring', icon: Scan },
    { label: 'GPS Navigation', path: '/gps-nav', icon: Navigation },
    { label: 'Parcel Search', path: '/parcels', icon: Layers },
    { label: 'PostGIS Hub', path: '/database', icon: Database },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-black/85 backdrop-blur-xl border-b border-border/80 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
            <Scan className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold text-white tracking-wider">LAND STACK</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                GIS 2.0
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">PostGIS · AI Vision · Live GPS</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                <link.icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live Stream Indicator */}
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
          wsConnected
            ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
            : 'bg-zinc-900 text-zinc-400 border-border'
        }`}>
          <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
          {wsConnected ? 'LIVE STREAM CONNECTED' : 'STREAM STANDBY'}
        </div>

        {/* User Info / Logout */}
        {user ? (
          <div className="flex items-center gap-2.5 pl-2 border-l border-border/70">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
              <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                {user.role}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              title="Logout"
              className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => navigate('/login')}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs"
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  )
}

export default Navbar