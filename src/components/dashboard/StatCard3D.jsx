import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function Skel({ h = 20, w = '100%', r = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r,
      background: 'var(--bg-sunken)',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  )
}

function TrendChip({ pct, dir }) {
  if (pct == null) return null
  const up = dir === 'up'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99,
      background: up ? 'var(--green-soft)' : 'var(--red-soft)',
      color: up ? '#1A7F3C' : '#C0392B',
    }}>
      {up ? '↑' : '↓'} {pct}%
    </span>
  )
}

export default function StatCard3D({ icon, label, sub, stat, color, delay = 0, to }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)

  const val = stat?.value
  const displayVal = typeof val === 'number' ? val.toLocaleString('fr-FR') : val

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={() => navigate(to)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '24px 26px',
        borderRadius: 'var(--r-xl)',
        cursor: 'pointer',
        background: 'var(--bg-raised)',
        border: `1px solid ${hovered ? color + '45' : 'var(--border)'}`,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.10), 0 6px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)`
          : `0 2px 8px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)`,
        transform: hovered
          ? 'perspective(1000px) rotateY(-2deg) rotateX(1deg) translateY(-4px)'
          : 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateY(0)',
        transition: 'transform 0.22s cubic-bezier(0.22,1,0.36,1), box-shadow 0.22s ease, border-color 0.22s ease',
        userSelect: 'none',
      }}
    >
      {/* Top inner highlight */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Corner radial orb */}
      <div style={{
        position: 'absolute', top: -24, right: -24,
        width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}14 0%, transparent 70%)`,
        pointerEvents: 'none',
        opacity: hovered ? 1 : 0.65,
        transition: 'opacity 0.22s ease',
      }} />

      {/* Icon + Trend */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{
          width: 46, height: 46, borderRadius: 14, flexShrink: 0,
          background: `${color}14`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.85), 0 2px 10px ${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color,
          transition: 'transform 0.22s ease, box-shadow 0.22s ease',
          transform: hovered ? 'translateY(-2px) scale(1.05)' : 'none',
        }}>
          {icon}
        </div>
        <TrendChip pct={stat?.pct} dir={stat?.dir} />
      </div>

      {/* Value + meta */}
      <div style={{ position: 'relative' }}>
        <div style={{
          fontSize: 38, fontWeight: 700, letterSpacing: '-0.05em', lineHeight: 1,
          background: `linear-gradient(140deg, var(--text-primary) 20%, ${color} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          {stat ? displayVal : <Skel h={38} w={80} />}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 8 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 3 }}>{sub}</div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </motion.div>
  )
}
