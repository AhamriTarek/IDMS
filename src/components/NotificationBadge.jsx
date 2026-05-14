import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../context/NotificationContext'

export default function NotificationBadge({ onClick }) {
  const { unreadCount } = useNotifications()

  return (
    <button
      onClick={onClick}
      id="notification-badge-btn"
      style={{
        position: 'relative',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '50%',
        width: 40, height: 40,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(0,212,255,0.1)'
        e.currentTarget.style.border = '1px solid rgba(0,212,255,0.4)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'
      }}
    >
      {/* Bell icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>

      {/* Unread count badge */}
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{
              position: 'absolute',
              top: -4, right: -4,
              background: '#EF4444',
              color: '#fff',
              fontSize: '0.6rem',
              fontWeight: 700,
              borderRadius: '50%',
              width: 18, height: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 8px rgba(239,68,68,0.6)',
              animation: 'pulse-red 2s infinite',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 8px rgba(239,68,68,0.6); }
          50% { box-shadow: 0 0 16px rgba(239,68,68,0.9); }
        }
      `}</style>
    </button>
  )
}
