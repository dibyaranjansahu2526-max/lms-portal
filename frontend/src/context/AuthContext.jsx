import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem('lms_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('lms_token'))
  const [user, setUser] = useState(readStoredUser)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('lms_token')))

  useEffect(() => {
    let active = true

    if (!token) {
      setLoading(false)
      return undefined
    }

    setLoading(true)
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (!active) return
        setUser(data)
        localStorage.setItem('lms_user', JSON.stringify(data))
      })
      .catch(() => {
        if (!active) return
        setUser(null)
        setToken(null)
        localStorage.removeItem('lms_token')
        localStorage.removeItem('lms_user')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [token])

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener('lms:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('lms:unauthorized', handleUnauthorized)
  }, [])

  const persistSession = (data) => {
    localStorage.setItem('lms_token', data.token)
    localStorage.setItem('lms_user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    persistSession(data)
    return data.user
  }

  const register = async (details) => {
    const { data } = await api.post('/auth/register', details)
    persistSession(data)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('lms_token')
    localStorage.removeItem('lms_user')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, isAuthenticated: Boolean(user) }),
    [user, token, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
