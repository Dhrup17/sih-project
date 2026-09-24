import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ToastProvider } from './components/ui/toast'
import { Toaster } from './components/ui/toaster'
import Navbar from './components/layout/Navbar'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import CitizenDashboard from './pages/CitizenDashboard'
import OfficerDashboard from './pages/OfficerDashboard'
import ParcelSearch from './pages/ParcelSearch'
import ParcelProfile from './pages/ParcelProfile'
import ApplicationForm from './pages/ApplicationForm'
import ApplicationDetail from './pages/ApplicationDetail'
import ApplicationList from './pages/ApplicationList'
import AIMonitoringStudio from './pages/AIMonitoringStudio'
import GPSNavigationPage from './pages/GPSNavigationPage'
import DatabaseExplorer from './pages/DatabaseExplorer'

function PrivateRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950 text-cyan-400 font-medium">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
          Authenticating...
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />
  }
  
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-zinc-950 text-zinc-100">{children}</main>
    </>
  )
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route path="/" element={<PrivateRoute><CitizenDashboard /></PrivateRoute>} />
            <Route path="/citizen" element={<PrivateRoute><CitizenDashboard /></PrivateRoute>} />
            <Route path="/officer" element={<PrivateRoute><OfficerDashboard /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><OfficerDashboard /></PrivateRoute>} />
            
            <Route path="/ai-monitoring" element={<PrivateRoute><AIMonitoringStudio /></PrivateRoute>} />
            <Route path="/gps-nav" element={<PrivateRoute><GPSNavigationPage /></PrivateRoute>} />
            <Route path="/database" element={<PrivateRoute><DatabaseExplorer /></PrivateRoute>} />
            
            <Route path="/parcels" element={<PrivateRoute><ParcelSearch /></PrivateRoute>} />
            <Route path="/parcels/:ulpin" element={<PrivateRoute><ParcelProfile /></PrivateRoute>} />
            
            <Route path="/applications" element={<PrivateRoute><ApplicationList /></PrivateRoute>} />
            <Route path="/applications/new" element={<PrivateRoute><ApplicationForm /></PrivateRoute>} />
            <Route path="/applications/:id" element={<PrivateRoute><ApplicationDetail /></PrivateRoute>} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
