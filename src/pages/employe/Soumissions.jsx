import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { employeAPI } from '../../services/employeAPI'

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
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

  const TABS = [
    { key: 'all',        label: `Toutes (${counts.all})`                   },
    { key: 'en_attente', label: `En attente (${counts.en_attente})`         },
    { key: 'approuve',   label: `Acceptées (${counts.approuve})`            },
    { key: 'rejete',     label: `Refusées (${counts.rejete})`               },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Mes Soumissions" />
        <main style={{ flex: 1, padding: '28px 32px 48px', overflowY: 'auto' }}>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 2px' }}>Mes Soumissions</h1>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>{subs.length} soumission(s) au total</p>
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid',
                transition: 'all 0.15s',
                background: filter === tab.key ? 'var(--text-primary)' : 'var(--bg-raised)',
                color:      filter === tab.key ? 'white' : 'var(--text-secondary)',
                borderColor:filter === tab.key ? 'var(--text-primary)' : 'var(--border)',
              }}>{tab.label}</button>
            ))}
          </div>

          {loading ? (
            <div className="surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="surface">
              <EmptyState icon="📤" title="Aucune soumission" description={filter === 'all' ? 'Vous n\'avez pas encore soumis de dossiers. Ouvrez un dossier pour soumettre.' : 'Aucune soumission dans cette catégorie.'} />
            </div>
          ) : (
            <div className="surface" style={{ overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 2fr 100px 130px 1.8fr', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Dossier', 'Message', 'Date', 'Statut', 'Réponse Admin'].map(h => (
                  <span key={h} className="label">{h}</span>
                ))}
              </div>

              {filtered.map((s, i) => (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.6fr 2fr 100px 130px 1.8fr', gap: 12,
                    alignItems: 'center', padding: '13px 18px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>📁</span>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {typeof s.dossier === 'object' ? (s.dossier?.titre ?? '—') : (s.dossier_titre ?? '—')}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.commentaire || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>—</span>}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{timeAgo(s.created_at)}</div>
                  <div><StatusBadge status={s.status} pulse={s.status === 'en_attente'} /></div>

                  {/* Admin response */}
                  <div>
                    {s.status === 'en_attente' && (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>En cours de traitement…</span>
                    )}
                    {s.status === 'approuve' && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: '#d1fae5', color: '#065f46', fontSize: 12, fontWeight: 600 }}>
                        ✅ Soumission acceptée
                      </div>
                    )}
                    {s.status === 'rejete' && (
                      <div style={{ padding: '6px 10px', borderRadius: 8, background: '#fee2e2', color: '#991b1b', fontSize: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: s.rejection_reason ? 3 : 0 }}>❌ Refusée</div>
                        {s.rejection_reason && (
                          <div style={{ fontSize: 11, lineHeight: 1.4, opacity: 0.9 }}>
                            Motif : {s.rejection_reason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
