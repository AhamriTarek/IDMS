import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { adminAPI } from '../../services/employeAPI'

const FILE_ICON = { pdf: '📄', docx: '📝', xlsx: '📊', image: '🖼️', autre: '📁' }

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// ── Refuse modal ──────────────────────────────────────────────────────────────

function RefuseModal({ sub, onClose, onDone }) {
  const [raison, setRaison] = useState('')
  const [busy, setBusy]     = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!raison.trim()) return
    setBusy(true)
    try {
      await adminAPI.rejeter(sub.id, raison)
      onDone()
    } catch { /* ignore */ }
    finally { setBusy(false); onClose() }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.16 }}
        style={{ width: '100%', maxWidth: 420, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>

        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(220,38,38,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>❌</div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Refuser la soumission</h3>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
            Dossier : <strong>{typeof sub.dossier === 'object' ? sub.dossier?.titre : (sub.dossier_titre || 'Soumission')}</strong><br />
            Employé : <strong>{sub.employe?.prenom} {sub.employe?.nom}</strong>
          </p>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Motif du refus *</label>
            <textarea className="input" value={raison} onChange={e => setRaison(e.target.value)} rows={4}
              placeholder="Expliquez pourquoi cette soumission est refusée…"
              style={{ resize: 'vertical', lineHeight: 1.5, fontSize: 13 }} required />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
            <button type="submit" disabled={busy || !raison.trim()}
              style={{ flex: 2, padding: '10px 0', borderRadius: 9, border: 'none', background: '#dc2626', color: 'white', fontWeight: 600, fontSize: 14, cursor: busy || !raison.trim() ? 'not-allowed' : 'pointer', opacity: busy || !raison.trim() ? 0.65 : 1 }}>
              {busy ? 'Refus…' : '❌ Confirmer le refus'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ sub, onClose, onApprove, onRefuse }) {
  const [fichiers, setFichiers]         = useState([])
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [busy, setBusy]                 = useState(false)
  const [previewUrl, setPreviewUrl]     = useState(null)

  useEffect(() => {
    setLoadingFiles(true)
    adminAPI.getSoumissionFichiers(sub.id)
      .then(({ data }) => setFichiers(Array.isArray(data) ? data : (data.results ?? [])))
      .catch(() => setFichiers([]))
      .finally(() => setLoadingFiles(false))
  }, [sub.id])
  const dossierNom  = typeof sub.dossier === 'object' ? sub.dossier?.titre : (sub.dossier_titre ?? '—')
  const employeNom  = `${sub.employe?.prenom ?? ''} ${sub.employe?.nom ?? ''}`.trim() || '—'
  const employeEmail = sub.employe?.user?.email ?? '—'
  const initials    = ((sub.employe?.prenom?.[0] ?? '') + (sub.employe?.nom?.[0] ?? '')).toUpperCase() || '?'

  const handleApprove = async () => {
    setBusy(true)
    try { await onApprove(sub.id) } finally { setBusy(false) }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(2px)' }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 460, zIndex: 800,
          background: 'var(--bg-raised)', borderLeft: '1px solid var(--border)',
          boxShadow: '-12px 0 48px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column',
          fontFamily: 'var(--font)',
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Détail de la soumission</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>{timeAgo(sub.created_at)}</div>
          </div>
          <StatusBadge status={sub.status} pulse={sub.status === 'en_attente'} />
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            ×
          </button>
        </div>

        {/* ── Body (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Employee info */}
          <section>
            <div className="label" style={{ marginBottom: 10 }}>Employé</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{employeNom}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{employeEmail}</div>
              </div>
            </div>
          </section>

          {/* Dossier + comment */}
          <section>
            <div className="label" style={{ marginBottom: 10 }}>Dossier soumis</div>
            <div style={{ padding: '14px', background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📁</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{dossierNom}</span>
              </div>
              {sub.commentaire ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, padding: '10px 12px', background: 'var(--bg-sunken)', borderRadius: 8, borderLeft: '3px solid var(--border-mid)' }}>
                  {sub.commentaire}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Aucun commentaire</div>
              )}
            </div>
          </section>

          {/* Files */}
          <section>
            <div className="label" style={{ marginBottom: 10 }}>
              Fichiers soumis {!loadingFiles && `(${fichiers.length})`}
            </div>

            {loadingFiles ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Chargement des fichiers…</div>
            ) : fichiers.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, background: 'var(--bg)', borderRadius: 12, border: '1px solid var(--border)' }}>
                Aucun fichier dans ce dossier
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {fichiers.map(f => {
                  const isImage = f.type_fichier === 'image'
                  const btnBase = { flexShrink: 0, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-raised)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', cursor: 'pointer', padding: '5px 9px', gap: 4 }
                  return (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, transition: 'border-color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

                      <span style={{ fontSize: 22, flexShrink: 0 }}>{FILE_ICON[f.type_fichier] ?? '📁'}</span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nom || f.fichier?.split('/').pop()}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                          {f.type_fichier?.toUpperCase() ?? '—'} · {formatSize(f.taille)} · {timeAgo(f.created_at)}
                        </div>
                      </div>

                      {/* Preview / open in tab */}
                      {isImage ? (
                        <button onClick={e => { e.stopPropagation(); setPreviewUrl(f.fichier) }} style={btnBase}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)' }}
                          title="Prévisualiser">
                          👁 Voir
                        </button>
                      ) : (
                        <a href={f.fichier} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                          style={btnBase}
                          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)' }}
                          title="Ouvrir dans un onglet">
                          👁 Voir
                        </a>
                      )}

                      {/* Force-download */}
                      <a href={f.fichier} target="_blank" rel="noreferrer" download onClick={e => e.stopPropagation()}
                        style={btnBase}
                        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)' }}
                        title="Télécharger">
                        ⬇
                      </a>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── Footer: actions ── */}
        {sub.status === 'en_attente' ? (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0, background: 'var(--bg-raised)' }}>
            <button onClick={() => onRefuse(sub)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 9, border: '1px solid rgba(220,38,38,0.35)', background: 'rgba(220,38,38,0.06)', color: '#dc2626', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}>
              ❌ Refuser
            </button>
            <button onClick={handleApprove} disabled={busy}
              style={{ flex: 2, padding: '10px 0', borderRadius: 9, border: 'none', background: '#16a34a', color: 'white', fontSize: 14, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.65 : 1, transition: 'opacity 0.15s' }}>
              {busy ? 'Traitement…' : '✅ Accepter la soumission'}
            </button>
          </div>
        ) : (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'var(--bg-raised)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Soumission traitée ·</span>
            <StatusBadge status={sub.status} />
          </div>
        )}
      </motion.div>

      {/* ── Image lightbox (fixed, above everything) ── */}
      <AnimatePresence>
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setPreviewUrl(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1500, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
            <button onClick={() => setPreviewUrl(null)}
              style={{ position: 'absolute', top: 18, right: 18, width: 38, height: 38, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ×
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              src={previewUrl} alt="preview"
              onClick={e => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', cursor: 'default' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminSoumissions() {
  const [subs, setSubs]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  const [detailSub, setDetailSub]     = useState(null)
  const [refuseTarget, setRefuseTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await adminAPI.getSoumissions()
      setSubs(data.results ?? data)
    } catch { setSubs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const approve = async (id) => {
    await adminAPI.approuver(id)
    // Update the local copy so panel status refreshes immediately
    setSubs(prev => prev.map(s => s.id === id ? { ...s, status: 'approuve' } : s))
    setDetailSub(prev => prev?.id === id ? { ...prev, status: 'approuve' } : prev)
  }

  const handleRefuseDone = () => {
    load()
    setDetailSub(null)
  }

  const counts = {
    all:        subs.length,
    en_attente: subs.filter(s => s.status === 'en_attente').length,
    approuve:   subs.filter(s => s.status === 'approuve').length,
    rejete:     subs.filter(s => s.status === 'rejete').length,
  }

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Soumissions" />
        <main style={{ flex: 1, padding: '28px 32px 48px', overflowY: 'auto' }}>

          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 2px' }}>Soumissions</h1>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>{subs.length} soumission(s) au total</p>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Total',      value: counts.all,        color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)', icon: '📋' },
              { label: 'En attente', value: counts.en_attente, color: '#d97706', bg: 'rgba(217,119,6,0.08)',  icon: '⏳' },
              { label: 'Acceptées',  value: counts.approuve,   color: '#16a34a', bg: 'rgba(22,163,74,0.08)',  icon: '✅' },
              { label: 'Refusées',   value: counts.rejete,     color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  icon: '❌' },
            ].map(c => (
              <div key={c.label} className="surface" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 13 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: c.color, lineHeight: 1.1 }}>{c.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
            {[
              { key: 'all',        label: `Toutes (${counts.all})`            },
              { key: 'en_attente', label: `En attente (${counts.en_attente})` },
              { key: 'approuve',   label: `Acceptées (${counts.approuve})`    },
              { key: 'rejete',     label: `Refusées (${counts.rejete})`       },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding: '6px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                background:   filter === tab.key ? 'var(--text-primary)' : 'var(--bg-raised)',
                color:        filter === tab.key ? 'white' : 'var(--text-secondary)',
                borderColor:  filter === tab.key ? 'var(--text-primary)' : 'var(--border)',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="surface">
              <EmptyState icon="📋" title="Aucune soumission"
                description={filter === 'all' ? 'Aucune soumission reçue pour le moment.' : 'Aucune soumission dans cette catégorie.'} />
            </div>
          ) : (
            <div className="surface" style={{ overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.3fr 1.6fr 90px 100px 130px', gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Employé', 'Dossier', 'Message', 'Date', 'Statut', 'Actions'].map(h => (
                  <span key={h} className="label">{h}</span>
                ))}
              </div>

              {filtered.map((s, i) => (
                <motion.div key={s.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setDetailSub(s)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1.4fr 1.3fr 1.6fr 90px 100px 130px', gap: 12,
                    alignItems: 'center', padding: '13px 18px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 0.12s',
                    background: detailSub?.id === s.id ? 'var(--accent-soft)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (detailSub?.id !== s.id) e.currentTarget.style.background = 'var(--bg)' }}
                  onMouseLeave={e => { if (detailSub?.id !== s.id) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Employé */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {((s.employe?.prenom?.[0] ?? '') + (s.employe?.nom?.[0] ?? '')).toUpperCase() || '?'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.employe?.prenom} {s.employe?.nom}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.employe?.user?.email ?? '—'}</div>
                    </div>
                  </div>

                  {/* Dossier */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      📁 {typeof s.dossier === 'object' ? (s.dossier?.titre ?? '—') : (s.dossier_titre ?? '—')}
                    </div>
                    {typeof s.dossier === 'object' && s.dossier?.fichiers_count != null && (
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{s.dossier.fichiers_count} fichier(s)</div>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.commentaire || <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>—</span>}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{timeAgo(s.created_at)}</div>

                  <div><StatusBadge status={s.status} pulse={s.status === 'en_attente'} /></div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    {s.status === 'en_attente' ? (
                      <>
                        <button onClick={() => approve(s.id)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(22,163,74,0.35)', background: 'rgba(22,163,74,0.08)', color: '#15803d', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,163,74,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(22,163,74,0.08)'}>
                          ✅
                        </button>
                        <button onClick={() => setRefuseTarget(s)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,0.16)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,0.06)'}>
                          ❌
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Traité</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {detailSub && (
          <DetailPanel
            sub={detailSub}
            onClose={() => setDetailSub(null)}
            onApprove={approve}
            onRefuse={(s) => setRefuseTarget(s)}
          />
        )}
      </AnimatePresence>

      {/* Refuse modal (z-index above panel) */}
      <AnimatePresence>
        {refuseTarget && (
          <RefuseModal
            sub={refuseTarget}
            onClose={() => setRefuseTarget(null)}
            onDone={handleRefuseDone}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
