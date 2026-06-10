import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import api, { tokenStorage } from '../api/axios'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/me/')
      setUser(data)
      return data
    } catch {
      setUser(null)
      return null
    }
  }, [])

  const login = useCallback(async (identifier, password) => {
    const { data } = await api.post('/token/', { username: identifier, password })
    tokenStorage.setTokens(data.access, data.refresh)
    api.defaults.headers.common.Authorization = `Bearer ${data.access}`
    const { data: me } = await api.get('/me/')
    // flushSync ensures the state update is committed before navigate() runs in
    // the caller, preventing ProtectedRoute from seeing a stale null user.
    flushSync(() => setUser(me))
    return me
  }, [setUser])

  // FIX: logout blacklists token on server
  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh()
    try {
      if (refresh) await api.post('/logout/', { refresh })
    } catch { /* ignore — clear local state regardless */ }
    delete api.defaults.headers.common.Authorization
    tokenStorage.clearTokens()
    setUser(null)
  }, [])

  // Restore session on page load
  useEffect(() => {
    const token = tokenStorage.getAccess()
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`
      fetchMe().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
      isAdmin:   user?.role === 'admin',
      isEmploye: user?.role === 'employe',
      fetchMe,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
