// ─── IDMS Design Tokens ──────────────────────────────────────────────────────

export const colors = {
  // Background layers
  navy: {
    DEFAULT: '#0A0F1E',
    800: '#0D1526',
    700: '#111827',
    600: '#1A2540',
  },
  // Neon accents
  cyan:   { neon: '#00D4FF', dim: 'rgba(0,212,255,0.15)', mid: 'rgba(0,212,255,0.35)' },
  purple: { deep: '#7C3AED', dim: 'rgba(124,58,237,0.15)', mid: 'rgba(124,58,237,0.35)' },
  // Semantic
  success: '#10B981',
  danger:  '#EF4444',
  warning: '#F59E0B',
  // Glassmorphism surface
  glass: {
    border:      'rgba(255,255,255,0.08)',
    borderHover: 'rgba(0,212,255,0.4)',
    surface:     'rgba(255,255,255,0.04)',
    surfaceHover:'rgba(255,255,255,0.08)',
  },
}

export const fonts = {
  title: '"Space Grotesk", sans-serif',
  body:  'Inter, sans-serif',
  sizes: {
    xs:  '0.75rem',
    sm:  '0.875rem',
    md:  '1rem',
    lg:  '1.125rem',
    xl:  '1.25rem',
    '2xl':'1.5rem',
    '3xl':'1.875rem',
    '4xl':'2.25rem',
    '5xl':'3rem',
    '6xl':'3.75rem',
  },
}

export const shadows = {
  neonCyan:   '0 0 20px rgba(0,212,255,0.45), 0 0 60px rgba(0,212,255,0.15)',
  neonPurple: '0 0 20px rgba(124,58,237,0.45), 0 0 60px rgba(124,58,237,0.15)',
  neonGreen:  '0 0 20px rgba(16,185,129,0.45), 0 0 60px rgba(16,185,129,0.15)',
  neonRed:    '0 0 20px rgba(239,68,68,0.45), 0 0 60px rgba(239,68,68,0.15)',
  glass:      '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
  card:       '0 16px 48px rgba(0,0,0,0.6)',
}

export const blur = {
  glass:  'blur(16px)',
  heavy:  'blur(32px)',
  subtle: 'blur(8px)',
}

export const transitions = {
  fast:    'all 0.15s ease',
  normal:  'all 0.25s ease',
  slow:    'all 0.4s ease',
  spring:  { type: 'spring', stiffness: 260, damping: 20 },
  smooth:  { type: 'spring', stiffness: 180, damping: 24 },
}

// Framer Motion variants ──────────────────────────────────────────────────────

export const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
}

export const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
}

export const slideInLeft = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export const slideInRight = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export const scaleIn = {
  hidden:  { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: transitions.spring },
}

export const pageTransition = {
  initial:  { opacity: 0, y: 16 },
  animate:  { opacity: 1, y: 0,  transition: { duration: 0.4, ease: 'easeOut' } },
  exit:     { opacity: 0, y: -16, transition: { duration: 0.25 } },
}

// File type colour map ────────────────────────────────────────────────────────

export const fileTypeColors = {
  pdf:  { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   label: 'PDF'  },
  doc:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  label: 'DOC'  },
  docx: { color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  label: 'DOCX' },
  xls:  { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  label: 'XLS'  },
  xlsx: { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  label: 'XLSX' },
  ppt:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  label: 'PPT'  },
  pptx: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  label: 'PPTX' },
  img:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',  label: 'IMG'  },
  txt:  { color: '#6B7280', bg: 'rgba(107,114,128,0.15)', label: 'TXT'  },
  default:{ color: '#00D4FF', bg: 'rgba(0,212,255,0.15)', label: 'FILE' },
}

export const getFileTypeToken = (ext = '') =>
  fileTypeColors[ext.toLowerCase()] ?? fileTypeColors.default
