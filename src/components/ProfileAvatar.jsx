import React from 'react'

export default function ProfileAvatar({
  photoUrl,
  name      = '',
  size      = 40,
  fontSize,
  style     = {},
  onClick,
  ring      = true,
}) {
  const initials =
    (name || '')
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'

  const fs = fontSize ?? Math.max(10, Math.round(size * 0.38))

  const base = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: onClick ? 'pointer' : 'default',
    boxShadow: ring ? '0 0 0 2px var(--bg-raised)' : 'none',
    ...style,
  }

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name || 'avatar'}
        onClick={onClick}
        style={{ ...base, objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      onClick={onClick}
      style={{
        ...base,
        background: 'linear-gradient(135deg, var(--accent) 0%, #7c3aed 100%)',
        color: '#fff',
        fontSize: fs,
        fontWeight: 700,
        letterSpacing: '-0.01em',
      }}
    >
      {initials}
    </div>
  )
}
