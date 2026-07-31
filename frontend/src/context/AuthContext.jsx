import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('fitkit_token')
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('fitkit_token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('fitkit_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload)
    localStorage.setItem('fitkit_token', res.data.token)
    setUser(res.data.user)
    return res.data
  }

  const refreshUser = async () => {
    const res = await api.get('/auth/me')
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem('fitkit_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
