import React, { createContext, useContext, useState, useCallback } from 'react'
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types'
import api from '../lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      try {
        return { ...JSON.parse(storedUser), token }
      } catch {
        return null
      }
    }
    return null
  })
  const [loading, setLoading] = useState(false)

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
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
