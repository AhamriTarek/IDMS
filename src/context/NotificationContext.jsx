import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import api from '../api/axios'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}

const POLL_INTERVAL_MS = 30_000  // poll every 30 seconds

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const intervalRef = useRef(null)

  // ── Fetch all notifications ───────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const { data } = await api.get('/notifications/')
      const list = data.results ?? data
      setNotifications(list)
      setUnreadCount(list.filter(n => !n.lu).length)
    } catch {
      // silently fail
    }
  }, [user])

  // ── Mark single notification as read ─────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      await api.post(`/notifications/${id}/marquer-lu/`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {/* ignore */}
  }, [])

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/marquer-tout-lu/')
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })))
      setUnreadCount(0)
    } catch {/* ignore */}
  }, [])

  // ── Start/stop polling based on auth ──────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchNotifications()
      intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user, fetchNotifications])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}
