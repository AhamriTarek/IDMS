import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)
export const useTheme = () => useContext(ThemeContext)

const DARK_VARS = {
  '--bg-base':        '#080C14',
  '--bg-surface':     '#0D1220',
  '--bg-elevated':    '#111827',
  '--glass-bg':       'rgba(255, 255, 255, 0.035)',
  '--glass-bg-hover': 'rgba(255, 255, 255, 0.055)',
  '--glass-border':   'rgba(255, 255, 255, 0.07)',
  '--glass-border-hover': 'rgba(255, 255, 255, 0.14)',
  '--text-primary':   '#F0F4FF',
  '--text-secondary': '#8B96B0',
  '--text-tertiary':  '#4A5568',
  '--border':         'rgba(255, 255, 255, 0.06)',
  '--border-mid':     'rgba(255, 255, 255, 0.10)',
  '--border-strong':  'rgba(255, 255, 255, 0.16)',
}

const LIGHT_VARS = {
  '--bg-base':        '#F5F6FA',
  '--bg-surface':     '#EDEEF4',
  '--bg-elevated':    '#FFFFFF',
  '--glass-bg':       'rgba(255, 255, 255, 0.70)',
  '--glass-bg-hover': 'rgba(255, 255, 255, 0.85)',
  '--glass-border':   'rgba(0, 0, 0, 0.08)',
  '--glass-border-hover': 'rgba(0, 0, 0, 0.16)',
  '--text-primary':   '#0F1623',
  '--text-secondary': '#5A6478',
  '--text-tertiary':  '#9BA3B4',
  '--border':         'rgba(0, 0, 0, 0.07)',
  '--border-mid':     'rgba(0, 0, 0, 0.12)',
  '--border-strong':  'rgba(0, 0, 0, 0.20)',
}

function applyTheme(isDark) {
  const vars = isDark ? DARK_VARS : LIGHT_VARS
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  root.setAttribute('data-theme', isDark ? 'dark' : 'light')
  document.body.style.background = vars['--bg-base']
}

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('idms-theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    applyTheme(isDark)
    localStorage.setItem('idms-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark(v => !v)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
