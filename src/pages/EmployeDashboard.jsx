import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
})

const statusConfig = {
  en_attente: { cls: 'badge badge-amber', label: 'En attente' },
  approuve:   { cls: 'badge badge-green', label: 'Approuvé'   },
  rejete:     { cls: 'badge badge-red',   label: 'Rejeté'     },
}

export default function EmployeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [dossiers, setDossiers]   = useState([])
  const [subs, setSubs]           = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const [loading, setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [d, s, n] = await Promise.all([
        api.get('/dossiers/'),
        api.get('/soumissions/'),
        api.get('/notifications/non-lues-count/'),
      ])
      setDossiers(d.data.results ?? d.data)
      setSubs(s.data.results ?? s.data)
      setNotifCount(n.data.count ?? 0)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const prenom = user?.profile?.prenom ?? user?.username
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'

  const pending  = subs.filter(s => s.status === 'en_attente').length
  const approved = subs.filter(s => s.status === 'approuve').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Tableau de bord" />
        <main style={{ flex: 1, padding: '32px 32px 48px', overflowY: 'auto', maxWidth: 900, margin: '0 auto', width: '100%' }}>

          {/* Greeting */}
          <motion.div {...fade(0)} style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 4px' }}>
              {greeting}, {prenom} 👋
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </motion.div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 36 }}>
            {[
              { label: 'Dossiers accessibles', value: loading ? '…' : dossiers.length, color: 'var(--accent)', icon: <FolderIco />, to: '/employe/dossiers' },
              { label: 'Soumissions',           value: loading ? '…' : subs.length,    color: 'var(--green)', icon: <UploadIco />, to: '/employe/soumissions' },
              { label: 'En attente',            value: loading ? '…' : pending,         color: 'var(--amber)', icon: <ClockIco />,  to: '/employe/soumissions' },
              { label: 'Notifications',         value: loading ? '…' : notifCount,      color: 'var(--red)',   icon: <BellIco />,   to: '/employe/notifications' },
            ].map((c, i) => (
              <motion.div key={c.label} {...fade(0.05 + i * 0.05)}
                className="surface surface-hover"
                onClick={() => navigate(c.to)}
                style={{ padding: '20px 22px', cursor: 'pointer' }}
              >
                <div style={{ width: 34, height: 34, borderRadius: 10, background: c.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, marginBottom: 14 }}>
                  {c.icon}
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 5, fontWeight: 500 }}>{c.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <motion.div {...fade(0.25)} style={{ marginBottom: 36 }}>
            <p className="label" style={{ marginBottom: 12 }}>Actions rapides</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigate('/employe/soumissions')}>
                Soumettre un fichier
              </button>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigate('/employe/dossiers')}>
                Mes documents
              </button>
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Recent dossiers */}
            <motion.div {...fade(0.3)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p className="label">Mes dossiers</p>
                <button onClick={() => navigate('/employe/dossiers')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 500, padding: 0 }}>Voir tout</button>
              </div>
              <div className="surface" style={{ overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Chargement…</div>
                ) : dossiers.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Aucun dossier accessible</div>
                ) : dossiers.slice(0, 5).map((d, i) => (
                  <div key={d.id} style={{
                    padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12,
                    borderBottom: i < Math.min(dossiers.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FolderIco color="var(--accent)" size={14} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.titre}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{d.fichiers?.length ?? 0} fichier(s)</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent soumissions */}
            <motion.div {...fade(0.35)}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p className="label">Mes soumissions</p>
                <button onClick={() => navigate('/employe/soumissions')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 13, fontWeight: 500, padding: 0 }}>Voir tout</button>
              </div>
              <div className="surface" style={{ overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Chargement…</div>
                ) : subs.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Aucune soumission</div>
                ) : subs.slice(0, 5).map((s, i) => {
                  const b = statusConfig[s.status] ?? { cls: 'badge badge-gray', label: s.status }
                  return (
                    <div key={s.id} style={{
                      padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      borderBottom: i < Math.min(subs.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.nom_fichier}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{s.dossier?.titre ?? '—'}</div>
                      </div>
                      <span className={b.cls} style={{ flexShrink: 0 }}>{b.label}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  )
}

function FolderIco({ color = 'currentColor', size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
}
function UploadIco() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}
function ClockIco() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
}
function BellIco() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
