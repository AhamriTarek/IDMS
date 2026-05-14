export default function EmptyState({ icon = '📂', title = 'Aucune donnée', description = '' }) {
  return (
    <div style={{ padding: '56px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 42, marginBottom: 14, lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{title}</div>
      {description && <div style={{ fontSize: 13, color: 'var(--text-tertiary)', maxWidth: 320, margin: '0 auto', lineHeight: 1.55 }}>{description}</div>}
    </div>
  )
}
