import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types'
import api from '../lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  checkAuth: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// Helper: decode JWT payload without external library
function decodeJWT(token: string): any {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = atob(payload)
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

// Helper: check if token is expired (with 5-minute buffer)
function isTokenExpired(token: string): boolean {
  const payload = decodeJWT(token)
  if (!payload || !payload.exp) return true
  return Date.now() / 1000 >= payload.exp - 300
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser && !isTokenExpired(token)) {
      try {
        return { ...JSON.parse(storedUser), token }
      } catch {
        return null
      }
    }
    // Clear stale/expired token on init
    if (token && isTokenExpired(token)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return null
  })
  const [loading, setLoading] = useState(true)

  // Verify token with backend on app startup
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    if (isTokenExpired(token)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const response = await api.get<User>('/auth/me')
      const userData = response.data
      localStorage.setItem('user', JSON.stringify(userData))
      setUser({ ...userData, token })
    } catch (err: any) {
      // Token invalid or user not found - clear local state
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Periodically check token expiry (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem('token')
      if (token && isTokenExpired(token)) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        window.location.href = '/login'
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true)
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials)
      const { user: userData, token } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser({ ...userData, token })
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password'
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterRequest) => {
    setLoading(true)
    try {
      const response = await api.post<AuthResponse>('/auth/register', data)
      const { user: userData, token } = response.data
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser({ ...userData, token })
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed'
      throw new Error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
