import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useDossiers } from '../context/DossiersContext'

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_TYPES = {
  enterprise: { label: 'Entreprise', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  bills:      { label: 'Factures',   color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  hr:         { label: 'RH',         color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  reports:    { label: 'Rapports',   color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
}
const PRESET_COLORS = ['#6366F1','#EC4899','#14B8A6','#F97316','#84CC16','#64748B']

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

function buildTypeConfig(customTypes) {
  const cfg = { ...DEFAULT_TYPES }
  customTypes.forEach(ct => {
    cfg[`custom_${ct.id}`] = {
      label: ct.name,
      color: ct.color,
      bg:    hexToRgba(ct.color, 0.12),
      customId: ct.id,
    }
  })
  return cfg
}

const FILE_TYPES   = ['pdf','docx','xlsx','png','jpg','csv']
const MAX_FILE_MB  = 50
const POLL_MS      = 2000

// ── Small helpers ─────────────────────────────────────────────────────────────
function Badge({ type, typeConfig }) {
  const cfg = typeConfig || DEFAULT_TYPES
  const c = cfg[type] || DEFAULT_TYPES.enterprise
  return (
    <span style={{
      display:'inline-block', padding:'2px 9px', borderRadius:99,
      fontSize:11, fontWeight:600, letterSpacing:'0.02em',
      color: c.color, background: c.bg,
    }}>{c.label}</span>
  )
}

function FileIcon({ type, size = 28 }) {
  const icons = {
    pdf:   { bg:'rgba(239,68,68,0.12)',  color:'#EF4444', label:'PDF'  },
    docx:  { bg:'rgba(59,130,246,0.12)', color:'#3B82F6', label:'DOC'  },
    xlsx:  { bg:'rgba(16,185,129,0.12)', color:'#10B981', label:'XLS'  },
    image: { bg:'rgba(245,158,11,0.12)', color:'#F59E0B', label:'IMG'  },
    autre: { bg:'rgba(148,163,184,0.12)',color:'#94A3B8', label:'FILE' },
  }
  const c = icons[type] || icons.autre
  return (
    <div style={{
      width:size, height:size, borderRadius:7, background:c.bg,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize: size * 0.28, fontWeight:700, color:c.color, flexShrink:0,
    }}>{c.label}</div>
  )
}

function Avatar({ name, size = 26 }) {
  const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4']
  const idx = (name || '').charCodeAt(0) % colors.length
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:colors[idx],
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontSize:size*0.36, fontWeight:700, flexShrink:0,
      border:'2px solid var(--bg-raised)',
    }}>{initials}</div>
  )
}

function Spinner({ size = 18, color = 'var(--accent)' }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      border:`2px solid rgba(0,212,255,0.15)`,
      borderTop:`2px solid ${color}`,
      animation:'spin 0.8s linear infinite', flexShrink:0,
    }} />
  )
}

// ── Folder SVG icon — macOS SF Symbols style ─────────────────────────────────
function FolderSVG({ size = 28 }) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.82)}
      viewBox="0 0 28 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink:0, display:'block' }}
    >
      <defs>
        <linearGradient id="ff-body" x1="14" y1="8" x2="14" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#5BABF5" />
          <stop offset="100%" stopColor="#2269BD" />
        </linearGradient>
        <linearGradient id="ff-tab" x1="8" y1="3" x2="8" y2="9" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#78BEFF" />
          <stop offset="100%" stopColor="#4A90E2" />
        </linearGradient>
      </defs>
      {/* Top-left flap */}
      <path d="M2 9 L2 6 Q2 4 4 4 L11.5 4 Q13.5 4 14.2 6.2 L15.4 9 Z" fill="url(#ff-tab)" />
      {/* Folder body */}
      <rect x="1" y="8.5" width="26" height="13.5" rx="3" fill="url(#ff-body)" />
      {/* Subtle highlight stripe at top of body */}
      <rect x="1" y="8.5" width="26" height="3" rx="0" fill="rgba(255,255,255,0.13)" />
    </svg>
  )
}

// ── Overlay backdrop ──────────────────────────────────────────────────────────
function Overlay({ onClose, children }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:1000,
      background:'rgba(0,0,0,0.45)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity:0, scale:0.95, y:14 }}
        animate={{ opacity:1, scale:1,    y:0  }}
        exit={{    opacity:0, scale:0.95, y:14 }}
        transition={{ duration:0.18 }}
        style={{
          width:'100%', maxWidth:560,
          background:'var(--bg-raised)', border:'1px solid var(--border)',
          borderRadius:20, boxShadow:'var(--shadow-xl)', overflow:'hidden',
          maxHeight:'90vh', display:'flex', flexDirection:'column',
        }}
      >{children}</motion.div>
    </div>
  )
}

function ModalHeader({ title, onClose }) {
  return (
    <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <h3 style={{ margin:0, fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>{title}</h3>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:20, lineHeight:1, padding:'0 2px' }}>×</button>
    </div>
  )
}

// ── CREATE MODAL ──────────────────────────────────────────────────────────────
function CreateModal({ employes, typeConfig, onClose, onCreated, onAnalysisStarted }) {
  const [form, setForm]       = useState({ titre:'', type_dossier:'enterprise' })
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const fileRef               = useRef()

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const addFiles = e => {

    const newFiles = Array.from(e.target.files).filter(f => {
      const ext = f.name.split('.').pop().toLowerCase()
      if (!FILE_TYPES.includes(ext)) return false
      if (f.size > MAX_FILE_MB * 1024 * 1024) return false
      return true
    })
    setFiles(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  const submit = async () => {
    if (!form.titre.trim()) { setError('Le titre est requis'); return }
    setLoading(true); setError(null)
    try {
      // 1. Create dossier
      const { data: dossier } = await api.post('/dossiers/', form)

      // 2. Upload files
      if (files.length > 0) {
        const fd = new FormData()
        files.forEach(f => fd.append('fichiers', f))
        await api.post(`/dossiers/${dossier.id}/fichiers/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      // 3. Trigger AI analysis in background — do not await
      if (files.length > 0) {
        api.post(`/dossiers/${dossier.id}/generer-carte-ia/`).catch(() => {})
        if (onAnalysisStarted) onAnalysisStarted(dossier.id)
      }

      onCreated(dossier.id)
      onClose()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : d?.detail || 'Erreur lors de la création')
    } finally { setLoading(false) }
  }

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Créer un dossier" onClose={onClose} />
      <div style={{ padding:'18px 22px', overflowY:'auto', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Titre */}
        <div>
          <label style={lbl}>Nom du dossier *</label>
          <input className="input" value={form.titre} onChange={set('titre')} placeholder="Ex: Contrats Q1 2026" style={{ fontSize:13 }} />
        </div>

        {/* Type */}
        <div>
          <label style={lbl}>Type</label>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Object.entries(typeConfig || DEFAULT_TYPES).map(([k, v]) => (
              <button key={k} onClick={() => setForm(f => ({ ...f, type_dossier: k }))}
                style={{
                  padding:'5px 14px', borderRadius:99, fontSize:12, fontWeight:600, cursor:'pointer',
                  border: form.type_dossier===k ? `1.5px solid ${v.color}` : '1.5px solid var(--border)',
                  background: form.type_dossier===k ? v.bg : 'transparent',
                  color: form.type_dossier===k ? v.color : 'var(--text-secondary)',
                  transition:'all 0.15s',
                }}>{v.label}</button>
            ))}
          </div>
        </div>

        {/* Files */}
        <div>
          <label style={lbl}>Fichiers (PDF, DOCX, XLSX, PNG, JPG, CSV — max {MAX_FILE_MB}MB)</label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles({ target: { files: e.dataTransfer.files }, value:'' }) }}
            style={{
              border:'1.5px dashed var(--border-mid)', borderRadius:10, padding:'14px 16px',
              cursor:'pointer', textAlign:'center', color:'var(--text-tertiary)', fontSize:13,
              transition:'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border-mid)'}
          >
            <span style={{ color:'var(--accent)', fontWeight:600 }}>Choisir des fichiers</span> ou glisser-déposer
            <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.csv"
              style={{ display:'none' }} onChange={addFiles} />
          </div>
          {files.length > 0 && (
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'var(--bg)', borderRadius:8, fontSize:12 }}>
                  <FileIcon type={f.name.split('.').pop().toLowerCase()} size={22} />
                  <span style={{ flex:1, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                  <span style={{ color:'var(--text-tertiary)', flexShrink:0 }}>{(f.size/1024/1024).toFixed(1)}MB</span>
                  <button onClick={() => setFiles(prev => prev.filter((_,j) => j!==i))}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:16, padding:'0 2px', lineHeight:1 }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error &&<p style={{ color:'var(--red)', fontSize:12, padding:'8px 12px', background:'var(--red-soft)', borderRadius:8, margin:0 }}>{error}</p>}
      </div>

      <div style={{ padding:'14px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end', flexShrink:0 }}>
        <button className="btn-secondary" onClick={onClose} style={{ fontSize:13 }}>Annuler</button>
        <button onClick={submit} disabled={loading}
          style={{
            padding:'8px 20px', borderRadius:9, border:'none', cursor: loading?'not-allowed':'pointer',
            background: loading ? 'var(--bg-sunken)' : 'var(--accent)',
            color: loading ? 'var(--text-tertiary)' : '#000',
            fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8,
            transition:'all 0.15s',
          }}>
          {loading && <Spinner size={14} color="#000" />}
          {loading ? 'Création en cours…' : 'Créer et analyser avec l\'IA'}
        </button>
      </div>
    </Overlay>
  )
}

// ── RESUME MODAL ──────────────────────────────────────────────────────────────
function ResumeModal({ dossier, onClose }) {
  const [state, setState]   = useState('loading') // loading | done | pending
  const [result, setResult] = useState(null)      // {fichiers:[{nom,points}], synthese_globale}
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await api.get(`/dossiers/${dossier.id}/resume-data/`)
        if (cancelled) return
        if (data.status === 'done' && data.data) {
          setResult(data.data)
          setState('done')
        } else {
          setState('pending')
        }
      } catch {
        if (!cancelled) setState('pending')
      }
    })()
    return () => { cancelled = true }
  }, [dossier.id])

  const toPlainText = () => {
    if (!result) return ''
    const lines = []
    result.fichiers.forEach(f => {
      lines.push(`📄 ${f.nom}`)
      lines.push('─'.repeat(40))
      f.points.forEach(p => lines.push(`  — ${p}`))
      lines.push('')
    })
    if (result.synthese_globale) {
      lines.push('═'.repeat(40))
      lines.push('🔍 Synthèse Globale')
      lines.push('═'.repeat(40))
      lines.push(result.synthese_globale)
    }
    return lines.join('\n')
  }

  const copy = () => {
    navigator.clipboard.writeText(toPlainText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadPdf = () => {
    if (!result) return
    const filesHtml = result.fichiers.map(f => `
      <div class="file">
        <div class="file-name">📄 ${f.nom}</div>
        <hr class="sep">
        ${f.points.map(p => `<div class="point">— ${p}</div>`).join('')}
      </div>`).join('')
    const globalHtml = result.synthese_globale ? `
      <div class="global">
        <div class="global-rule"></div>
        <div class="global-title">🔍 Synthèse Globale</div>
        <div class="global-rule"></div>
        <p class="global-text">${result.synthese_globale}</p>
      </div>` : ''
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Synthèse — ${dossier.titre}</title>
<style>
  body{font-family:Georgia,serif;max-width:720px;margin:40px auto;color:#1a1a2e;line-height:1.7;font-size:14px}
  h1{font-size:20px;border-bottom:2px solid #3B82F6;padding-bottom:8px;color:#1e3a5f}
  .file{margin:28px 0}
  .file-name{font-size:15px;font-weight:700;color:#1e3a5f;margin-bottom:4px}
  .sep{border:none;border-top:1px solid #d1d5db;margin:6px 0 12px}
  .point{margin:5px 0 5px 4px;color:#374151}
  .global{margin-top:36px}
  .global-rule{border:none;border-top:2px solid #94a3b8;margin:8px 0}
  .global-title{font-size:15px;font-weight:700;color:#1e3a5f;text-align:center;margin:6px 0}
  .global-text{color:#374151;margin:12px 0 0}
  @media print{body{margin:20px}}
</style></head><body>
<h1>📋 Synthèse — ${dossier.titre}</h1>
${filesHtml}${globalHtml}
</body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, '_blank')
    if (win) win.addEventListener('load', () => { win.print(); URL.revokeObjectURL(url) })
  }

  return (
    <Overlay onClose={onClose}>
      <ModalHeader title={`Synthèse — ${dossier.titre}`} onClose={onClose} />
      <div style={{ padding:'20px 22px', overflowY:'auto', minHeight:180, maxHeight:'60vh' }}>

        {state === 'loading' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'32px 0', color:'var(--text-tertiary)', fontSize:13 }}>
            <Spinner size={28} />
            <span>Chargement…</span>
          </div>
        )}

        {state === 'pending' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12, padding:'32px 0', color:'var(--text-tertiary)', fontSize:13 }}>
            <Spinner size={28} />
            <span>Analyse en cours, veuillez patienter…</span>
          </div>
        )}

        {state === 'done' && result && (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Global synthesis — shown first */}
            {result.synthese_globale && (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                  <span style={{ fontSize:14 }}>🔍</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', letterSpacing:'0.02em' }}>Synthèse Globale</span>
                </div>
                <div style={{ height:2, background:'var(--border-mid)', marginBottom:12, borderRadius:1 }} />
                <p style={{ margin:0, fontSize:13, color:'var(--text-secondary)', lineHeight:1.75 }}>
                  {result.synthese_globale}
                </p>
              </div>
            )}

            {/* Divider between synthesis and per-file sections */}
            {result.synthese_globale && result.fichiers.length > 0 && (
              <div style={{ height:1, background:'var(--border)', borderRadius:1 }} />
            )}

            {/* Per-file sections — shown second */}
            {result.fichiers.map((f, fi) => (
              <div key={fi}>
                {/* Filename */}
                <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                  <span style={{ fontSize:14 }}>📄</span>
                  <span style={{ fontSize:13.5, fontWeight:700, color:'var(--text-primary)' }}>{f.nom}</span>
                </div>
                {/* Thin separator */}
                <div style={{ height:1, background:'var(--border)', marginBottom:9 }} />
                {/* Points with — bullet */}
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {(f.points || []).map((p, pi) => (
                    <div key={pi} style={{ display:'flex', alignItems:'flex-start', gap:7 }}>
                      <span style={{ color:'var(--text-tertiary)', fontSize:12, marginTop:2, flexShrink:0, fontWeight:500 }}>—</span>
                      <span style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{p}</span>
                    </div>
                  ))}
                  {(!f.points || f.points.length === 0) && (
                    <span style={{ fontSize:12, color:'var(--text-tertiary)', fontStyle:'italic' }}>Aucun point extrait</span>
                  )}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {state === 'done' && (
        <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:8, justifyContent:'flex-end', flexShrink:0 }}>
          <button onClick={copy} className="btn-secondary" style={{ fontSize:12 }}>
            {copied ? 'Copié ✓' : 'Copier'}
          </button>
          <button onClick={downloadPdf} style={{
            padding:'6px 14px', borderRadius:8, border:'1px solid var(--border)',
            background:'var(--bg)', color:'var(--text-secondary)',
            fontSize:12, fontWeight:500, cursor:'pointer',
            display:'flex', alignItems:'center', gap:6,
          }}>
            ↓ Télécharger PDF
          </button>
        </div>
      )}
    </Overlay>
  )
}

// ── DELETE CONFIRM ────────────────────────────────────────────────────────────
function DeleteConfirm({ dossier, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false)
  const confirm = async () => {
    setLoading(true)
    try { await api.delete(`/dossiers/${dossier.id}/`); onDeleted(dossier.id); onClose() }
    catch { setLoading(false) }
  }
  return (
    <Overlay onClose={onClose}>
      <ModalHeader title="Supprimer le dossier" onClose={onClose} />
      <div style={{ padding:'20px 22px' }}>
        <p style={{ fontSize:13.5, color:'var(--text-secondary)', margin:0 }}>
          Supprimer <strong style={{ color:'var(--text-primary)' }}>{dossier.titre}</strong> ? Cette action est irréversible et supprimera tous les fichiers associés.
        </p>
      </div>
      <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="btn-secondary" onClick={onClose} style={{ fontSize:13 }}>Annuler</button>
        <button onClick={confirm} disabled={loading}
          style={{ padding:'8px 18px', borderRadius:9, border:'none', cursor:'pointer', background:'var(--red)', color:'#fff', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
          {loading && <Spinner size={14} color="#fff" />}
          Supprimer
        </button>
      </div>
    </Overlay>
  )
}

// ── DETAIL VIEW ───────────────────────────────────────────────────────────────
function DetailView({ dossier: initialDossier, employes, typeConfig, onClose, onUpdated, onAnalysisStarted }) {
  const [dossier, setDossier]         = useState(initialDossier)
  const [initialLoading, setInitialLoading] = useState(true)
  const [addingFiles, setAddingFiles]  = useState(false)
  const fileRef                        = useRef()

  const reload = useCallback(async () => {
    try {
      const { data } = await api.get(`/dossiers/${initialDossier.id}/`)
      setDossier(data)
      onUpdated(data)
    } catch {}
  }, [initialDossier.id, onUpdated])

  // Fetch full dossier (with fichiers) on open — list data has no fichiers array
  useEffect(() => {
    let active = true
    api.get(`/dossiers/${initialDossier.id}/`)
      .then(({ data }) => { if (active) { setDossier(data); onUpdated(data) } })
      .catch(() => {})
      .finally(() => { if (active) setInitialLoading(false) })
    return () => { active = false }
  }, [initialDossier.id])

  const deleteFile = async (id) => {
    try { await api.delete(`/fichiers/${id}/`); reload() } catch {}
  }

  const addFiles = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setAddingFiles(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('fichiers', f))
      await api.post(`/dossiers/${dossier.id}/fichiers/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // Signal parent: analysis started in background
      if (onAnalysisStarted) onAnalysisStarted(dossier.id)
      reload()
    } finally { setAddingFiles(false); e.target.value = '' }
  }

  const downloadFile = (fichier) => {
    const url = fichier.fichier.startsWith('http') ? fichier.fichier : `/media/${fichier.fichier}`
    window.open(url, '_blank')
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, scale:0.96, y:14 }} animate={{ opacity:1, scale:1, y:0 }} transition={{ duration:0.18 }}
        style={{ width:'100%', maxWidth:700, background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:20, boxShadow:'var(--shadow-xl)', overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{dossier.titre}</h3>
              <Badge type={dossier.type_dossier} typeConfig={typeConfig} />
            </div>
            <p style={{ margin:0, fontSize:12, color:'var(--text-tertiary)' }}>
              {dossier.fichiers?.length ?? 0} fichier(s) · Créé le {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', fontSize:20, lineHeight:1, padding:'0 2px' }}>×</button>
        </div>

        {/* Files list */}
        <div style={{ flex:1, overflowY:'auto', padding:'14px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
              Fichiers {!initialLoading && `(${dossier.fichiers?.length ?? 0})`}
            </span>
            <button onClick={() => fileRef.current?.click()} disabled={addingFiles}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text-secondary)', fontSize:12, cursor:'pointer' }}>
              {addingFiles ? <Spinner size={12} /> : '+'}
              Ajouter
            </button>
            <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.csv" style={{ display:'none' }} onChange={addFiles} />
          </div>

          {initialLoading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'24px 0' }}><Spinner size={20} /></div>
          ) : (!dossier.fichiers || dossier.fichiers.length === 0) ? (
            <p style={{ color:'var(--text-tertiary)', fontSize:13, textAlign:'center', padding:'24px 0' }}>Aucun fichier</p>
          ) : null}

          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {!initialLoading && dossier.fichiers?.map(f => (
              <div key={f.id} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 12px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:10 }}>
                <FileIcon type={f.type_fichier} size={32} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {f.nom}
                  </div>
                  <div style={{ marginTop:3, fontSize:11, color:'var(--text-tertiary)' }}>
                    {f.taille_mb}MB · {new Date(f.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => downloadFile(f)} title="Télécharger"
                    style={{ padding:'5px 10px', borderRadius:7, border:'1px solid var(--border)', background:'var(--bg-sunken)', color:'var(--text-secondary)', fontSize:12, cursor:'pointer' }}>↓</button>
                  <button onClick={() => deleteFile(f.id)} title="Supprimer"
                    style={{ padding:'5px 10px', borderRadius:7, border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.06)', color:'var(--red)', fontSize:12, cursor:'pointer' }}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permissions */}
        {dossier.employes_autorises?.length > 0 && (
          <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
            <div style={{ fontSize:12, color:'var(--text-tertiary)', marginBottom:6 }}>Accès accordé à</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {dossier.employes_autorises.map(e => (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:99, fontSize:12, color:'var(--text-secondary)' }}>
                  <Avatar name={`${e.prenom} ${e.nom}`} size={18} />
                  {e.prenom} {e.nom}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── DOSSIER ROW ───────────────────────────────────────────────────────────────
function DossierCard({ dossier, typeConfig, onVoir, onResumer, onSupprimer, index, isAnalyzing }) {
  const [hovered, setHovered] = useState(false)
  const hasFiles   = dossier.fichiers_count > 0
  const isAnalysed = !!dossier.has_resume && !isAnalyzing

  const rowBg = hovered
    ? 'rgba(0,0,0,0.03)'
    : index % 2 === 0 ? '#ffffff' : '#F9FAFB'

  return (
    <motion.div
      layout
      initial={{ opacity:0, x:-8 }}
      animate={{ opacity:1, x:0 }}
      exit={{ opacity:0 }}
      transition={{ duration:0.14 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:'flex', alignItems:'center', gap:14,
        padding:'11px 18px',
        background: rowBg,
        borderBottom:'1px solid var(--border)',
        transition:'background 0.12s',
        cursor:'default',
      }}
    >
      {/* Folder icon */}
      <div style={{ flexShrink:0 }}><FolderSVG size={28} /></div>

      {/* Name */}
      <div style={{ minWidth:0, width:200, flexShrink:0 }}>
        <div style={{
          fontSize:13.5, fontWeight:700, color:'var(--text-primary)',
          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>{dossier.titre}</div>
      </div>

      {/* Type badge */}
      <div style={{ flexShrink:0 }}>
        <Badge type={dossier.type_dossier} typeConfig={typeConfig} />
      </div>

      {/* File count */}
      <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, minWidth:70 }}>
        <span style={{ fontSize:13, color:'var(--text-tertiary)' }}>📄</span>
        <span style={{ fontSize:12, color:'var(--text-secondary)' }}>
          {dossier.fichiers_count} fichier{dossier.fichiers_count !== 1 ? 's' : ''}
        </span>
      </div>

      {/* AI status */}
      <div style={{ display:'flex', alignItems:'center', gap:5, flex:1, minWidth:0 }}>
        {!hasFiles ? (
          <span style={{ fontSize:12, color:'var(--text-tertiary)', fontStyle:'italic' }}>Aucun fichier</span>
        ) : isAnalysed ? (
          <span style={{ fontSize:12, color:'#10B981', fontWeight:500 }}>Analysé ✓</span>
        ) : (
          <span style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text-tertiary)' }}>
            <Spinner size={11} color="var(--text-tertiary)" />
            Analyse IA en cours…
          </span>
        )}
      </div>

      {/* Date */}
      <div style={{ fontSize:12, color:'var(--text-tertiary)', flexShrink:0, width:82, textAlign:'right' }}>
        {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button onClick={() => onVoir(dossier)} style={cardBtn('#3B82F6')}>Voir</button>
        {/* Résumer — disabled until resume_structure is ready */}
        <div title={!isAnalysed ? 'Analyse en cours, veuillez patienter…' : undefined}
          style={{ cursor: !isAnalysed ? 'not-allowed' : undefined }}>
          <button
            onClick={isAnalysed ? () => onResumer(dossier) : undefined}
            style={isAnalysed ? cardBtn('#8B5CF6') : {
              padding:'4px 11px', borderRadius:7,
              border:'1px solid #94A3B833', background:'#94A3B812',
              color:'#94A3B8', fontSize:11.5, fontWeight:600,
              cursor:'not-allowed', transition:'all 0.12s',
              pointerEvents:'none',
            }}
          >Résumer</button>
        </div>
        <button onClick={() => onSupprimer(dossier)} title="Supprimer" style={{
          padding:'4px 9px', borderRadius:7, border:'1px solid #EF444433',
          background:'#EF444412', color:'#EF4444', fontSize:13, cursor:'pointer',
          transition:'all 0.12s', lineHeight:1,
        }}>🗑</button>
      </div>
    </motion.div>
  )
}

function cardBtn(color, danger=false) {
  return {
    padding:'4px 11px', borderRadius:7, border:`1px solid ${color}33`,
    background: danger ? `${color}12` : `${color}12`,
    color: color, fontSize:11.5, fontWeight:600, cursor:'pointer',
    transition:'all 0.12s',
  }
}

const lbl = { display:'block', fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:5 }

// ── ADD TYPE POPOVER ──────────────────────────────────────────────────────────
function AddTypePopover({ onAdd, onClose }) {
  const [name, setName]   = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef()

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const submit = async () => {
    if (!name.trim()) { setError('Nom requis'); return }
    setLoading(true); setError(null)
    try {
      const { data } = await api.post('/dossier-types/', { name: name.trim(), color })
      onAdd(data)
      onClose()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? Object.values(d).flat().join(' ') : 'Erreur')
    } finally { setLoading(false) }
  }

  return (
    <motion.div ref={ref}
      initial={{ opacity:0, scale:0.92, y:6 }} animate={{ opacity:1, scale:1, y:0 }}
      transition={{ duration:0.14 }}
      style={{
        position:'absolute', top:'calc(100% + 8px)', left:0, zIndex:200,
        width:220, background:'var(--bg-raised)', border:'1px solid var(--border)',
        borderRadius:12, boxShadow:'var(--shadow-xl)', padding:'14px 14px 12px',
      }}>
      <div style={{ fontSize:12, fontWeight:600, color:'var(--text-primary)', marginBottom:10 }}>Nouveau type</div>
      <input className="input" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key==='Enter' && submit()}
        placeholder="Nom du nouveau type…" style={{ fontSize:12, marginBottom:10 }} autoFocus />
      <div style={{ display:'flex', gap:6, marginBottom:12 }}>
        {PRESET_COLORS.map(c => (
          <button key={c} onClick={() => setColor(c)} style={{
            width:20, height:20, borderRadius:'50%', background:c, border:'none', cursor:'pointer',
            outline: color===c ? `2px solid ${c}` : 'none',
            outlineOffset:2, transition:'outline 0.1s',
          }} />
        ))}
      </div>
      {error && <p style={{ color:'var(--red)', fontSize:11, margin:'0 0 8px' }}>{error}</p>}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onClose} className="btn-secondary" style={{ flex:1, fontSize:12, padding:'5px 0' }}>Annuler</button>
        <button onClick={submit} disabled={loading} style={{
          flex:1, fontSize:12, padding:'5px 0', borderRadius:8, border:'none', cursor:'pointer',
          background: hexToRgba(color, 0.85), color:'#fff', fontWeight:600,
        }}>{loading ? '…' : 'Ajouter'}</button>
      </div>
    </motion.div>
  )
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function Dossiers() {
  const { reload: reloadDossiersCtx } = useDossiers()   // keep context in sync for Comptes page
  const [dossiers, setDossiers]         = useState([])
  const [employes, setEmployes]         = useState([])
  const [customTypes, setCustomTypes]   = useState([])
  const [typeCounts, setTypeCounts]     = useState({})
  const [loading, setLoading]           = useState(true)
  const [showCreate, setShowCreate]     = useState(false)
  const [showAddType, setShowAddType]   = useState(false)
  const [detail, setDetail]             = useState(null)
  const [resume, setResume]             = useState(null)
  const [deleteDossier, setDeleteDossier] = useState(null)
  const [search, setSearch]             = useState('')
  const [filterType, setFilterType]     = useState('all')
  const [analyzingIds, setAnalyzingIds] = useState(new Set())
  const addTypeBtnRef                   = useRef()

  const typeConfig = buildTypeConfig(customTypes)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: d }, { data: e }, { data: ct }, { data: statsData }] = await Promise.all([
        api.get('/dossiers/'),
        api.get('/employes/'),
        api.get('/dossier-types/'),
        api.get('/stats/dossiers-par-type/'),
      ])
      setDossiers(d.results ?? d)
      setEmployes(e.results ?? e)
      setCustomTypes(ct.results ?? ct)
      const counts = {}
      ;(Array.isArray(statsData) ? statsData : []).forEach(r => { counts[r.type] = r.count })
      setTypeCounts(counts)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Seed analyzingIds from dossiers that have files but no resume_structure yet
  useEffect(() => {
    const ids = dossiers
      .filter(d => d.fichiers_count > 0 && !d.has_resume)
      .map(d => d.id)
    if (ids.length > 0) setAnalyzingIds(prev => new Set([...prev, ...ids]))
  }, [dossiers])

  // Poll resume-data for each analyzing dossier
  useEffect(() => {
    if (analyzingIds.size === 0) return
    const interval = setInterval(async () => {
      for (const id of analyzingIds) {
        try {
          const { data } = await api.get(`/dossiers/${id}/resume-data/`)
          if (data.status === 'done') {
            setAnalyzingIds(prev => { const next = new Set(prev); next.delete(id); return next })
            // Refresh this dossier's row with latest DB data
            api.get(`/dossiers/${id}/`).then(({ data: d }) =>
              setDossiers(prev => prev.map(x => x.id === d.id ? { ...x, ...d } : x))
            ).catch(() => {})
          }
        } catch {}
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [analyzingIds])

  const markAnalyzing = useCallback((id) => {
    setAnalyzingIds(prev => new Set([...prev, id]))
  }, [])

  const handleCustomTypeAdded = (ct) => {
    setCustomTypes(prev => [...prev, ct])
  }

  const handleCustomTypeDelete = async (ct) => {
    try {
      await api.delete(`/dossier-types/${ct.id}/`)
      setCustomTypes(prev => prev.filter(t => t.id !== ct.id))
      if (filterType === `custom_${ct.id}`) setFilterType('all')
    } catch {}
  }

  const filtered = dossiers.filter(d => {
    const matchSearch = !search || d.titre.toLowerCase().includes(search.toLowerCase())
    const matchType   = filterType === 'all' || d.type_dossier === filterType
    return matchSearch && matchType
  })

  const refreshCounts = useCallback(async () => {
    try {
      const { data: statsData } = await api.get('/stats/dossiers-par-type/')
      const counts = {}
      ;(Array.isArray(statsData) ? statsData : []).forEach(r => { counts[r.type] = r.count })
      setTypeCounts(counts)
    } catch {}
  }, [])

  const handleCreated = () => { load(); reloadDossiersCtx() }
  const handleDeleted = (id) => {
    setDossiers(prev => prev.filter(d => d.id !== id))
    refreshCounts()
    reloadDossiersCtx()
  }
  const handleUpdated = (updated) => setDossiers(prev => prev.map(d => d.id===updated.id ? {...d, ...updated} : d))

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Navbar title="Gestion des Dossiers" />

        <main style={{ flex:1, padding:'24px 28px', overflowY:'auto' }}>

          {/* Toolbar */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:22, flexWrap:'wrap' }}>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un dossier…" style={{ fontSize:13, width:220 }} />

            <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
              <FilterBtn label="Tous" active={filterType==='all'} onClick={() => setFilterType('all')} isDefault />
              {Object.entries(DEFAULT_TYPES).map(([k,v]) => (
                <FilterBtn key={k} label={v.label} active={filterType===k} color={v.color} bg={v.bg} onClick={() => setFilterType(k)} isDefault />
              ))}
              {customTypes.map(ct => {
                const key = `custom_${ct.id}`
                const cfg = typeConfig[key]
                return (
                  <FilterBtn key={key} label={ct.name} active={filterType===key}
                    color={cfg.color} bg={cfg.bg}
                    onClick={() => setFilterType(key)}
                    onDelete={() => handleCustomTypeDelete(ct)}
                  />
                )
              })}

              {/* "+" add type button */}
              <div style={{ position:'relative' }} ref={addTypeBtnRef}>
                <button onClick={() => setShowAddType(v => !v)} title="Ajouter un type" style={{
                  width:26, height:26, borderRadius:'50%', border:'1.5px dashed var(--border-mid)',
                  background:'transparent', color:'var(--text-tertiary)', cursor:'pointer',
                  fontSize:16, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-mid)'; e.currentTarget.style.color='var(--text-tertiary)' }}
                >+</button>
                <AnimatePresence>
                  {showAddType && (
                    <AddTypePopover
                      onAdd={handleCustomTypeAdded}
                      onClose={() => setShowAddType(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div style={{ marginLeft:'auto' }}>
              <button onClick={() => setShowCreate(true)} style={{
                padding:'8px 18px', borderRadius:9, border:'none', cursor:'pointer',
                background:'var(--accent)', color:'#000', fontSize:13, fontWeight:600,
                display:'flex', alignItems:'center', gap:7,
              }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0 }}>
                  <path d="M7 1.5 L7 12.5 M1.5 7 L12.5 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                Nouveau dossier
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:'flex', gap:12, marginBottom:22, flexWrap:'wrap' }}>
            {[
              { label:'Total', value: Object.values(typeCounts).reduce((s,v)=>s+v, 0) || dossiers.length, color:'var(--text-primary)' },
              ...Object.entries(typeConfig).map(([k,v]) => ({
                label: v.label,
                value: typeCounts[k] ?? 0,
                color: v.color,
              }))
            ].map(s => (
              <div key={s.label} style={{ padding:'10px 16px', background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:10, minWidth:80 }}>
                <div style={{ fontSize:20, fontWeight:700, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--text-tertiary)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}><Spinner size={32} /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:60, color:'var(--text-tertiary)' }}>
              <div style={{ marginBottom:14, display:'flex', justifyContent:'center' }}><FolderSVG size={52} /></div>
              <div style={{ fontSize:14 }}>{search || filterType!=='all' ? 'Aucun résultat' : 'Aucun dossier — créez le premier'}</div>
            </div>
          ) : (
            <div style={{
              border:'1px solid var(--border)', borderRadius:10, overflow:'hidden',
              background:'#fff',
            }}>
              <AnimatePresence>
                {filtered.map((d, i) => (
                  <DossierCard key={d.id} dossier={d} typeConfig={typeConfig} index={i}
                    onVoir={setDetail} onResumer={setResume} onSupprimer={setDeleteDossier}
                    isAnalyzing={analyzingIds.has(d.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal employes={employes} typeConfig={typeConfig}
            onClose={() => setShowCreate(false)} onCreated={handleCreated}
            onAnalysisStarted={markAnalyzing} />
        )}
        {detail && (
          <DetailView dossier={detail} employes={employes} typeConfig={typeConfig}
            onClose={() => setDetail(null)} onUpdated={handleUpdated}
            onAnalysisStarted={markAnalyzing} />
        )}
        {resume && (
          <ResumeModal dossier={resume} onClose={() => setResume(null)} />
        )}
        {deleteDossier && (
          <DeleteConfirm dossier={deleteDossier} onClose={() => setDeleteDossier(null)} onDeleted={handleDeleted} />
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function FilterBtn({ label, active, color, bg, onClick, onDelete, isDefault = false }) {
  const [hovered, setHovered] = useState(false)
  const canDelete = !isDefault && typeof onDelete === 'function'
  return (
    <div style={{ position:'relative', display:'inline-flex' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onClick} style={{
        padding: canDelete ? '5px 26px 5px 12px' : '5px 12px',
        borderRadius:99, fontSize:12, fontWeight:500, cursor:'pointer',
        border: active ? `1.5px solid ${color || 'var(--accent)'}` : '1.5px solid var(--border)',
        background: active ? (bg || 'var(--accent-soft)') : 'transparent',
        color: active ? (color || 'var(--accent)') : 'var(--text-tertiary)',
        transition:'all 0.15s',
      }}>{label}</button>
      {canDelete && hovered && (
        <button onClick={e => { e.stopPropagation(); onDelete() }} style={{
          position:'absolute', right:6, top:'50%', transform:'translateY(-50%)',
          width:14, height:14, borderRadius:'50%', border:'none', cursor:'pointer',
          background:'rgba(239,68,68,0.2)', color:'#EF4444',
          fontSize:10, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:700, padding:0,
        }}>×</button>
      )}
    </div>
  )
}
