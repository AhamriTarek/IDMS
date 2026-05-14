import React from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import EmptyState from '../../components/EmptyState'
import { useNotifications } from '../../context/NotificationContext'

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const TYPE_CFG = {
  success: { icon: '✅', color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
  error:   { icon: '❌', color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
  warning: { icon: '⚠️', color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
  info:    { icon: 'ℹ️', color: '#1e40af', bg: '#dbeafe', dot: '#3b82f6' },
}

export default function EmployeeNotifications() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications()
  const sorted = [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Notifications" />
        <main style={{ flex: 1, padding: '28px 32px 48px', overflowY: 'auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 2px' }}>Notifications</h1>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
                {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} style={{ padding: '7px 16px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-sunken)'; e.currentTarget.style.borderColor = 'var(--border-mid)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                Tout marquer comme lu
              </button>
            )}
          </div>

          {sorted.length === 0 ? (
            <div className="surface">
              <EmptyState icon="🔔" title="Aucune notification" description="Vous serez notifié ici des réponses à vos soumissions." />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map((n, i) => {
                const cfg = TYPE_CFG[n.type_notif] || TYPE_CFG.info
                return (
                  <motion.div key={n.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => !n.lu && markAsRead(n.id)}
                    style={{
                      display: 'flex', gap: 14, padding: '16px 20px',
                      borderRadius: 14, cursor: n.lu ? 'default' : 'pointer',
                      background: n.lu ? 'var(--bg-raised)' : 'white',
                      border: `1px solid ${n.lu ? 'var(--border)' : cfg.dot + '55'}`,
                      borderLeft: `3px solid ${n.lu ? 'var(--border-mid)' : cfg.dot}`,
                      boxShadow: n.lu ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!n.lu) e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = n.lu ? 'none' : '0 2px 8px rgba(0,0,0,0.06)' }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 19 }}>
                      {cfg.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                        <div style={{ fontSize: 14, fontWeight: n.lu ? 500 : 700, color: 'var(--text-primary)' }}>{n.titre}</div>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo(n.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</div>
                      {!n.lu && (
                        <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#1d4ed8', fontWeight: 600 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1d4ed8' }} />
                          Non lu — cliquer pour marquer comme lu
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
