import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { useTheme } from '../context/ThemeContext'
import ProfileAvatar from './ProfileAvatar'
import { User as UserIcon, LogOut } from 'lucide-react'

// ── Sun icon ──────────────────────────────────────────────────────────────────
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1"  x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3"  y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

// ── Moon icon ─────────────────────────────────────────────────────────────────
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

// ── Relative time helper ──────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ── Bell icon ─────────────────────────────────────────────────────────────────
function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

// ── Shared icon button ────────────────────────────────────────────────────────
function IconButton({ onClick, active = false, children, badge }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: 34, height: 34,
        borderRadius: 9,
        border: `1px solid ${hovered || active ? 'var(--border-mid)' : 'var(--border)'}`,
        background: active || hovered ? 'var(--bg-sunken)' : 'var(--bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        transition: 'all 0.15s ease',
      }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span style={{
          position: 'absolute', top: -3, right: -3,
          minWidth: 16, height: 16, borderRadius: 99,
          background: 'var(--red)', color: '#fff',
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px',
          border: '2px solid var(--bg-raised)',
        }}>{badge > 9 ? '9+' : badge}</span>
      )}
    </button>
  )
}

export default function Navbar({ title = 'IDMS' }) {
  const { user, isAdmin, logout }                                 = useAuth()
  const { unreadCount, notifications, markAsRead, markAllAsRead } = useNotifications()
  const { dark, toggle }                                          = useTheme()
  const navigate                                                  = useNavigate()
  const [notifOpen, setNotifOpen]                                 = useState(false)
  const [userOpen,  setUserOpen]                                  = useState(false)
  const notifRef                                                  = useRef(null)
  const userRef                                                   = useRef(null)

  useEffect(() => {
    const fn = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const displayName = user?.profile?.prenom
    ? `${user.profile.prenom} ${user.profile.nom}`
    : user?.username ?? '—'
  const photoUrl = user?.profile?.photo_url || user?.profile?.avatar || null

  const recent    = notifications.slice(0, 6)
  const notifPath = isAdmin ? '/admin/notifications' : '/employe/notifications'
  const typeDot   = {
    info:    'var(--accent)',
    success: 'var(--green)',
    warning: 'var(--amber)',
    error:   'var(--red)',
  }

  return (
    <header style={{
      height: 52, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: 'var(--bg-overlay)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 200,
    }}>
      {/* Page title */}
      <span style={{
        fontSize: 15, fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
      }}>
        {title}
      </span>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Dark / Light toggle */}
        <motion.div
          key={dark ? 'dark' : 'light'}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <IconButton onClick={toggle} active={dark}>
            {dark ? <SunIcon /> : <MoonIcon />}
          </IconButton>
        </motion.div>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <IconButton
            onClick={() => setNotifOpen(v => !v)}
            active={notifOpen}
            badge={unreadCount}
          >
            <BellIcon />
          </IconButton>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: 6,  scale: 0.97 }}
                transition={{ duration: 0.16, ease: [0.22,1,0.36,1] }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 310,
                  background: 'var(--bg-overlay)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  boxShadow: 'var(--shadow-xl)',
                  overflow: 'hidden', zIndex: 400,
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '12px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--accent)', fontSize: 12, fontWeight: 500, padding: 0,
                    }}>
                      Tout marquer lu
                    </button>
                  )}
                </div>

                {/* Items */}
                <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                  {recent.length === 0 ? (
                    <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                      Aucune notification
                    </div>
                  ) : recent.map(n => (
                    <div
                      key={n.id}
                      onClick={() => { markAsRead(n.id); setNotifOpen(false) }}
                      style={{
                        display: 'flex', gap: 10, padding: '11px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--border)',
                        background: n.lu ? 'transparent' : 'var(--accent-soft)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                      onMouseLeave={e => e.currentTarget.style.background = n.lu ? 'transparent' : 'var(--accent-soft)'}
                    >
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 7,
                        background: n.lu ? 'var(--border-mid)' : (typeDot[n.type_notif] || 'var(--accent)'),
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, lineHeight: 1.45,
                          color: 'var(--text-primary)',
                          fontWeight: n.lu ? 400 : 500,
                        }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>
                          {timeAgo(n.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => { setNotifOpen(false); navigate(notifPath) }}
                    style={{
                      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--accent)', fontSize: 13, fontWeight: 500, textAlign: 'center', padding: 0,
                    }}
                  >
                    Voir tout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User pill + dropdown */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setUserOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 12px 4px 4px',
              borderRadius: 99,
              border: '1px solid var(--border)',
              background: userOpen ? 'var(--bg)' : 'var(--bg-sunken)',
              cursor: 'pointer',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (!userOpen) e.currentTarget.style.background = 'var(--bg)' }}
            onMouseLeave={e => { if (!userOpen) e.currentTarget.style.background = 'var(--bg-sunken)' }}
          >
            <ProfileAvatar photoUrl={photoUrl} name={displayName} size={26} ring={false} fontSize={11} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {user?.profile?.prenom ?? user?.username ?? '—'}
            </span>
          </button>

          <AnimatePresence>
            {userOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: 6,  scale: 0.97 }}
                transition={{ duration: 0.16, ease: [0.22,1,0.36,1] }}
                style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 220,
                  background: 'var(--bg-overlay)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  boxShadow: 'var(--shadow-xl)',
                  overflow: 'hidden', zIndex: 400,
                }}
              >
                <div style={{
                  padding: '12px 14px', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <ProfileAvatar photoUrl={photoUrl} name={displayName} size={36} ring={false} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {displayName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {isAdmin ? 'Administrateur' : 'Employé'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => { setUserOpen(false); navigate('/profile') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 14px', border: 'none', background: 'transparent',
                    cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-sunken)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <UserIcon size={14} color="var(--text-secondary)" />
                  Mon Profil
                </button>

                <button
                  onClick={async () => { setUserOpen(false); await logout(); navigate('/') }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '10px 14px', border: 'none', background: 'transparent',
                    cursor: 'pointer', fontSize: 13, color: 'var(--red)',
                    borderTop: '1px solid var(--border)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--red-soft)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  )
}
