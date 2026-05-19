import SFIcon from './SFIcon'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const adminCommands = [
  { id: 'dash',   label: 'Vue d\'ensemble',       desc: 'Tableau de bord admin',    icon: '⊞', path: '/admin',               group: 'Navigation' },
  { id: 'dos',    label: 'Gestion des Dossiers',   desc: 'Tous les dossiers',         icon: '📁', path: '/admin/dossiers',      group: 'Navigation' },
  { id: 'cpt',    label: 'Comptes',                desc: 'Gestion des utilisateurs',  icon: '👥', path: '/admin/comptes',        group: 'Navigation' },
  { id: 'sub',    label: 'Soumissions',            desc: 'Réviser les soumissions',   icon: '📤', path: '/admin/soumissions',   group: 'Navigation' },
  { id: 'notif',  label: 'Notifications',          desc: 'Centre de notifications',   icon: '🔔', path: '/admin/notifications', group: 'Navigation' },
]
const employeCommands = [
  { id: 'edash',  label: 'Tableau de bord',        desc: 'Votre activité',            icon: '⊞', path: '/employe/dashboard',     group: 'Navigation' },
  { id: 'edos',   label: 'Mes Dossiers',           desc: 'Vos dossiers personnels',   icon: '📁', path: '/employe/dossiers',      group: 'Navigation' },
  { id: 'esub',   label: 'Soumissions',            desc: 'Vos soumissions',           icon: '📤', path: '/employe/soumissions',   group: 'Navigation' },
  { id: 'enotif', label: 'Notifications',          desc: 'Vos notifications',         icon: '🔔', path: '/employe/notifications', group: 'Navigation' },
]
const actions = [
  { id: 'theme', label: 'Changer le thème',        desc: 'Basculer clair / sombre',   icon: '🎨', action: 'toggle-theme',          group: 'Actions' },
  { id: 'ref',   label: 'Actualiser les données',  desc: 'Rafraîchir la page',        icon: '↻',  action: 'refresh',               group: 'Actions' },
  { id: 'help',  label: 'Aide & Raccourcis',       desc: 'Voir les raccourcis clavier',icon: '?', action: 'help',                  group: 'Actions' },
]

export default function CommandPalette({ onThemeToggle }) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const [cursor, setCursor]   = useState(0)
  const { isAdmin, logout }   = useAuth()
  const navigate              = useNavigate()
  const inputRef              = useRef(null)
  const listRef               = useRef(null)

  const navCmds = isAdmin ? adminCommands : employeCommands
  const allCmds = [...navCmds, ...actions]

  const filtered = query.trim()
    ? allCmds.filter(c =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.desc.toLowerCase().includes(query.toLowerCase())
      )
    : allCmds

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = []
    acc[cmd.group].push(cmd)
    return acc
  }, {})

  const flat = filtered

  const execute = useCallback((cmd) => {
    setOpen(false)
    setQuery('')
    if (cmd.path) { navigate(cmd.path); return }
    if (cmd.action === 'toggle-theme') { onThemeToggle?.(); return }
    if (cmd.action === 'refresh') { window.location.reload(); return }
  }, [navigate, onThemeToggle])

  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(v => !v)
        setQuery('')
        setCursor(0)
      }
      if (!open) return
      if (e.key === 'Escape')    { setOpen(false); setQuery('') }
      if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(v => Math.min(v + 1, flat.length - 1)) }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setCursor(v => Math.max(v - 1, 0)) }
      if (e.key === 'Enter')     { e.preventDefault(); if (flat[cursor]) execute(flat[cursor]) }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [open, cursor, flat, execute])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50) }, [open])
  useEffect(() => { setCursor(0) }, [query])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${cursor}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => { setOpen(false); setQuery('') }}
              style={{
                position: 'fixed', inset: 0, zIndex: 9000,
                background: 'rgba(4, 6, 12, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
            />

            {/* Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'fixed', top: '18%', left: '50%', transform: 'translateX(-50%)',
                width: '100%', maxWidth: 580, zIndex: 9001,
                background: '#0F1623',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 20,
                boxShadow: '0 32px 96px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
                overflow: 'hidden',
              }}
            >
              {/* Top accent */}
              <div style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.6), rgba(20,184,166,0.4), transparent)' }} />

              {/* Search bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <SFIcon name="search" size={16} color="rgba(139,150,176,0.7)" strokeWidth={1.8} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Rechercher une page, action…"
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#F0F4FF', fontSize: 15, fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                  }}
                />
                <kbd style={{
                  padding: '2px 7px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)',
                  fontSize: 11, color: 'rgba(139,150,176,0.8)', fontFamily: 'inherit',
                }}>ESC</kbd>
              </div>

              {/* Results */}
              <div ref={listRef} style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 0' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(139,150,176,0.5)', fontSize: 13 }}>
                    Aucun résultat pour "{query}"
                  </div>
                ) : (
                  Object.entries(grouped).map(([group, cmds]) => (
                    <div key={group}>
                      <div style={{ padding: '6px 20px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(74,85,104,0.9)' }}>
                        {group}
                      </div>
                      {cmds.map((cmd) => {
                        const idx = flat.indexOf(cmd)
                        const active = idx === cursor
                        return (
                          <div key={cmd.id} data-idx={idx}
                            onClick={() => execute(cmd)}
                            onMouseEnter={() => setCursor(idx)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 12,
                              padding: '10px 20px', cursor: 'pointer',
                              background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
                              borderLeft: active ? '2px solid rgba(99,102,241,0.6)' : '2px solid transparent',
                              transition: 'all 0.08s ease',
                            }}
                          >
                            <div style={{
                              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                              background: active ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.07)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 15, transition: 'all 0.08s ease',
                            }}>
                              {cmd.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500, color: active ? '#F0F4FF' : 'rgba(240,244,255,0.8)', transition: 'color 0.08s' }}>
                                {cmd.label}
                              </div>
                              <div style={{ fontSize: 11, color: 'rgba(139,150,176,0.6)', marginTop: 1 }}>
                                {cmd.desc}
                              </div>
                            </div>
                            {active && (
                              <kbd style={{ padding: '2px 7px', borderRadius: 5, background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 10, color: '#818CF8', fontFamily: 'inherit' }}>
                                ↵
                              </kbd>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '10px 20px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.015)',
              }}>
                {[['↑↓', 'Naviguer'], ['↵', 'Ouvrir'], ['ESC', 'Fermer']].map(([key, label]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <kbd style={{ padding: '2px 6px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', fontSize: 10, color: 'rgba(139,150,176,0.7)', fontFamily: 'inherit' }}>{key}</kbd>
                    <span style={{ fontSize: 11, color: 'rgba(74,85,104,0.8)' }}>{label}</span>
                  </div>
                ))}
                <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(74,85,104,0.7)' }}>
                  {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
