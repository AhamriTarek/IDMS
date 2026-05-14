const CONFIGS = {
  en_attente: { label: 'En attente', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  approuve:   { label: 'Approuvé',   bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  rejete:     { label: 'Rejeté',     bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
}

export default function StatusBadge({ status, pulse = false }) {
  const cfg = CONFIGS[status] ?? { label: status, bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 99,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0,
        animation: pulse && status === 'en_attente' ? 'sbPulse 1.8s ease-in-out infinite' : 'none',
      }} />
      {cfg.label}
      <style>{`@keyframes sbPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </span>
  )
}
