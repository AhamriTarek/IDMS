import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { useNotifications } from '../context/NotificationContext'

const typeConfig = {
  info:    { color: 'var(--accent)', bg: 'var(--accent-soft)' },
  success: { color: 'var(--green)',  bg: 'var(--green-soft)'  },
  warning: { color: 'var(--amber)',  bg: 'var(--amber-soft)'  },
  error:   { color: 'var(--red)',    bg: 'var(--red-soft)'    },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)   return 'À l\'instant'
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`
  if (diff < 86400)return `Il y a ${Math.floor(diff/3600)} h`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, fetchNotifications } = useNotifications()

  useEffect(() => { fetchNotifications() }, [])

  const unread = notifications.filter(n => !n.lu)
  const read   = notifications.filter(n =>  n.lu)

  const Group = ({ title, items }) => (
    items.length === 0 ? null : (
      <div style={{ marginBottom: 28 }}>
        <p className="label" style={{ marginBottom: 10 }}>{title}</p>
        <div className="surface" style={{ overflow: 'hidden' }}>
          {items.map((n, i) => {
            const cfg = typeConfig[n.type_notif] ?? typeConfig.info
            return (
              <motion.div key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => !n.lu && markAsRead(n.id)}
                style={{
                  display: 'flex', gap: 14, padding: '14px 18px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                  background: n.lu ? 'transparent' : cfg.bg + '80',
                  cursor: n.lu ? 'default' : 'pointer',
                  transition: 'background 0.12s',
                  alignItems: 'flex-start',
                }}
                onMouseEnter={e => { if (!n.lu) e.currentTarget.style.background='var(--bg-sunken)' }}
                onMouseLeave={e => { if (!n.lu) e.currentTarget.style.background = cfg.bg + '80' }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 6,
                  background: n.lu ? 'var(--border-mid)' : cfg.color,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, fontWeight: n.lu ? 400 : 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {n.titre}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {n.message}
                  </p>
                </div>
                {!n.lu && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 7 }} />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    )
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Notifications" />
        <main style={{ flex: 1, padding: '32px 32px 48px', overflowY: 'auto', maxWidth: 760, margin: '0 auto', width: '100%' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 2px' }}>Notifications</h1>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
                {unread.length > 0 ? `${unread.length} non lue${unread.length > 1 ? 's' : ''}` : 'Tout est lu'}
              </p>
            </div>
            {unread.length > 0 && (
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={markAllAsRead}>
                Tout marquer lu
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="surface" style={{ padding: '56px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔔</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>Aucune notification pour l'instant</p>
            </div>
          ) : (
            <>
              <Group title="Non lues" items={unread} />
              <Group title="Lues"     items={read}   />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
