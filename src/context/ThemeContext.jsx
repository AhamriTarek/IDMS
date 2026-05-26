import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext({ dark: false, toggle: () => {} })

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    try {
      const stored = localStorage.getItem('idms-theme')
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch { return false }
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('theme-transitioning')
    root.classList.toggle('dark', dark)
    localStorage.setItem('idms-theme', dark ? 'dark' : 'light')
    const t = setTimeout(() => root.classList.remove('theme-transitioning'), 400)
    return () => clearTimeout(t)
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
