import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import ProfileAvatar from './ProfileAvatar'

const adminLinks = [
  { to: '/admin',               end: true,  label: "Vue d'ensemble",      icon: 'grid'   },
  { to: '/admin/dossiers',      end: false, label: 'Gestion des Dossiers', icon: 'folder' },
  { to: '/admin/comptes',       end: false, label: 'Comptes',              icon: 'users'  },
  { to: '/admin/soumissions',   end: false, label: 'Soumissions',          icon: 'upload' },
  { to: '/admin/notifications', end: false, label: 'Notifications',        icon: 'bell', notif: true },
]
const employeLinks = [
  { to: '/employe/dashboard',     end: true,  label: 'Tableau de bord', icon: 'grid'   },
  { to: '/employe/dossiers',      end: false, label: 'Mes Dossiers',    icon: 'folder' },
  { to: '/employe/soumissions',   end: false, label: 'Soumissions',     icon: 'upload' },
  { to: '/employe/notifications', end: false, label: 'Notifications',   icon: 'bell', notif: true },
]

// ── SVG icon paths ────────────────────────────────────────────────────────────
const PATHS = {
  grid:   <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></>,
  users:  <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  bell:   <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  folder: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  chevL:  <polyline points="15 18 9 12 15 6"/>,
  chevR:  <polyline points="9 18 15 12 9 6"/>,
}

function Icon({ name, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  )
}

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const { unreadCount }           = useNotifications()
  const navigate                  = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const links = isAdmin ? adminLinks : employeLinks

  const displayName = user?.profile?.prenom
    ? `${user.profile.prenom} ${user.profile.nom}`
    : user?.username ?? '—'
  const roleLabel  = isAdmin ? 'Administrateur' : 'Employé'
  const photoUrl   = user?.profile?.photo_url || user?.profile?.avatar || null
  const goProfile  = () => navigate('/profile')

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 232 }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{
        height: '100vh', position: 'sticky', top: 0, flexShrink: 0,
        background: 'var(--bg-raised)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', zIndex: 100,
        boxShadow: '1px 0 0 var(--border)',
      }}
    >
      {/* ── Logo bar ──────────────────────────────────────────────────────── */}
      <div style={{
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '0 14px' : '0 14px 0 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {/* Logo mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
          {/* Gradient logo mark */}
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #0071E3 0%, #005bb5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,113,227,0.35)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          {!collapsed && (
            <motion.span
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: 15, fontWeight: 700, letterSpacing: '-0.03em',
                color: 'var(--text-primary)', whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              IDMS
            </motion.span>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            background: 'var(--bg-sunken)',
            border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-tertiary)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-mid)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <Icon name={collapsed ? 'chevR' : 'chevL'} size={13} />
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <nav style={{
        flex: 1, padding: '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        overflowY: 'auto',
      }}>
        {links.map(({ to, end, label, icon, notif }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={{ textDecoration: 'none', display: 'block', position: 'relative' }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 10,
                padding: collapsed ? '9px 12px' : '9px 12px',
                borderRadius: 10,
                justifyContent: collapsed ? 'center' : 'flex-start',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive
                  ? 'var(--accent-soft)'
                  : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13.5,
                transition: 'all 0.15s ease',
                position: 'relative',
                whiteSpace: 'nowrap',
                // Accent left border on active
                boxShadow: isActive ? 'inset 2px 0 0 var(--accent)' : 'none',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'var(--bg-sunken)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
              >
                {/* Icon wrapper */}
                <span style={{ position: 'relative', flexShrink: 0 }}>
                  <Icon name={icon} size={16} />
                  {notif && unreadCount > 0 && collapsed && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--red)',
                      border: '1.5px solid var(--bg-raised)',
                    }} />
                  )}
                </span>

                {!collapsed && (
                  <>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {label}
                    </span>
                    {notif && unreadCount > 0 && (
                      <span style={{
                        background: 'var(--red)', color: '#fff',
                        borderRadius: 99, padding: '1px 6px',
                        fontSize: 11, fontWeight: 700, lineHeight: 1.6,
                        flexShrink: 0,
                      }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User + logout ──────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 8px', flexShrink: 0 }}>
        {!collapsed && (
          <button
            onClick={goProfile}
            title="Mon Profil"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 10, marginBottom: 4,
              background: 'var(--bg-sunken)',
              border: '1px solid var(--border)',
              width: '100%', cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-mid)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <ProfileAvatar photoUrl={photoUrl} name={displayName} size={30} ring={false} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{roleLabel}</div>
            </div>
          </button>
        )}

        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
            <button
              onClick={goProfile}
              title="Mon Profil"
              style={{
                border: 'none', background: 'transparent', padding: 0,
                cursor: 'pointer', borderRadius: '50%',
              }}
            >
              <ProfileAvatar photoUrl={photoUrl} name={displayName} size={32} ring={false} />
            </button>
          </div>
        )}

        <button
          onClick={async () => { await logout(); navigate('/') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '9px 12px' : '8px 12px',
            borderRadius: 10, border: 'none', background: 'transparent',
            color: 'var(--text-tertiary)', cursor: 'pointer',
            fontSize: 13, fontWeight: 400, width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-soft)'; e.currentTarget.style.color = 'var(--red)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
        >
          <Icon name="logout" size={15} />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </motion.aside>
  )
}
