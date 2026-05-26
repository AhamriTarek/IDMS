import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const cardVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0  },
  hover:   { y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.12)' },
}

const badgeVariants = {
  visible: { scale: 1 },
  hover:   { scale: 1.06 },
}

export default function StatCard({ icon: Icon, label, sub, stat, gradient, iconShadowColor, delay = 0, to }) {
  const card = (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '20px 22px 22px',
        boxShadow: 'var(--shadow-sm)',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        cursor: to ? 'pointer' : 'default',
        textDecoration: 'none',
      }}
    >
      {/* Gradient icon badge — top-left */}
      <motion.div
        variants={badgeVariants}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: `0 4px 12px ${iconShadowColor ?? 'rgba(0,0,0,0.18)'}`,
        }}
      >
        {Icon && <Icon size={22} strokeWidth={2} color="#fff" />}
      </motion.div>

      {/* Number */}
      <div style={{
        marginTop: 16,
        fontSize: 36,
        fontWeight: 700,
        fontFamily: 'var(--font)',
        color: 'var(--text-primary)',
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}>
        {stat != null ? (typeof stat === 'object' ? (stat.value ?? '—') : stat) : '—'}
      </div>

      {/* Label */}
      <div style={{
        marginTop: 6,
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--text-primary)',
        lineHeight: 1.2,
      }}>
        {label}
      </div>

      {/* Subtitle */}
      <div style={{
        marginTop: 3,
        fontSize: 12,
        fontWeight: 400,
        color: 'var(--text-secondary)',
        lineHeight: 1.4,
      }}>
        {sub}
      </div>
    </motion.div>
  )

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
        {card}
      </Link>
    )
  }
  return card
}
