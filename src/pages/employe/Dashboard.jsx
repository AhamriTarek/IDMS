import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useDossiers } from '../../context/DossiersContext'
import { useNotifications } from '../../context/NotificationContext'
import Sidebar from '../../components/Sidebar'
import Navbar from '../../components/Navbar'
import AnimatedCounter from '../../components/AnimatedCounter'
import SFIcon from '../../components/SFIcon'
import { employeAPI } from '../../services/employeAPI'

const FADE = (d=0) => ({initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, transition:{delay:d, duration:0.4, ease:[0.16,1,0.3,1]}})

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now()-new Date(d))/1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff/60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)} h`
  return new Date(d).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})
}

function StatCard({ iconName, label, value, color, to, delay=0, loading=false }) {
  const navigate = useNavigate()
  const [hov, setHov] = useState(false)
  return (
    <motion.div {...FADE(delay)} className="stat-card"
      onClick={() => to && navigate(to)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{borderColor: hov ? `${color}40` : undefined, boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}18` : undefined, cursor: to ? 'pointer' : 'default'}}
    >
      <div style={{position:'absolute', top:-30, right:-30, width:100, height:100, borderRadius:'50%', background:`${color}0D`, filter:'blur(24px)', pointerEvents:'none', opacity: hov?1:0.5, transition:'opacity 0.3s'}} />
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, position:'relative'}}>
        <div style={{width:40, height:40, borderRadius:13, background:`${color}14`, border:`1px solid ${color}22`, display:'flex', alignItems:'center', justifyContent:'center', transition:'transform 0.22s', transform: hov?'scale(1.10) rotate(-6deg)':'scale(1)'}}>
          <SFIcon name={iconName} size={18} color={color} strokeWidth={1.7} />
        </div>
        <div style={{width:6, height:6, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}`, animation:'live-pulse 2.5s ease infinite'}} />
      </div>
      <div style={{fontFamily:'var(--font-display)', fontSize:33, fontWeight:700, letterSpacing:'-0.05em', color:'var(--text-primary)', lineHeight:1, marginBottom:5, position:'relative'}}>
        {loading ? <div className="skeleton" style={{height:33, width:58, borderRadius:6}} /> : <AnimatedCounter value={value??0} />}
      </div>
      <div style={{fontSize:12, fontWeight:500, color:'var(--text-secondary)'}}>{label}</div>
      <div style={{position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color}30,transparent)`, borderRadius:'0 0 var(--r-xl) var(--r-xl)', opacity: hov?1:0.5, transition:'opacity 0.2s'}} />
    </motion.div>
  )
}

const STATUS_CFG = {
  en_attente: {dot:'var(--amber)', cls:'badge-amber', label:'En attente'},
  approuve:   {dot:'var(--green)', cls:'badge-green', label:'Approuvé'},
  rejete:     {dot:'var(--red)',   cls:'badge-red',   label:'Rejeté'},
}

export default function EmployeeDashboard() {
  const { user }              = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { dossiers }          = useDossiers()
  const { unreadCount }       = useNotifications()
  const navigate              = useNavigate()
  const [subs, setSubs]       = useState([])
  const [loading, setLoading] = useState(true)

  const displayName = user?.profile?.prenom ? user.profile.prenom : user?.username ?? '—'
  const h = new Date().getHours()
  const greeting = h<12 ? 'Bonjour' : h<18 ? 'Bon après-midi' : 'Bonsoir'

  const load = useCallback(async () => {
    setLoading(true)
    try { const {data} = await employeAPI.getSoumissions(); setSubs(data.results ?? data) }
    catch { setSubs([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const enAttente = subs.filter(s=>s.status==='en_attente').length
  const approuves = subs.filter(s=>s.status==='approuve').length

  const QUICK = [
    {icon:'folder',       label:'Mes Dossiers',    path:'/employe/dossiers',      color:'#818CF8'},
    {icon:'upload',       label:'Soumissions',     path:'/employe/soumissions',   color:'#14B8A6'},
    {icon:'bell',         label:'Notifications',   path:'/employe/notifications', color:'#FBBF24', badge:unreadCount},
  ]

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Tableau de bord" />
        <main style={{flex:1, padding:'22px 24px', overflowY:'auto'}}>

          {/* Welcome */}
          <motion.div {...FADE(0)} style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:20}}>
            <div>
              <h1 style={{fontFamily:'var(--font-display)', fontSize:23, fontWeight:700, letterSpacing:'-0.04em', color:'var(--text-primary)', marginBottom:4}}>
                {greeting}, {displayName} 👋
              </h1>
              <p style={{fontSize:12, color:'var(--text-secondary)'}}>
                {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </p>
            </div>
            <button onClick={toggleTheme} title="Changer le thème"
              style={{width:34, height:34, borderRadius:10, background:'var(--glass-bg)', border:'1px solid var(--border-mid)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-secondary)', transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='var(--glass-bg-hover)';e.currentTarget.style.transform='scale(1.08)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='var(--glass-bg)';e.currentTarget.style.transform='scale(1)'}}
            >
              <SFIcon name={isDark?'sun':'moon'} size={15} />
            </button>
          </motion.div>

          {/* Stats */}
          <div className="grid-stat" style={{marginBottom:20}}>
            <StatCard iconName="stack"       label="Mes Dossiers"    value={dossiers.length} color="#818CF8" to="/employe/dossiers"      delay={0}    loading={!dossiers} />
            <StatCard iconName="clock"       label="En Attente"      value={enAttente}       color="#FBBF24" to="/employe/soumissions"   delay={0.06} loading={loading}   />
            <StatCard iconName="checkCircle" label="Acceptées"       value={approuves}       color="#34D399" to="/employe/soumissions"   delay={0.12} loading={loading}   />
            <StatCard iconName="bell"        label="Notifications"   value={unreadCount}     color="#C084FC" to="/employe/notifications" delay={0.18} loading={false}     />
          </div>

          {/* Quick actions */}
          <motion.div {...FADE(0.22)} style={{marginBottom:20}}>
            <p className="label" style={{marginBottom:10}}>Actions rapides</p>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {QUICK.map(q => (
                <button key={q.path} onClick={() => navigate(q.path)}
                  style={{display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:10, background:'var(--glass-bg)', border:'1px solid var(--border-mid)', color:'var(--text-secondary)', fontSize:13, fontWeight:500, cursor:'pointer', transition:'all 0.14s', position:'relative'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--glass-bg-hover)';e.currentTarget.style.color='var(--text-primary)';e.currentTarget.style.borderColor='var(--border-strong)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='var(--glass-bg)';e.currentTarget.style.color='var(--text-secondary)';e.currentTarget.style.borderColor='var(--border-mid)'}}
                >
                  <div style={{width:22, height:22, borderRadius:7, background:`${q.color}14`, border:`1px solid ${q.color}22`, display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <SFIcon name={q.icon} size={12} color={q.color} strokeWidth={1.8} />
                  </div>
                  {q.label}
                  {q.badge > 0 && <span style={{minWidth:16, height:16, borderRadius:99, background:'var(--red)', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px'}}>{q.badge}</span>}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Two column */}
          <div className="grid-2">
            {/* Recent dossiers */}
            <motion.div {...FADE(0.26)} className="surface" style={{overflow:'hidden'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px 11px', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="label">Mes Dossiers Récents</span>
                <button onClick={() => navigate('/employe/dossiers')} style={{background:'none', border:'none', cursor:'pointer', color:'var(--accent-bright)', fontSize:12, fontWeight:500, padding:0, display:'flex', alignItems:'center', gap:4, transition:'opacity 0.1s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.6'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                >Voir tout <SFIcon name="arrowRight" size={12} /></button>
              </div>
              {!dossiers || dossiers.length === 0 ? (
                <div style={{padding:'32px 18px', textAlign:'center', color:'var(--text-tertiary)', fontSize:13}}>
                  <SFIcon name="folder" size={28} color="var(--text-tertiary)" style={{margin:'0 auto 10px'}} />
                  <div>Aucun dossier accessible</div>
                </div>
              ) : dossiers.slice(0,5).map((d,i) => (
                <div key={d.id} onClick={() => navigate('/employe/dossiers')}
                  style={{display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom: i<Math.min(dossiers.length,5)-1?'1px solid rgba(255,255,255,0.04)':'none', cursor:'pointer', transition:'background 0.1s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <div style={{width:32, height:32, borderRadius:9, background:'rgba(129,140,248,0.10)', border:'1px solid rgba(129,140,248,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                    <SFIcon name="folder" size={15} color="#818CF8" strokeWidth={1.6} />
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.titre}</div>
                    <div style={{fontSize:11, color:'var(--text-tertiary)', marginTop:1}}>{d.fichiers_count??d.fichiers?.length??0} fichier(s)</div>
                  </div>
                  <SFIcon name="chevRight" size={13} color="var(--text-tertiary)" />
                </div>
              ))}
            </motion.div>

            {/* Recent soumissions */}
            <motion.div {...FADE(0.30)} className="surface" style={{overflow:'hidden'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px 11px', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                <span className="label">Dernières Soumissions</span>
                <button onClick={() => navigate('/employe/soumissions')} style={{background:'none', border:'none', cursor:'pointer', color:'var(--accent-bright)', fontSize:12, fontWeight:500, padding:0, display:'flex', alignItems:'center', gap:4, transition:'opacity 0.1s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.6'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                >Voir tout <SFIcon name="arrowRight" size={12} /></button>
              </div>
              {loading ? (
                <div style={{padding:'14px 18px', display:'flex', flexDirection:'column', gap:8}}>
                  {[1,2,3].map(i => <div key={i} className="skeleton" style={{height:44, borderRadius:9}} />)}
                </div>
              ) : subs.length === 0 ? (
                <div style={{padding:'32px 18px', textAlign:'center', color:'var(--text-tertiary)', fontSize:13}}>
                  <SFIcon name="upload" size={28} color="var(--text-tertiary)" style={{margin:'0 auto 10px'}} />
                  <div>Aucune soumission</div>
                </div>
              ) : subs.slice(0,5).map((s,i) => {
                const sc = STATUS_CFG[s.status] || {cls:'badge-gray', dot:'var(--text-tertiary)', label:s.status}
                return (
                  <div key={s.id}
                    style={{display:'flex', alignItems:'center', gap:12, padding:'11px 18px', borderBottom: i<Math.min(subs.length,5)-1?'1px solid rgba(255,255,255,0.04)':'none', transition:'background 0.1s'}}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                  >
                    <div style={{width:32, height:32, borderRadius:9, background:'rgba(20,184,166,0.08)', border:'1px solid rgba(20,184,166,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                      <SFIcon name="upload" size={14} color="#14B8A6" strokeWidth={1.7} />
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:13, fontWeight:500, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{s.nom_fichier||s.dossier?.titre||'Soumission'}</div>
                      <div style={{fontSize:11, color:'var(--text-tertiary)', marginTop:1}}>{timeAgo(s.created_at)}</div>
                    </div>
                    <span className={`badge ${sc.cls}`}><span className="badge-dot" style={{background:sc.dot}} />{sc.label}</span>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
