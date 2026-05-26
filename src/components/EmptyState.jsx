export default function EmptyState({ icon: Icon, title = 'Aucune donnée', description = '' }) {
  return (
    <div style={{ padding: '56px 24px', textAlign: 'center' }}>
      <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center', lineHeight: 1 }}>
        {typeof Icon === 'string'
          ? <span style={{ fontSize: 42 }}>{Icon}</span>
          : Icon
          ? <Icon size={40} color="var(--text-tertiary)" strokeWidth={1.5} />
          : null
        }
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 320, margin: '0 auto', lineHeight: 1.55 }}>{description}</div>}
    </div>
  )
}
