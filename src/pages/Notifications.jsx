import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import SFIcon from '../components/SFIcon'
import { useNotifications } from '../context/NotificationContext'

const TYPE_CFG = {
  info:    { color:'var(--accent-bright)', bg:'var(--accent-subtle)',  iconName:'info',        label:'Info'    },
  success: { color:'#34D399',              bg:'var(--green-subtle)',   iconName:'checkCircle', label:'Succès'  },
  warning: { color:'#FBBF24',              bg:'var(--amber-subtle)',   iconName:'warning',     label:'Alerte'  },
  error:   { color:'#F87171',              bg:'var(--red-subtle)',     iconName:'x',           label:'Erreur'  },
}

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now()-new Date(d))/1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff/60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)} h`
  return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'long'})
}

function NotifItem({ n, index, onRead }) {
  const cfg    = TYPE_CFG[n.type_notif] ?? TYPE_CFG.info
  const isUnread = !n.lu
  return (
    <motion.div
      initial={{opacity:0, x:-10}}
      animate={{opacity:1, x:0}}
      transition={{delay:index*0.04, duration:0.32, ease:[0.16,1,0.3,1]}}
      onClick={() => isUnread && onRead(n.id)}
      style={{
        display:'flex', gap:14, padding:'15px 20px',
        borderBottom:'1px solid rgba(255,255,255,0.04)',
        background: isUnread ? 'rgba(99,102,241,0.035)' : 'transparent',
        cursor: isUnread ? 'pointer' : 'default',
        transition:'background 0.14s',
        borderLeft: isUnread ? `3px solid ${cfg.color}` : '3px solid transparent',
      }}
      onMouseEnter={e => { if(isUnread) e.currentTarget.style.background='rgba(255,255,255,0.025)' }}
      onMouseLeave={e => { if(isUnread) e.currentTarget.style.background='rgba(99,102,241,0.035)' }}
    >
      {/* Icon */}
      <div style={{width:38, height:38, borderRadius:12, flexShrink:0, background:`${cfg.color}12`, border:`1px solid ${cfg.color}22`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: isUnread ? `0 0 12px ${cfg.color}20` : 'none'}}>
        <SFIcon name={cfg.iconName} size={17} color={cfg.color} strokeWidth={1.8} />
      </div>

      {/* Content */}
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:4}}>
          <span style={{fontSize:13, fontWeight: isUnread ? 600 : 400, color:'var(--text-primary)', lineHeight:1.4}}>
            {n.titre}
          </span>
          <span style={{fontSize:11, color:'var(--text-tertiary)', whiteSpace:'nowrap', flexShrink:0}}>
            {timeAgo(n.created_at)}
          </span>
        </div>
        <p style={{margin:0, fontSize:12, color:'var(--text-secondary)', lineHeight:1.55}}>
          {n.message}
        </p>
        {isUnread && (
          <div style={{display:'inline-flex', alignItems:'center', gap:5, marginTop:7, padding:'2px 8px', borderRadius:6, background:`${cfg.color}10`, border:`1px solid ${cfg.color}18`}}>
            <div style={{width:4, height:4, borderRadius:'50%', background:cfg.color, animation:'live-pulse 2s infinite'}} />
            <span style={{fontSize:9, fontWeight:700, color:cfg.color, letterSpacing:'0.05em'}}>NON LUE</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function Notifications() {
  const { notifications, markAsRead, markAllAsRead, fetchNotifications } = useNotifications()
  useEffect(() => { fetchNotifications?.() }, [])

  const unread = notifications.filter(n => !n.lu)
  const read   = notifications.filter(n =>  n.lu)

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Notifications" />
        <main style={{flex:1, padding:'22px 24px', overflowY:'auto'}}>

          {/* Header */}
          <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:22}}>
            <div>
              <h1 style={{fontFamily:'var(--font-display)', fontSize:22, fontWeight:700, letterSpacing:'-0.04em', color:'var(--text-primary)', marginBottom:4}}>Notifications</h1>
              <p style={{fontSize:12, color:'var(--text-secondary)'}}>
                {unread.length > 0 ? `${unread.length} non lue${unread.length>1?'s':''}` : 'Tout est lu'}
                {notifications.length > 0 && ` · ${notifications.length} au total`}
              </p>
            </div>
            {unread.length > 0 && (
              <button onClick={markAllAsRead}
                style={{display:'flex', alignItems:'center', gap:7, padding:'8px 14px', background:'var(--glass-bg)', border:'1px solid var(--border-mid)', borderRadius:10, color:'var(--text-secondary)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.14s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--glass-bg-hover)';e.currentTarget.style.color='var(--text-primary)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--glass-bg)';e.currentTarget.style.color='var(--text-secondary)'}}
              >
                <SFIcon name="check" size={13} />
                Tout marquer comme lu
              </button>
            )}
          </motion.div>

          {/* Empty */}
          {notifications.length === 0 && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="surface" style={{padding:'52px 24px', textAlign:'center'}}>
              <div style={{width:56, height:56, borderRadius:18, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.14)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px'}}>
                <SFIcon name="bell" size={24} color="var(--text-tertiary)" strokeWidth={1.4} />
              </div>
              <div style={{fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6}}>Aucune notification</div>
              <div style={{fontSize:13, color:'var(--text-secondary)'}}>Les mises à jour apparaîtront ici</div>
            </motion.div>
          )}

          {/* Unread group */}
          {unread.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12}}>
                <span className="label">Non lues</span>
                <span style={{padding:'1px 8px', borderRadius:99, background:'var(--red-subtle)', border:'1px solid rgba(239,68,68,0.18)', fontSize:10, fontWeight:700, color:'#F87171'}}>{unread.length}</span>
              </div>
              <div className="surface" style={{overflow:'hidden'}}>
                {unread.map((n,i) => <NotifItem key={n.id} n={n} index={i} onRead={markAsRead} />)}
              </div>
            </div>
          )}

          {/* Read group */}
          {read.length > 0 && (
            <div>
              <span className="label" style={{display:'block', marginBottom:12}}>Lues</span>
              <div className="surface" style={{overflow:'hidden', opacity:0.72}}>
                {read.map((n,i) => <NotifItem key={n.id} n={n} index={i} onRead={markAsRead} />)}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
