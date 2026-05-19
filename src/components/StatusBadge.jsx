const CONFIGS = {
  en_attente: { label: 'En attente', cls: 'badge-amber', dot: 'var(--amber)', pulse: true  },
  approuve:   { label: 'Approuvé',   cls: 'badge-green', dot: 'var(--green)', pulse: false },
  rejete:     { label: 'Rejeté',     cls: 'badge-red',   dot: 'var(--red)',   pulse: false },
}

export default function StatusBadge({ status, pulse = false }) {
  const cfg = CONFIGS[status] ?? { label: status, cls: 'badge-gray', dot: 'var(--text-tertiary)', pulse: false }
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className="badge-dot" style={{
        background: cfg.dot,
        animation: pulse && cfg.pulse ? 'notif-pulse 2s infinite' : 'none',
        boxShadow: `0 0 4px ${cfg.dot}80`,
      }} />
      {cfg.label}
    </span>
  )
}
