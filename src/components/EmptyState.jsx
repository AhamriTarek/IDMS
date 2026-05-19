import React from 'react'
import { motion } from 'framer-motion'

export default function EmptyState({ icon = '📭', title = 'Aucun élément', description = '', action, actionLabel = 'Commencer' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 24px', textAlign: 'center' }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 18,
        boxShadow: '0 0 40px rgba(99,102,241,0.08)',
      }}>
        {icon}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>
        {title}
      </div>
      {description && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 320, lineHeight: 1.6, margin: '0 0 20px' }}>
          {description}
        </p>
      )}
      {action && (
        <button onClick={action} className="btn-primary" style={{ fontSize: 13, marginTop: 4 }}>
          {actionLabel}
        </button>
      )}
    </motion.div>
  )
}
