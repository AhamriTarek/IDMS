import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useDossiers } from '../../context/DossiersContext'
import { useNotifications } from '../../context/NotificationContext'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import { employeAPI } from '../../services/employeAPI'

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// FIX 1: StatCard accepts `loading` prop — shows '…' instead of premature 0
function StatCard({ icon, label, value, color, to, delay = 0, loading = false }) {
  const navigate = useNavigate()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="surface"
      onClick={() => to && navigate(to)}
      style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16, cursor: to ? 'pointer' : 'default', transition: 'all 0.18s ease' }}
      onMouseEnter={e => { if (to) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
    >
      <div style={{ width: 46, height: 46, borderRadius: 13, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1.1 }}>
          {loading ? '…' : value}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
      </div>
    </motion.div>
  )
}

export default function EmployeeDashboard() {
  const { user }              = useAuth()
  const { dossiers }          = useDossiers()
  const { unreadCount }       = useNotifications()
  const navigate              = useNavigate()
  const [subs, setSubs]       = useState([])
  const [loading, setLoading] = useState(true)
  // FIX 2: track when dossiers from context have had a chance to load;
  // prevents the "Aucun dossier" empty state flashing on first render.
  const [dossiersReady, setDossiersReady] = useState(false)

  const displayName = user?.profile?.prenom
    ? `${user.profile.prenom} ${user.profile.nom}`
    : user?.username ?? '—'

  const h        = new Date().getHours()
  const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await employeAPI.getSoumissions()
      setSubs(data.results ?? data)
    } catch { setSubs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // FIX 2: mark dossiers ready once our own API load finishes (by which
  // point DossiersContext will also have completed its initial fetch).
  useEffect(() => {
    if (!loading) setDossiersReady(true)
  }, [loading])

  const enAttente = subs.filter(s => s.status === 'en_attente').length
  const approuves = subs.filter(s => s.status === 'approuve').length
  const rejetes   = subs.filter(s => s.status === 'rejete').length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Tableau de bord" />
        <main style={{ flex: 1, padding: '28px 32px 48px', overflowY: 'auto' }}>

          {/* Welcome */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 4px' }}>
              {greeting}, {displayName} 👋
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </motion.div>

          {/* Stats */}
          {/* FIX 3: added missing Notifications stat card (4th slot was empty).
              FIX 1: all cards receive loading prop to show '…' while fetching.
              FIX: removed stale "Refusées" card — replaced with Notifications
                   so the grid remains balanced (4 cards, 4 columns). */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
            <StatCard icon="📁" label="Mes Dossiers"  value={dossiers.length} color="#1d4ed8" to="/employe/dossiers"      delay={0}    loading={!dossiersReady} />
            <StatCard icon="⏳" label="En Attente"    value={enAttente}       color="#d97706" to="/employe/soumissions"   delay={0.05} loading={loading} />
            <StatCard icon="✅" label="Acceptées"     value={approuves}       color="#16a34a" to="/employe/soumissions"   delay={0.1}  loading={loading} />
            <StatCard icon="🔔" label="Notifications" value={unreadCount}     color="#7c3aed" to="/employe/notifications" delay={0.15} loading={loading} />
          </div>

          {/* Quick actions */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} style={{ marginBottom: 28 }}>
            <p className="label" style={{ marginBottom: 10 }}>Actions rapides</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigate('/employe/dossiers')}>
                Mes Dossiers
              </button>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigate('/employe/soumissions')}>
                Mes Soumissions
              </button>
              {unreadCount > 0 && (
                <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => navigate('/employe/notifications')}>
                  🔔 {unreadCount} notification(s)
                </button>
              )}
            </div>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* Recent dossiers */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p className="label">Mes Dossiers Récents</p>
                <button onClick={() => navigate('/employe/dossiers')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontWeight: 500, padding: 0 }}>Voir tout</button>
              </div>
              <div className="surface" style={{ overflow: 'hidden' }}>
                {/* FIX 2: show loader while context is still hydrating */}
                {!dossiersReady ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Chargement…</div>
                ) : dossiers.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Aucun dossier accessible</div>
                ) : dossiers.slice(0, 4).map((d, i) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < Math.min(dossiers.length, 4) - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s', cursor: 'pointer' }}
                    onClick={() => navigate('/employe/dossiers')}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(29,78,216,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>📁</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titre}</div>
                      {/* FIX 4: backend may return fichiers_count (int) or fichiers
                          (array) depending on serializer depth — handle both */}
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {d.fichiers_count ?? d.fichiers?.length ?? 0} fichier(s)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent soumissions */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <p className="label">Dernières Soumissions</p>
                <button onClick={() => navigate('/employe/soumissions')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontWeight: 500, padding: 0 }}>Voir tout</button>
              </div>
              <div className="surface" style={{ overflow: 'hidden' }}>
                {loading ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Chargement…</div>
                ) : subs.length === 0 ? (
                  <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Aucune soumission</div>
                ) : subs.slice(0, 4).map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 16px', borderBottom: i < Math.min(subs.length, 4) - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ minWidth: 0 }}>
                      {/* FIX 5: fallback chain nom_fichier → dossier.titre → 'Soumission'
                          to avoid blank rows when nom_fichier is null/undefined */}
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.nom_fichier || s.dossier?.titre || 'Soumission'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{timeAgo(s.created_at)}</div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  )
}
