import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'

export default function Navbar({ title = 'IDMS' }) {
  const { user, logout, isAdmin }                                      = useAuth()
  const { unreadCount, notifications, markAsRead, markAllAsRead }      = useNotifications()
  const navigate                                                        = useNavigate()
  const [notifOpen, setNotifOpen]                                       = useState(false)
  const notifRef                                                        = useRef(null)

  useEffect(() => {
    const fn = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const recent = notifications.slice(0, 6)
  const notifPath = isAdmin ? '/admin/notifications' : '/employe/notifications'

  const typeDot = { info: 'var(--accent)', success: 'var(--green)', warning: 'var(--amber)', error: 'var(--red)' }

  return (
    <header style={{
      height: 52, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      {/* Title */}
      <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {title}
      </span>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button onClick={() => setNotifOpen(v => !v)} style={{
            position: 'relative', width: 34, height: 34,
            borderRadius: 9, border: '1px solid var(--border)',
            background: notifOpen ? 'var(--bg-sunken)' : 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background='var(--bg-sunken)'; e.currentTarget.style.borderColor='var(--border-mid)' }}
          onMouseLeave={e => { if (!notifOpen) { e.currentTarget.style.background='var(--bg)'; e.currentTarget.style.borderColor='var(--border)' } }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 16, height: 16, borderRadius: 99,
                background: 'var(--red)', color: 'white',
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 4px',
                border: '2px solid var(--bg-raised)',
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 300,
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  boxShadow: 'var(--shadow-lg)',
                  overflow: 'hidden', zIndex: 400,
                }}
              >
                <div style={{
                  padding: '12px 14px', display: 'flex',
                  justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--accent)', fontSize: 12, fontWeight: 500,
                      padding: 0,
                    }}>Tout marquer lu</button>
                  )}
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {recent.length === 0 ? (
                    <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                      Aucune notification
                    </div>
                  ) : recent.map(n => (
                    <div key={n.id} onClick={() => { markAsRead(n.id); setNotifOpen(false) }}
                      style={{
                        display: 'flex', gap: 10, padding: '11px 14px',
                        cursor: 'pointer', borderBottom: '1px solid var(--border)',
                        background: n.lu ? 'transparent' : 'var(--accent-soft)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background='var(--bg-sunken)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.lu ? 'transparent' : 'var(--accent-soft)'}
                    >
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 5,
                        background: n.lu ? 'var(--border-mid)' : (typeDot[n.type_notif] || 'var(--accent)'),
                      }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: n.lu ? 400 : 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.titre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{n.message}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => { setNotifOpen(false); navigate(notifPath) }} style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', fontSize: 13, fontWeight: 500, textAlign: 'center', padding: 0,
                  }}>Voir tout</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '4px 10px 4px 4px',
          borderRadius: 99, border: '1px solid var(--border)',
          background: 'var(--bg)',
          cursor: 'default',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
          }}>
            {user?.profile?.avatar
              ? <img src={user.profile.avatar} style={{ width: 26, height: 26, objectFit: 'cover' }} />
              : (user?.username?.[0] ?? '?').toUpperCase()
            }
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
            {user?.profile?.prenom ?? user?.username ?? '—'}
          </span>
        </div>
      </div>
    </header>
  )
}
