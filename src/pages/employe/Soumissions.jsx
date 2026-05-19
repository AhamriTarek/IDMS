import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import { employeAPI } from '../../services/employeAPI'

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_CFG = {
  en_attente: { label: 'En attente', cls: 'badge-amber', dot: 'var(--amber)' },
  approuve:   { label: 'Approuvé',   cls: 'badge-green', dot: 'var(--green)' },
  rejete:     { label: 'Rejeté',     cls: 'badge-red',   dot: 'var(--red)'   },
}

const TABS = [
  { key: 'all',        label: 'Toutes',     icon: '📋' },
  { key: 'en_attente', label: 'En attente', icon: '⏳' },
  { key: 'approuve',   label: 'Acceptées',  icon: '✅' },
  { key: 'rejete',     label: 'Refusées',   icon: '❌' },
]

function Skel() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="skeleton" style={{ height: 13, width: '60%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '35%', borderRadius: 5 }} />
      </div>
      <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 99 }} />
    </div>
  )
}

export default function EmployeeSoumissions() {
  const [subs, setSubs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await employeAPI.getSoumissions()
      setSubs(data.results ?? data)
    } catch { setSubs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const counts = {
    all:        subs.length,
    en_attente: subs.filter(s => s.status === 'en_attente').length,
    approuve:   subs.filter(s => s.status === 'approuve').length,
    rejete:     subs.filter(s => s.status === 'rejete').length,
  }
  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Mes Soumissions" />
        <main style={{ flex: 1, padding: '24px 24px', overflowY: 'auto' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 22 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 4 }}>Mes Soumissions</h1>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{subs.length} soumission{subs.length !== 1 ? 's' : ''} au total</p>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
            style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {TABS.map(tab => {
              const active = filter === tab.key
              return (
                <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', border: '1px solid',
                  transition: 'all 0.15s ease',
                  background: active ? 'rgba(99,102,241,0.15)' : 'var(--glass-bg)',
                  color:      active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                  borderColor: active ? 'rgba(99,102,241,0.30)' : 'var(--border-mid)',
                  boxShadow: active ? '0 0 0 1px rgba(99,102,241,0.10)' : 'none',
                }}>
                  <span>{tab.icon}</span>
                  {tab.label}
                  <span style={{ padding: '0 6px', borderRadius: 99, background: active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 700, color: active ? 'var(--accent-bright)' : 'var(--text-tertiary)' }}>
                    {counts[tab.key]}
                  </span>
                </button>
              )
            })}
          </motion.div>

          {/* List */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="surface" style={{ overflow: 'hidden' }}>
            {loading ? (
              [1,2,3,4,5].map(i => <Skel key={i} />)
            ) : filtered.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Aucune soumission</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {filter === 'all' ? 'Vous n\'avez pas encore soumis de dossiers.' : `Aucune soumission dans la catégorie "${TABS.find(t => t.key === filter)?.label}".`}
                </div>
              </div>
            ) : filtered.map((s, i) => {
              const sc = STATUS_CFG[s.status] || { label: s.status, cls: 'badge-gray', dot: 'var(--text-tertiary)' }
              return (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* File icon */}
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(129,140,248,0.10)', border: '1px solid rgba(129,140,248,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                    📤
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.nom_fichier || s.dossier?.titre || 'Soumission'}
                    </div>
                    {s.message && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {s.message}
                      </div>
                    )}
                    {s.reponse_admin && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', padding: '7px 10px', borderRadius: 8, background: s.status === 'rejete' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', border: `1px solid ${s.status === 'rejete' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`, marginTop: 6 }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }}>💬</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                          <strong style={{ color: 'var(--text-primary)' }}>Réponse : </strong>{s.reponse_admin}
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 5 }}>{timeAgo(s.created_at)}</div>
                  </div>

                  {/* Badge */}
                  <span className={`badge ${sc.cls}`} style={{ flexShrink: 0, marginTop: 2 }}>
                    <span className="badge-dot" style={{ background: sc.dot }} />
                    {sc.label}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
