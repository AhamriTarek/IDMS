import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { getFileTypeToken } from '../design-tokens'

function AIBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(99,102,241,0.10)', border: '1px solid rgba(99,102,241,0.22)',
      borderRadius: 99, padding: '2px 8px',
      fontSize: '10px', fontWeight: 700, color: 'var(--accent-bright)',
      letterSpacing: '0.06em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', animation: 'notif-pulse 2.5s infinite', flexShrink: 0 }} />
      IA
    </span>
  )
}

function FileChip({ ext }) {
  const t = getFileTypeToken(ext)
  const colorMap = {
    '#EF4444': { bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.20)', color: '#F87171' },
    '#3B82F6': { bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.20)', color: '#93C5FD' },
    '#10B981': { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.20)', color: '#6EE7B7' },
    '#F59E0B': { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.20)', color: '#FCD34D' },
    '#8B5CF6': { bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.20)', color: '#C4B5FD' },
    '#6B7280': { bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.20)', color: '#9CA3AF' },
    '#00D4FF': { bg: 'rgba(0,212,255,0.10)',   border: 'rgba(0,212,255,0.20)',   color: '#67E8F9' },
  }
  const s = colorMap[t.color] || colorMap['#00D4FF']
  return (
    <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, borderRadius: 6, padding: '1px 7px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
      {t.label}
    </span>
  )
}

const TYPE_ICONS = {
  enterprise: { icon: '🏢', color: '#818CF8' },
  bills:      { icon: '📄', color: '#FBBF24' },
  hr:         { icon: '👤', color: '#34D399' },
  reports:    { icon: '📊', color: '#F87171' },
}

export default function DossierCard({ dossier, onClick }) {
  const [hovered, setHovered] = useState(false)
  const t = TYPE_ICONS[dossier.type] || { icon: '📁', color: 'var(--accent-bright)' }
  const fileCount = dossier.fichiers?.length ?? 0

  const statusCfg = {
    en_attente: { label: 'En attente', cls: 'badge-amber' },
    approuve:   { label: 'Approuvé',   cls: 'badge-green' },
    rejete:     { label: 'Rejeté',     cls: 'badge-red'   },
  }
  const sc = statusCfg[dossier.status] || { label: dossier.status, cls: 'badge-gray' }
  const dotColors = { 'badge-amber': 'var(--amber)', 'badge-green': 'var(--green)', 'badge-red': 'var(--red)', 'badge-gray': 'var(--text-tertiary)' }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(17,24,39,0.95)' : 'var(--bg-elevated)',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16,
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent line */}
      {hovered && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${t.color}60, transparent)`, borderRadius: '16px 16px 0 0' }} />
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: `${t.color}15`,
          border: `1px solid ${t.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, transition: 'transform 0.2s ease',
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
        }}>
          {t.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
            letterSpacing: '-0.01em', lineHeight: 1.3, marginBottom: 4,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {dossier.titre || dossier.title || 'Dossier sans titre'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
            #{dossier.id} · {new Date(dossier.created_at || dossier.date_creation).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>

        <span className={`badge ${sc.cls}`} style={{ flexShrink: 0 }}>
          <span className="badge-dot" style={{ background: dotColors[sc.cls] }} />
          {sc.label}
        </span>
      </div>

      {/* Description */}
      {dossier.description && (
        <p style={{
          fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55,
          marginBottom: 14,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {dossier.description}
        </p>
      )}

      {/* AI summary */}
      {dossier.fichier_ai_resume && (
        <div style={{ marginBottom: 14, padding: '10px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <AIBadge />
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.06em' }}>RÉSUMÉ IA</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {dossier.fichier_ai_resume}
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {dossier.type && (
          <span style={{ fontSize: 11, color: t.color, background: `${t.color}12`, border: `1px solid ${t.color}22`, borderRadius: 6, padding: '2px 8px', fontWeight: 600, letterSpacing: '0.04em' }}>
            {dossier.type_label || dossier.type}
          </span>
        )}
        {dossier.fichiers?.slice(0, 3).map((f, i) => {
          const ext = f.nom?.split('.').pop() || ''
          return <FileChip key={i} ext={ext} />
        })}
        {fileCount > 3 && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>+{fileCount - 3}</span>}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-tertiary)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{fileCount}</span>
        </div>
      </div>
    </motion.div>
  )
}
