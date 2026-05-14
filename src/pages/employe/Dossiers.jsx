import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import EmptyState from '../../components/EmptyState'
import { useDossiers } from '../../context/DossiersContext'
import { employeAPI } from '../../services/employeAPI'

// acces string → { ajouter, supprimer }
function accesToPerm(acces) {
  if (acces === 'admin')    return { ajouter: true,  supprimer: true  }
  if (acces === 'ecriture') return { ajouter: true,  supprimer: false }
  return                           { ajouter: false, supprimer: false }
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024)         return `${bytes} B`
  if (bytes < 1024 * 1024)  return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

const FILE_ICON = { pdf: '📄', docx: '📝', xlsx: '📊', image: '🖼️', autre: '📁' }

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3000); return () => clearTimeout(t) }, [onDismiss])
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000, padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: 'white', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 28px rgba(0,0,0,0.22)', background: type === 'success' ? '#16a34a' : '#dc2626' }}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      {message}
    </motion.div>
  )
}

// ── Submission Modal ──────────────────────────────────────────────────────────

function SoumissionModal({ dossier, onClose, onSuccess }) {
  const [commentaire, setCommentaire] = useState('')
  const [busy, setBusy]   = useState(false)
  const [err, setErr]     = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr(null)
    try {
      await employeAPI.createSoumission(dossier.id, commentaire)
      onSuccess()
    } catch (e) {
      const data = e.response?.data
      const msg = data?.detail
        || (data && typeof data === 'object' ? Object.values(data).flat().join(' ') : null)
        || 'Erreur lors de l\'envoi.'
      setErr(msg)
    } finally { setBusy(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.18 }}
        style={{ width: '100%', maxWidth: 480, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>

        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(29,78,216,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📤</div>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Soumettre au Admin</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)' }}>Dossier : {dossier.titre}</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 22, lineHeight: 1 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Dossier</label>
            <input className="input" value={dossier.titre} readOnly style={{ fontSize: 13, background: 'var(--bg-sunken)', color: 'var(--text-tertiary)', cursor: 'not-allowed' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }}>Commentaire / Message</label>
            <textarea className="input" value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={4} placeholder="Décrivez votre soumission… (optionnel)" style={{ resize: 'vertical', lineHeight: 1.55, fontSize: 13 }} />
          </div>
          {err && <p style={{ margin: 0, fontSize: 12, color: '#dc2626', padding: '8px 12px', background: 'rgba(220,38,38,0.07)', borderRadius: 8 }}>{err}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
            <button type="submit" disabled={busy} style={{ flex: 2, padding: '9px 0', borderRadius: 9, border: 'none', cursor: busy ? 'not-allowed' : 'pointer', background: '#1d4ed8', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: busy ? 0.65 : 1 }}>
              <span>📤</span>{busy ? 'Envoi…' : 'Envoyer au Admin'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function EmployeeDossiers() {
  const { dossiers }                            = useDossiers()
  const [permsMap, setPermsMap]                 = useState({})  // dossierId → { ajouter, supprimer }
  const [expanded, setExpanded]                 = useState(null)
  const [filesMap, setFilesMap]                 = useState({})  // dossierId → files[]
  const filesMapRef                             = useRef({})    // always-current ref for loadFiles closure
  const [loadingFiles, setLoadingFiles]         = useState({})
  const [soumModal, setSoumModal]               = useState(null)
  const [toast, setToast]                       = useState(null)
  const [search, setSearch]                     = useState('')

  // Load current employee's permissions
  useEffect(() => {
    employeAPI.getPermissions().then(({ data }) => {
      const list = data.results ?? data
      const map  = {}
      list.forEach(p => {
        const did = typeof p.dossier === 'object' ? p.dossier?.id : p.dossier
        if (did != null) map[did] = accesToPerm(p.acces)
      })
      setPermsMap(map)
    }).catch(() => {})
  }, [])

  // fetchFiles always hits the API (no cache guard) and updates both state and ref
  const fetchFiles = useCallback(async (dossierId) => {
    setLoadingFiles(p => ({ ...p, [dossierId]: true }))
    try {
      const { data } = await employeAPI.getDossierDetail(dossierId)
      const files = data.fichiers || []
      filesMapRef.current = { ...filesMapRef.current, [dossierId]: files }
      setFilesMap(p => ({ ...p, [dossierId]: files }))
    } catch {
      filesMapRef.current = { ...filesMapRef.current, [dossierId]: [] }
      setFilesMap(p => ({ ...p, [dossierId]: [] }))
    } finally {
      setLoadingFiles(p => ({ ...p, [dossierId]: false }))
    }
  }, [])

  // loadFiles checks the ref (always current) so there are no stale closure issues
  const loadFiles = useCallback(async (dossierId) => {
    if (filesMapRef.current[dossierId]) return
    await fetchFiles(dossierId)
  }, [fetchFiles])

  const toggleExpand = (id) => {
    if (expanded === id) { setExpanded(null) } else { setExpanded(id); loadFiles(id) }
  }

  const handleUpload = async (dossierId, file) => {
    try {
      await employeAPI.uploadFichier(dossierId, file)
      // Force-refresh so the employee sees their new en_attente file with the badge
      await fetchFiles(dossierId)
      setToast({ message: 'Fichier ajouté — en attente d\'approbation ⏳', type: 'success' })
    } catch {
      setToast({ message: 'Erreur lors de l\'ajout du fichier', type: 'error' })
    }
  }

  const handleDelete = async (dossierId, fichier) => {
    if (!window.confirm(`Supprimer "${fichier.nom}" ?`)) return
    try {
      await employeAPI.deleteFichier(fichier.id)
      setFilesMap(p => ({ ...p, [dossierId]: (p[dossierId] || []).filter(f => f.id !== fichier.id) }))
      setToast({ message: 'Fichier supprimé', type: 'success' })
    } catch {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' })
    }
  }

  const filtered = dossiers.filter(d => d.titre.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Mes Dossiers" />
        <main style={{ flex: 1, padding: '28px 32px 48px', overflowY: 'auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 2px' }}>Mes Dossiers</h1>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>{dossiers.length} dossier(s) accessible(s)</p>
            </div>
            <div style={{ position: 'relative' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ paddingLeft: 34, width: 200, fontSize: 13 }} />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="surface">
              <EmptyState icon="📂" title="Aucun dossier accessible" description="Aucun dossier ne vous a été assigné pour le moment." />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filtered.map((d, i) => {
                const perm       = permsMap[d.id] || { ajouter: false, supprimer: false }
                const isExpanded = expanded === d.id
                const dFiles     = filesMap[d.id] || []
                const isLoading  = !!loadingFiles[d.id]

                return (
                  <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className="surface" style={{ overflow: 'hidden' }}>

                    {/* Dossier row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', cursor: 'pointer', transition: 'background 0.12s' }}
                      onClick={() => toggleExpand(d.id)}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(29,78,216,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>📁</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{d.titre}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{d.fichiers_count ?? 0} fichier(s)</div>
                      </div>

                      {/* Permission badges */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {perm.ajouter  && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, background: '#d1fae5', color: '#065f46', fontWeight: 600 }}>✓ Ajouter</span>}
                        {perm.supprimer && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, background: '#fee2e2', color: '#991b1b', fontWeight: 600 }}>✓ Supprimer</span>}
                        {!perm.ajouter && !perm.supprimer && <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, background: '#f3f4f6', color: '#6b7280', fontWeight: 600 }}>👁 Lecture seule</span>}
                      </div>

                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}>

                          {/* Action bar */}
                          <div style={{ display: 'flex', gap: 10, padding: '12px 20px', background: 'var(--bg-sunken)', alignItems: 'center' }}>
                            {perm.ajouter && (
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, background: '#1d4ed8', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                ＋ Ajouter un fichier
                                <input type="file" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) handleUpload(d.id, e.target.files[0]); e.target.value = '' }} />
                              </label>
                            )}
                            <button onClick={e => { e.stopPropagation(); setSoumModal(d) }}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 9, background: 'rgba(29,78,216,0.08)', color: '#1d4ed8', border: '1px solid rgba(29,78,216,0.2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,78,216,0.14)' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,78,216,0.08)' }}>
                              📤 Soumettre au Admin
                            </button>
                          </div>

                          {/* Files */}
                          {isLoading ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Chargement…</div>
                          ) : dFiles.length === 0 ? (
                            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Aucun fichier dans ce dossier</div>
                          ) : (
                            <>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px 80px', gap: 10, padding: '8px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                                {['Fichier', 'Type', 'Date', 'Taille', 'Actions'].map(h => (
                                  <span key={h} className="label">{h}</span>
                                ))}
                              </div>
                              {dFiles.map(f => (
                                <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px 80px 80px', gap: 10, alignItems: 'center', padding: '10px 20px', borderTop: '1px solid var(--border)', transition: 'background 0.12s' }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 16, flexShrink: 0 }}>{FILE_ICON[f.type_fichier] || '📁'}</span>
                                    <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nom}</span>
                                    {f.status === 'en_attente' && (
                                      <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99, background: 'rgba(217,119,6,0.12)', color: '#b45309', border: '1px solid rgba(217,119,6,0.25)' }}>
                                        En attente
                                      </span>
                                    )}
                                  </div>
                                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{f.type_fichier || '—'}</span>
                                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(f.created_at).toLocaleDateString('fr-FR')}</span>
                                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{f.taille_mb ? `${f.taille_mb} Mo` : formatSize(f.taille)}</span>
                                  <div style={{ display: 'flex', gap: 5 }}>
                                    <a href={f.fichier} target="_blank" rel="noreferrer" title="Voir / Télécharger"
                                      style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13 }}>
                                      👁
                                    </a>
                                    {perm.supprimer && (
                                      <button onClick={() => handleDelete(d.id, f)} title="Supprimer"
                                        style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                                        🗑
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {soumModal && (
          <SoumissionModal dossier={soumModal} onClose={() => setSoumModal(null)}
            onSuccess={() => { setSoumModal(null); setToast({ message: 'Soumission envoyée avec succès ✓', type: 'success' }) }} />
        )}
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}
