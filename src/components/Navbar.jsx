import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import SFIcon from './SFIcon'

export default function Navbar({ title = 'IDMS' }) {
  const { user, isAdmin }                                              = useAuth()
  const { unreadCount, notifications, markAsRead, markAllAsRead }      = useNotifications()
  const navigate                                                        = useNavigate()
  const [notifOpen, setNotifOpen]                                       = useState(false)
  const notifRef                                                        = useRef(null)

  useEffect(() => {
    const fn = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const recent    = notifications.slice(0, 6)
  const notifPath = isAdmin ? '/admin/notifications' : '/employe/notifications'
  const typeColor = { info:'var(--accent)', success:'var(--green)', warning:'var(--amber)', error:'var(--red)' }

  const displayInitial = (user?.profile?.prenom?.[0] || user?.username?.[0] || '?').toUpperCase()
  const displayName    = user?.profile?.prenom
    ? `${user.profile.prenom} ${user.profile.nom}`
    : user?.username ?? '—'

  return (
    <header style={{
      height:54, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 22px',
      background:'rgba(8,12,20,0.88)',
      backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
      borderBottom:'1px solid rgba(255,255,255,0.05)',
      position:'sticky', top:0, zIndex:200,
    }}>
      {/* Title */}
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <span style={{fontFamily:'var(--font-display)', fontSize:15, fontWeight:600, letterSpacing:'-0.03em', color:'var(--text-primary)'}}>
          {title}
        </span>
        <div style={{width:4, height:4, borderRadius:'50%', background:'var(--accent)', opacity:0.5}} />
      </div>

      {/* Right */}
      <div style={{display:'flex', alignItems:'center', gap:6}}>

        {/* Notification bell */}
        <div ref={notifRef} style={{position:'relative'}}>
          <button onClick={() => setNotifOpen(v => !v)} style={{
            position:'relative', width:34, height:34, borderRadius:10,
            border:`1px solid ${notifOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
            background: notifOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', color: notifOpen ? 'var(--text-primary)' : 'var(--text-secondary)',
            transition:'all 0.12s',
          }}
            onMouseEnter={e => { if(!notifOpen){e.currentTarget.style.background='rgba(255,255,255,0.07)';e.currentTarget.style.color='var(--text-primary)'}}}
            onMouseLeave={e => { if(!notifOpen){e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='var(--text-secondary)'}}}
          >
            <SFIcon name="bell" size={15} />
            {unreadCount > 0 && (
              <span style={{
                position:'absolute', top:-3, right:-3,
                minWidth:15, height:15, borderRadius:99,
                background:'var(--red)', color:'white',
                fontSize:8, fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
                padding:'0 3px', border:'2px solid var(--bg-base)',
                boxShadow:'0 0 8px rgba(239,68,68,0.5)',
              }} className="notif-pulse">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{opacity:0, y:8, scale:0.96}}
                animate={{opacity:1, y:0, scale:1}}
                exit={{opacity:0, y:8, scale:0.96}}
                transition={{duration:0.17, ease:[0.16,1,0.3,1]}}
                style={{
                  position:'absolute', top:'calc(100% + 10px)', right:0,
                  width:310, background:'var(--bg-elevated)',
                  border:'1px solid rgba(255,255,255,0.10)', borderRadius:16,
                  boxShadow:'0 16px 48px rgba(0,0,0,0.6)', overflow:'hidden', zIndex:300,
                }}
              >
                {/* Header */}
                <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px 11px', borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                  <div>
                    <div style={{fontSize:13, fontWeight:600, color:'var(--text-primary)', fontFamily:'var(--font-display)'}}>Notifications</div>
                    {unreadCount > 0 && <div style={{fontSize:11, color:'var(--text-tertiary)', marginTop:1}}>{unreadCount} non lue{unreadCount>1?'s':''}</div>}
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} style={{fontSize:11, color:'var(--accent-bright)', background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:'3px 8px', borderRadius:6, transition:'background 0.1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,0.10)'}
                      onMouseLeave={e=>e.currentTarget.style.background='none'}
                    >Tout lire</button>
                  )}
                </div>

                {/* Items */}
                <div style={{maxHeight:270, overflowY:'auto'}}>
                  {recent.length === 0 ? (
                    <div style={{padding:'28px 16px', textAlign:'center', color:'var(--text-tertiary)', fontSize:13}}>
                      <SFIcon name="bell" size={22} color="var(--text-tertiary)" style={{margin:'0 auto 8px'}} />
                      <div>Aucune notification</div>
                    </div>
                  ) : recent.map((n, i) => (
                    <div key={n.id}
                      onClick={() => { markAsRead(n.id); setNotifOpen(false); navigate(notifPath) }}
                      style={{
                        display:'flex', gap:11, padding:'11px 16px',
                        cursor:'pointer',
                        background: !n.is_read ? 'rgba(99,102,241,0.05)' : 'transparent',
                        borderBottom: i < recent.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        transition:'background 0.1s',
                      }}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                      onMouseLeave={e=>e.currentTarget.style.background=!n.is_read?'rgba(99,102,241,0.05)':'transparent'}
                    >
                      <div style={{width:7, height:7, borderRadius:'50%', background: typeColor[n.type]||'var(--accent)', flexShrink:0, marginTop:4, boxShadow:`0 0 6px ${typeColor[n.type]||'var(--accent)'}80`}} />
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:12, color:'var(--text-primary)', fontWeight: n.is_read ? 400 : 600, lineHeight:1.4}}>
                          {n.message || n.title}
                        </div>
                        <div style={{fontSize:11, color:'var(--text-tertiary)', marginTop:3}}>
                          {new Date(n.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div style={{borderTop:'1px solid rgba(255,255,255,0.06)', padding:'9px 16px'}}>
                  <button onClick={() => { setNotifOpen(false); navigate(notifPath) }}
                    style={{width:'100%', padding:'8px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'var(--text-secondary)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.1s', display:'flex', alignItems:'center', justifyContent:'center', gap:6}}
                    onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-primary)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='var(--text-secondary)'}}
                  >
                    Voir toutes <SFIcon name="arrowRight" size={12} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User avatar */}
        <div title={displayName} style={{
          width:32, height:32, borderRadius:9, cursor:'default',
          background:'linear-gradient(135deg,rgba(99,102,241,0.4),rgba(20,184,166,0.4))',
          border:'1px solid rgba(99,102,241,0.25)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:11, fontWeight:700, color:'var(--accent-bright)',
          fontFamily:'var(--font-display)',
        }}>
          {displayInitial}
        </div>
      </div>
    </header>
  )
}
