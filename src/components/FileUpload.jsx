import React, { useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'txt', 'zip']
const MAX_FILE_SIZE_MB   = 50

const EXT_COLORS = {
  pdf:  { color: '#F87171', bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.20)'  },
  docx: { color: '#93C5FD', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.20)' },
  doc:  { color: '#93C5FD', bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.20)' },
  xlsx: { color: '#6EE7B7', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.20)' },
  xls:  { color: '#6EE7B7', bg: 'rgba(16,185,129,0.10)',  border: 'rgba(16,185,129,0.20)' },
  png:  { color: '#C4B5FD', bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.20)' },
  jpg:  { color: '#C4B5FD', bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.20)' },
  jpeg: { color: '#C4B5FD', bg: 'rgba(139,92,246,0.10)',  border: 'rgba(139,92,246,0.20)' },
  txt:  { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.20)' },
  zip:  { color: '#FCD34D', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.20)' },
  _:    { color: '#818CF8', bg: 'rgba(99,102,241,0.10)',  border: 'rgba(99,102,241,0.20)' },
}

function getExt(name = '') { return (name.split('.').pop() || '').toLowerCase() }
function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileChip({ name, onRemove }) {
  const ext = getExt(name)
  const c   = EXT_COLORS[ext] || EXT_COLORS._
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -6 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '5px 10px 5px 8px',
        background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8,
        fontSize: 12, fontWeight: 500,
      }}
    >
      <span style={{
        background: c.color + '20', color: c.color, border: `1px solid ${c.color}30`,
        borderRadius: 4, padding: '0 5px', fontSize: 9, fontWeight: 800, letterSpacing: '0.05em',
      }}>
        {ext.toUpperCase()}
      </span>
      <span style={{ color: '#F0F4FF', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      {onRemove && (
        <button onClick={onRemove} style={{
          width: 16, height: 16, borderRadius: '50%',
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#F87171', flexShrink: 0, fontSize: 10,
          transition: 'all 0.12s', padding: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >✕</button>
      )}
    </motion.div>
  )
}

function CircularProgress({ pct }) {
  const r = 22, circ = 2 * Math.PI * r
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
      <circle cx="30" cy="30" r={r} fill="none" stroke="var(--accent)" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.3s ease' }}
      />
      <text x="30" y="34" textAnchor="middle" fill="var(--accentB,#818CF8)" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

export default function FileUpload({ onUpload, uploading = false, progress = 0, accept, label = 'Déposer un fichier', multiple = false }) {
  const [dragging, setDragging]   = useState(false)
  const [error, setError]         = useState(null)
  const [queued, setQueued]       = useState([])
  const inputRef                  = useRef(null)
  const dragCount                 = useRef(0)

  const validateFiles = (files) => {
    const allowed = accept ?? ALLOWED_EXTENSIONS
    for (const f of files) {
      const ext = getExt(f.name)
      if (!allowed.includes(ext)) {
        return `Extension ".${ext}" non autorisée. Formats acceptés: ${allowed.join(', ')}`
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return `"${f.name}" dépasse ${MAX_FILE_SIZE_MB} MB`
      }
    }
    return null
  }

  const handleFiles = useCallback((files) => {
    setError(null)
    if (!files?.length) return
    const fileArr = Array.from(files)
    const err = validateFiles(fileArr)
    if (err) { setError(err); return }
    if (multiple) {
      setQueued(prev => [...prev, ...fileArr])
      onUpload?.(fileArr)
    } else {
      setQueued([fileArr[0]])
      onUpload?.(fileArr[0])
    }
  }, [onUpload, multiple, accept])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false); dragCount.current = 0
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const onDragOver  = (e) => { e.preventDefault() }
  const onDragEnter = (e) => { e.preventDefault(); dragCount.current++; setDragging(true) }
  const onDragLeave = (e) => { dragCount.current--; if (dragCount.current <= 0) { setDragging(false); dragCount.current = 0 } }

  const onInputChange = (e) => handleFiles(e.target.files)
  const removeQueued  = (i) => setQueued(prev => prev.filter((_, idx) => idx !== i))

  const accentBorder = dragging ? 'rgba(99,102,241,0.5)' : uploading ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.09)'
  const zoneBg       = dragging ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.02)'

  return (
    <div style={{ width: '100%' }}>
      {/* Drop zone */}
      <div
        onDrop={onDrop} onDragOver={onDragOver}
        onDragEnter={onDragEnter} onDragLeave={onDragLeave}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          width: '100%', minHeight: 120,
          border: `2px dashed ${accentBorder}`,
          borderRadius: 14, background: zoneBg,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 10, cursor: uploading ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative', overflow: 'hidden',
          padding: '24px 20px',
        }}
      >
        {/* Animated corner accents when dragging */}
        {dragging && (
          <>
            <div style={{ position: 'absolute', top: 0,    left: 0,    width: 24, height: 24, borderTop: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)', borderRadius: '14px 0 0 0' }} />
            <div style={{ position: 'absolute', top: 0,    right: 0,   width: 24, height: 24, borderTop: '2px solid var(--accent)', borderRight: '2px solid var(--accent)', borderRadius: '0 14px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0,    width: 24, height: 24, borderBottom: '2px solid var(--accent)', borderLeft: '2px solid var(--accent)', borderRadius: '0 0 0 14px' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0,   width: 24, height: 24, borderBottom: '2px solid var(--accent)', borderRight: '2px solid var(--accent)', borderRadius: '0 0 14px 0' }} />
          </>
        )}

        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="uploading" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <CircularProgress pct={progress} />
              <span style={{ fontSize: 12, color: 'var(--accent-bright,#818CF8)', fontWeight: 500 }}>Téléversement en cours…</span>
            </motion.div>
          ) : dragging ? (
            <motion.div key="drag" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 28 }}>📥</div>
              <span style={{ fontSize: 13, color: 'var(--accent-bright,#818CF8)', fontWeight: 600 }}>Relâchez pour déposer</span>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>📎</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'rgba(139,150,176,0.7)' }}>
                  Glissez ici ou <span style={{ color: 'var(--accent-bright,#818CF8)', fontWeight: 600 }}>cliquez</span> pour sélectionner
                </div>
                <div style={{ fontSize: 10, color: 'rgba(74,85,104,0.8)', marginTop: 4 }}>
                  {(accept ?? ALLOWED_EXTENSIONS).join(', ').toUpperCase()} · max {MAX_FILE_SIZE_MB} MB
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <input ref={inputRef} type="file" multiple={multiple}
          accept={(accept ?? ALLOWED_EXTENSIONS).map(e => `.${e}`).join(',')}
          onChange={onInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* Queued files */}
      <AnimatePresence>
        {queued.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {queued.map((f, i) => (
              <FileChip key={`${f.name}-${i}`} name={f.name} onRemove={!uploading ? () => removeQueued(i) : null} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#F87171', fontSize: 12, display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#F87171', cursor: 'pointer', fontSize: 13, padding: 0 }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
