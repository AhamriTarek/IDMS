import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import SFIcon from './SFIcon'

const adminLinks = [
  { to: '/admin',               end: true,  label: 'Vue d\'ensemble', icon: 'grid'   },
  { to: '/admin/dossiers',      end: false, label: 'Dossiers',        icon: 'folder' },
  { to: '/admin/comptes',       end: false, label: 'Comptes',         icon: 'users'  },
  { to: '/admin/soumissions',   end: false, label: 'Soumissions',     icon: 'upload' },
  { to: '/admin/notifications', end: false, label: 'Notifications',   icon: 'bell',  notif: true },
]
const employeLinks = [
  { to: '/employe/dashboard',     end: true,  label: 'Tableau de bord', icon: 'grid'   },
  { to: '/employe/dossiers',      end: false, label: 'Mes Dossiers',    icon: 'folder' },
  { to: '/employe/soumissions',   end: false, label: 'Soumissions',     icon: 'upload' },
  { to: '/employe/notifications', end: false, label: 'Notifications',   icon: 'bell',  notif: true },
]

export default function Sidebar() {
  const { user, logout, isAdmin }  = useAuth()
  const { unreadCount }            = useNotifications()
  const navigate                   = useNavigate()
  const [collapsed, setCollapsed]  = useState(false)
  const links = isAdmin ? adminLinks : employeLinks

  const displayName = user?.profile?.prenom
    ? `${user.profile.prenom} ${user.profile.nom}`
    : user?.username ?? '—'
  const initials  = displayName.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
  const roleLabel = isAdmin ? 'Administrateur' : 'Employé'

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      style={{
        height: '100vh', position: 'sticky', top: 0, flexShrink: 0,
        background: 'linear-gradient(180deg, #0D1220 0%, #080C14 100%)',
        borderRight: '1px solid rgba(255,255,255,0.055)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 100,
      }}
    >
      {/* Ambient orb */}
      <div style={{ position:'absolute', top:-50, left:-40, width:180, height:180, background:'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', pointerEvents:'none' }} />

      {/* ── Logo ── */}
      <div style={{ height:56, display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '0 14px' : '0 14px 0 18px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0, position:'relative', zIndex:1 }}>
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div key="full" initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-8}} transition={{duration:0.15}}
              style={{display:'flex', alignItems:'center', gap:10}}>
              <div style={{ width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#6366F1,#818CF8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(99,102,241,0.4)', flexShrink:0 }}>
                <SFIcon name="doc" size={14} color="white" strokeWidth={2} />
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:700, fontFamily:'var(--font-display)', letterSpacing:'-0.03em', color:'var(--text-primary)', lineHeight:1}}>IDMS</div>
                <div style={{fontSize:8, color:'var(--text-tertiary)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, marginTop:1}}>Platform</div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="mini" initial={{opacity:0,scale:0.8}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}
              style={{width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#6366F1,#818CF8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(99,102,241,0.4)'}}>
              <SFIcon name="doc" size={14} color="white" strokeWidth={2} />
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <button onClick={() => setCollapsed(true)} style={{ width:24, height:24, borderRadius:7, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-tertiary)', transition:'all 0.12s', flexShrink:0 }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='var(--text-secondary)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.04)';e.currentTarget.style.color='var(--text-tertiary)'}}
          >
            <SFIcon name="chevLeft" size={12} />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setCollapsed(false)} style={{ position:'absolute', right:-11, top:'50%', transform:'translateY(-50%)', width:22, height:22, borderRadius:'50%', background:'var(--bg-elevated)', border:'1px solid rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-secondary)', zIndex:10, boxShadow:'0 2px 8px rgba(0,0,0,0.4)', transition:'all 0.12s' }}>
            <SFIcon name="chevRight" size={11} />
          </button>
        )}
      </div>

      {/* ── Section label ── */}
      {!collapsed && (
        <div style={{padding:'18px 18px 6px', flexShrink:0, position:'relative', zIndex:1}}>
          <span className="label">Navigation</span>
        </div>
      )}
      {collapsed && <div style={{height:14}} />}

      {/* ── Nav links ── */}
      <nav style={{ flex:1, overflowY:'auto', padding: collapsed ? '0 8px' : '0 8px', display:'flex', flexDirection:'column', gap:2, position:'relative', zIndex:1 }}>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} end={link.end}
            style={({isActive}) => ({
              display:'flex', alignItems:'center', gap:9,
              padding: collapsed ? '10px 0' : '8px 10px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius:10, textDecoration:'none',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'linear-gradient(90deg,rgba(99,102,241,0.18) 0%,rgba(99,102,241,0.07) 100%)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(99,102,241,0.22)' : 'transparent'}`,
              position:'relative', transition:'all 0.12s ease',
              fontSize:13, fontWeight:500,
            })}
          >
            {({isActive}) => (
              <>
                <span style={{position:'relative', flexShrink:0}}>
                  <SFIcon name={link.icon} size={16} color={isActive ? '#818CF8' : 'currentColor'} strokeWidth={isActive ? 2 : 1.6} />
                  {link.notif && unreadCount > 0 && (
                    <span style={{position:'absolute', top:-4, right:-4, width:8, height:8, borderRadius:'50%', background:'var(--red)', border:'1.5px solid #080C14'}} />
                  )}
                </span>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span key="lbl" initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}} transition={{duration:0.14}}
                      style={{whiteSpace:'nowrap', flex:1}}>
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!collapsed && link.notif && unreadCount > 0 && (
                  <motion.span initial={{scale:0}} animate={{scale:1}}
                    style={{minWidth:17, height:17, borderRadius:99, background:'var(--red)', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px'}}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
                {isActive && (
                  <span style={{position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:'55%', borderRadius:'0 2px 2px 0', background:'#818CF8'}} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Divider ── */}
      <div className="divider" style={{margin:'0 10px', flexShrink:0}} />

      {/* ── User ── */}
      <div style={{padding: collapsed ? '10px 8px' : '10px 8px', display:'flex', flexDirection:'column', gap:2, flexShrink:0, position:'relative', zIndex:1}}>
        <div style={{display:'flex', alignItems:'center', gap:9, padding: collapsed ? '8px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius:10}}>
          <div style={{width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,rgba(99,102,241,0.3),rgba(20,184,166,0.3))', border:'1px solid rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--accent-bright)', flexShrink:0, fontFamily:'var(--font-display)'}}>
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}} transition={{duration:0.14}}>
                <div style={{fontSize:12, fontWeight:600, color:'var(--text-primary)', lineHeight:1.2, whiteSpace:'nowrap'}}>{displayName}</div>
                <div style={{fontSize:10, color:'var(--text-tertiary)', fontWeight:500, marginTop:1, letterSpacing:'0.03em'}}>{roleLabel}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button onClick={() => { logout(); navigate('/') }}
          style={{display:'flex', alignItems:'center', gap:9, padding: collapsed ? '8px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius:10, border:'none', background:'transparent', color:'var(--text-tertiary)', cursor:'pointer', transition:'all 0.12s', width:'100%', fontSize:13, fontWeight:500}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(239,68,68,0.08)';e.currentTarget.style.color='var(--red)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-tertiary)'}}
        >
          <SFIcon name="logout" size={15} />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{opacity:0,x:-6}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-6}} transition={{duration:0.14}} style={{whiteSpace:'nowrap'}}>
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  )
}
