import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'txt', 'zip']
const MAX_FILE_SIZE_MB = 50

function CircularProgress({ pct }) {
  const r = 22
  const circ = 2 * Math.PI * r
  return (
    <svg width="60" height="60" viewBox="0 0 60 60">
      <circle cx="30" cy="30" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
      <circle
        cx="30" cy="30" r={r}
        fill="none"
        stroke="#00D4FF"
        strokeWidth="4"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${circ * (1 - pct / 100)}`}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.3s ease' }}
      />
      <text x="30" y="34" textAnchor="middle" fill="#00D4FF" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
        {pct}%
      </text>
    </svg>
  )
}

export default function FileUpload({ onUpload, uploading = false, progress = 0, accept, label, multiple = false }) {
  const [error, setError] = useState(null)

  const onDrop = useCallback((accepted, rejected) => {
    setError(null)
    if (rejected.length > 0) {
      const msg = rejected[0].errors[0]?.message ?? 'Fichier non accepté'
      setError(msg)
      return
    }
    if (accepted.length === 0) return

    // Client-side size check
    const tooBig = accepted.find(f => f.size > MAX_FILE_SIZE_MB * 1024 * 1024)
    if (tooBig) {
      setError(`"${tooBig.name}" dépasse ${MAX_FILE_SIZE_MB} MB.`)
      return
    }
    onUpload?.(multiple ? accepted : accepted[0])
  }, [onUpload, multiple])

  const allowedMime = (accept ?? ALLOWED_EXTENSIONS).reduce((acc, ext) => {
    const mime = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      txt: 'text/plain',
      zip: 'application/zip',
    }
    if (mime[ext]) acc[mime[ext]] = [`\\.${ext}`]
    return acc
  }, {})

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, multiple,
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
  })

  return (
    <div id="file-upload-zone">
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? '#00D4FF' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 16,
          padding: '2rem',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'rgba(0,212,255,0.05)' : 'rgba(255,255,255,0.02)',
          transition: 'all 0.25s ease',
          boxShadow: isDragActive ? '0 0 20px rgba(0,212,255,0.12)' : 'none',
        }}
      >
        <input {...getInputProps()} />
        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <CircularProgress pct={progress} />
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' }}>
                Envoi en cours...
              </p>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: 36 }}>{isDragActive ? '📂' : '📁'}</div>
              <p style={{ margin: 0, color: isDragActive ? '#00D4FF' : 'rgba(255,255,255,0.55)', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
                {label ?? (isDragActive ? 'Déposez ici...' : 'Glissez un fichier ici ou cliquez pour parcourir')}
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.25)', fontSize: '0.75rem', fontFamily: 'Inter, sans-serif' }}>
                PDF • DOCX • XLSX • PNG • JPG • TXT • ZIP (max {MAX_FILE_SIZE_MB} MB)
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              margin: '0.5rem 0 0',
              color: '#EF4444',
              fontSize: '0.8rem',
              fontFamily: 'Inter, sans-serif',
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 8,
              padding: '6px 12px',
            }}
          >
            ⚠️ {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
