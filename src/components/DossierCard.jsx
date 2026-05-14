import React, { useState } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { getFileTypeToken } from '../design-tokens'

// ── AI badge with pulsing glow ─────────────────────────────────────────────
function AIBadge() {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: 'rgba(0,212,255,0.08)',
      border: '1px solid rgba(0,212,255,0.3)',
      borderRadius: 20,
      padding: '2px 8px',
      fontSize: '0.65rem', fontWeight: 700,
      color: '#00D4FF',
      letterSpacing: '0.04em',
      animation: 'ai-pulse 2.5s ease-in-out infinite',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: '#00D4FF',
        animation: 'dot-pulse 2.5s ease-in-out infinite',
        flexShrink: 0,
      }} />
      IA
      <style>{`
        @keyframes ai-pulse {
          0%, 100% { box-shadow: 0 0 0 rgba(0,212,255,0); }
          50% { box-shadow: 0 0 8px rgba(0,212,255,0.3); }
        }
        @keyframes dot-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </span>
  )
}

// ── File type chip ──────────────────────────────────────────────────────────
function FileChip({ ext }) {
  const token = getFileTypeToken(ext)
  return (
    <span style={{
      background: token.bg,
      color: token.color,
      border: `1px solid ${token.color}44`,
      borderRadius: 6,
      padding: '1px 7px',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
    }}>
      {token.label}
    </span>
  )
}

// ── Main DossierCard ────────────────────────────────────────────────────────
export default function DossierCard({ dossier, onClick }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotateX = useSpring(useTransform(y, [-80, 80], [8, -8]), { stiffness: 200, damping: 20 })
  const rotateY = useSpring(useTransform(x, [-80, 80], [-8, 8]), { stiffness: 200, damping: 20 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    x.set(e.clientX - rect.left - rect.width / 2)
    y.set(e.clientY - rect.top - rect.height / 2)
  }
  const handleMouseLeave = () => {
    x.set(0); y.set(0)
  }

  const statusColors = {
    en_cours: { color: '#F59E0B', label: 'En cours' },
    termine:  { color: '#10B981', label: 'Terminé'  },
    archive:  { color: '#6B7280', label: 'Archivé'  },
  }
  const sc = statusColors[dossier.status] ?? statusColors.en_cours

  // Gather unique file extensions
  const exts = [...new Set((dossier.fichiers ?? []).map(f => f.nom?.split('.').pop()?.toLowerCase() ?? ''))]

  return (
    <motion.div
      id={`dossier-card-${dossier.id}`}
      style={{
        rotateX, rotateY,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div
        onClick={() => onClick?.(dossier)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '1.25rem',
          cursor: 'pointer',
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(0,212,255,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: sc.color,
              boxShadow: `0 0 6px ${sc.color}88`,
              flexShrink: 0, marginTop: 2,
              display: 'inline-block',
            }} />
            <span style={{ fontSize: '0.7rem', color: sc.color, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              {sc.label}
            </span>
          </div>
          {dossier.carte_ia && <AIBadge />}
        </div>

        {/* Title */}
        <h3 style={{
          margin: '0 0 0.4rem',
          fontSize: '1rem',
          fontWeight: 700,
          fontFamily: '"Space Grotesk", sans-serif',
          color: '#fff',
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {dossier.titre}
        </h3>

        {/* Description */}
        {dossier.description && (
          <p style={{
            margin: '0 0 0.875rem',
            fontSize: '0.82rem',
            color: 'rgba(255,255,255,0.45)',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {dossier.description}
          </p>
        )}

        {/* File type chips */}
        {exts.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.875rem' }}>
            {exts.slice(0, 4).map(ext => <FileChip key={ext} ext={ext} />)}
            {exts.length > 4 && (
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', alignSelf: 'center' }}>
                +{exts.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
            {dossier.fichiers?.length ?? 0} fichier{(dossier.fichiers?.length ?? 0) !== 1 ? 's' : ''}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
            {dossier.created_at ? new Date(dossier.created_at).toLocaleDateString('fr-FR') : ''}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
