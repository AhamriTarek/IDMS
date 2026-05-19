import SFIcon from './SFIcon'
import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ACTIVITY_TYPES = {
  upload:   { icon: 'upload',       color: '#818CF8', label: 'Soumission'  },
  approve:  { icon: 'checkCircle',  color: '#34D399', label: 'Approuvé'   },
  reject:   { icon: 'x',            color: '#F87171', label: 'Rejeté'     },
  create:   { icon: 'folder',       color: '#14B8A6', label: 'Nouveau'    },
  comment:  { icon: 'info',         color: '#FBBF24', label: 'Commentaire'},
  login:    { icon: 'lock',         color: '#C084FC', label: 'Connexion'  },
}

function timeAgo(ts) {
  const diff = (Date.now() - ts) / 1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}j`
}

function ActivityItem({ item, isNew }) {
  const cfg = ACTIVITY_TYPES[item.type] || ACTIVITY_TYPES.create
  return (
    <motion.div
      initial={isNew ? { opacity: 0, x: -16, height: 0 } : false}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', position: 'relative' }}
    >
      {/* Timeline line */}
      <div style={{ position: 'absolute', left: 15, top: 36, bottom: -2, width: 1, background: 'rgba(255,255,255,0.04)' }} />

      {/* Icon bubble */}
      <div style={{
        width: 30, height: 30, borderRadius: 9, flexShrink: 0,
        background: `${cfg.color}14`,
        border: `1px solid ${cfg.color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
        boxShadow: isNew ? `0 0 12px ${cfg.color}30` : 'none',
        transition: 'box-shadow 2s ease',
      }}>
        {cfg.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.user}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(74,85,104,0.9)', flexShrink: 0 }}>
            {timeAgo(item.ts)}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(139,150,176,0.8)', lineHeight: 1.4 }}>
          {item.message}
        </div>
        {item.target && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
            padding: '2px 8px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            fontSize: 10, color: 'rgba(139,150,176,0.7)',
          }}>
            📄 {item.target}
          </div>
        )}
      </div>

      {isNew && (
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0, marginTop: 4, boxShadow: `0 0 6px ${cfg.color}` }} />
      )}
    </motion.div>
  )
}

const MOCK_ACTIVITIES = [
  { id: 1, type: 'approve',  user: 'Admin',       message: 'Dossier approuvé',       target: 'Contrat Q2 2026',           ts: Date.now() - 120000  },
  { id: 2, type: 'upload',   user: 'A. Sahmoudi',  message: 'Nouvelle soumission',    target: 'Rapport Mensuel Mai',       ts: Date.now() - 380000  },
  { id: 3, type: 'create',   user: 'Admin',        message: 'Nouveau dossier créé',   target: 'RH — Recrutement Juin',     ts: Date.now() - 720000  },
  { id: 4, type: 'reject',   user: 'Admin',        message: 'Dossier rejeté',         target: 'Facture Fournisseur Avr.',  ts: Date.now() - 1800000 },
  { id: 5, type: 'login',    user: 'M. Benali',    message: 'Connexion au système',   target: null,                        ts: Date.now() - 3600000 },
  { id: 6, type: 'upload',   user: 'S. El Fassi',  message: 'Fichier joint ajouté',   target: 'Bilan Trimestriel T1',      ts: Date.now() - 7200000 },
]

export default function ActivityFeed({ className = '' }) {
  const [items, setItems]     = useState(MOCK_ACTIVITIES)
  const [newIds, setNewIds]   = useState(new Set())
  const [paused, setPaused]   = useState(false)
  const timerRef              = useRef(null)

  const LIVE_EVENTS = [
    { type: 'upload',  users: ['K. Amrani', 'H. Ziani', 'N. Chakir'],  messages: ['Nouveau fichier soumis', 'Pièce jointe ajoutée', 'Document téléversé'], targets: ['Dossier RH Q3', 'Rapport Audit', 'Facture Juin', 'Contrat Annuel'] },
    { type: 'approve', users: ['Admin'],                                 messages: ['Dossier approuvé', 'Validation accordée'],                               targets: ['Rapport Trimestriel', 'Dossier RH', 'Contrat Partenaire'] },
    { type: 'create',  users: ['Admin', 'A. Sahmoudi'],                  messages: ['Nouveau dossier créé', 'Dossier initialisé'],                            targets: ['Projet Alpha', 'Audit Interne', 'Budget 2027'] },
  ]

  useEffect(() => {
    if (paused) return
    timerRef.current = setInterval(() => {
      const pool = LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)]
      const newItem = {
        id: Date.now(),
        type: pool.type,
        user: pool.users[Math.floor(Math.random() * pool.users.length)],
        message: pool.messages[Math.floor(Math.random() * pool.messages.length)],
        target: pool.targets[Math.floor(Math.random() * pool.targets.length)],
        ts: Date.now(),
      }
      setItems(prev => [newItem, ...prev.slice(0, 11)])
      setNewIds(prev => new Set([...prev, newItem.id]))
      setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(newItem.id); return n }), 4000)
    }, 6000)
    return () => clearInterval(timerRef.current)
  }, [paused])

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(74,85,104,0.9)' }}>
            Activité en direct
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 99,
            background: paused ? 'rgba(74,85,104,0.1)' : 'rgba(52,211,153,0.10)',
            border: `1px solid ${paused ? 'rgba(74,85,104,0.2)' : 'rgba(52,211,153,0.2)'}`,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: paused ? '#4A5568' : '#34D399', animation: paused ? 'none' : 'notif-pulse 2s infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: paused ? '#4A5568' : '#34D399', letterSpacing: '0.06em' }}>
              {paused ? 'EN PAUSE' : 'LIVE'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setPaused(v => !v)}
          style={{
            padding: '4px 10px', borderRadius: 7,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            color: 'rgba(139,150,176,0.8)', fontSize: 11, fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.12s ease', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#F0F4FF' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(139,150,176,0.8)' }}
        >
          {paused ? '▶ Reprendre' : '⏸ Pause'}
        </button>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 12px' }}>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <ActivityItem key={item.id} item={item} isNew={newIds.has(item.id)} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
