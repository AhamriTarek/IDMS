import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ActivityFeed from '../components/ActivityFeed'
import AnimatedCounter from '../components/AnimatedCounter'
import SFIcon from '../components/SFIcon'
import api from '../api/axios'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const fade = (d=0) => ({ initial:{opacity:0,y:16}, animate:{opacity:1,y:0}, transition:{delay:d, duration:0.4, ease:[0.16,1,0.3,1]} })

const TYPE_LABELS = {
  enterprise: { label:'Entreprise', color:'#818CF8' },
  bills:      { label:'Factures',   color:'#FBBF24' },
  hr:         { label:'RH',         color:'#34D399' },
  reports:    { label:'Rapports',   color:'#F87171' },
}
const STATUS_CFG = {
  en_attente: { label:'En attente', dot:'var(--amber)', cls:'badge-amber' },
  approuve:   { label:'Approuvé',   dot:'var(--green)', cls:'badge-green' },
  rejete:     { label:'Rejeté',     dot:'var(--red)',   cls:'badge-red'   },
}

// SF-style icon for each stat card
const STAT_ICONS = {
  stack:      { icon:'stack',       color:'#818CF8' },
  clock:      { icon:'clock',       color:'#FBBF24' },
  checkCircle:{ icon:'checkCircle', color:'#34D399' },
  personBadge:{ icon:'personBadge', color:'#14B8A6' },
}

function Skel({ h=20, w='100%', r=8 }) {
  return <div className="skeleton" style={{height:h, width:w, borderRadius:r}} />
}

function StatCard({ iconName, label, sub, value, color, delay, to }) {
  const navigate = useNavigate()
  const [hov, setHov] = useState(false)
  return (
    <motion.div {...fade(delay)} className="stat-card"
      onClick={() => navigate(to)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ borderColor: hov ? `${color}40` : undefined, boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${color}18` : undefined }}
    >
      <div style={{position:'absolute', top:-30, right:-30, width:110, height:110, borderRadius:'50%', background:`${color}0E`, filter:'blur(28px)', pointerEvents:'none', opacity: hov ? 1 : 0.5, transition:'opacity 0.3s'}} />
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, position:'relative'}}>
        <div style={{
          width:42, height:42, borderRadius:14,
          background:`${color}14`, border:`1px solid ${color}22`,
          display:'flex', alignItems:'center', justifyContent:'center',
          transition:'transform 0.22s ease',
          transform: hov ? 'scale(1.10) rotate(-6deg)' : 'scale(1)',
        }}>
          <SFIcon name={iconName} size={18} color={color} strokeWidth={1.7} />
        </div>
        {/* Live pulse dot */}
        <div style={{width:7, height:7, borderRadius:'50%', background:color, boxShadow:`0 0 8px ${color}`, animation:'live-pulse 2.5s ease infinite'}} />
      </div>
      <div style={{position:'relative'}}>
        <div style={{fontFamily:'var(--font-display)', fontSize:36, fontWeight:700, letterSpacing:'-0.05em', color:'var(--text-primary)', lineHeight:1, marginBottom:6}}>
          {value != null ? <AnimatedCounter value={value} duration={900} /> : <Skel h={36} w={68} />}
        </div>
        <div style={{fontSize:13, fontWeight:500, color:'var(--text-secondary)', marginBottom:2}}>{label}</div>
        {sub && <div style={{fontSize:11, color:'var(--text-tertiary)'}}>{sub}</div>}
      </div>
      <div style={{position:'absolute', bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg,transparent,${color}30,transparent)`, borderRadius:'0 0 var(--r-xl) var(--r-xl)', opacity: hov ? 1 : 0.5, transition:'opacity 0.2s'}} />
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{background:'var(--bg-elevated)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:10, padding:'10px 14px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}>
      {label && <div style={{fontSize:11, color:'var(--text-tertiary)', marginBottom:6}}>{label}</div>}
      {payload.map((p,i) => (
        <div key={i} style={{display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-primary)'}}>
          <span style={{width:8, height:8, borderRadius:2, background:p.color}} />
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ title, action, actionLabel }) {
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
      <h2 className="label">{title}</h2>
      {action && (
        <Link to={action} style={{fontSize:12, color:'var(--accent-bright)', fontWeight:500, textDecoration:'none', display:'flex', alignItems:'center', gap:4, transition:'opacity 0.12s'}}
          onMouseEnter={e=>e.currentTarget.style.opacity='0.6'}
          onMouseLeave={e=>e.currentTarget.style.opacity='1'}
        >
          {actionLabel ?? 'Voir tout'}
          <SFIcon name="arrowRight" size={12} />
        </Link>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const { user }                = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [stats, setStats]       = useState(null)
  const [recent, setRecent]     = useState([])
  const [loading, setLoading]   = useState(true)
  const navigate                = useNavigate()

  const displayName = user?.profile?.prenom ? user.profile.prenom : user?.username ?? 'Admin'
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [sRes, dRes] = await Promise.all([
        api.get('/api/stats/').catch(() => ({data:{}})),
        api.get('/api/dossiers/?page_size=6').catch(() => ({data:{results:[]}})),
      ])
      setStats(sRes.data)
      setRecent(dRes.data.results ?? dRes.data ?? [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const typeData = Object.entries(TYPE_LABELS).map(([k,v]) => ({
    name: v.label, value: stats?.[`${k}_count`] ?? 0, color: v.color,
  }))

  const statCards = [
    { iconName:'stack',       label:'Total Dossiers',   sub:'Tous types',          color:'#818CF8', value:stats?.total_dossiers,    to:'/admin/dossiers', delay:0     },
    { iconName:'clock',       label:'En attente',       sub:'À traiter',           color:'#FBBF24', value:stats?.pending_dossiers,  to:'/admin/dossiers', delay:0.06  },
    { iconName:'checkCircle', label:'Approuvés',        sub:'Cette période',       color:'#34D399', value:stats?.approved_dossiers, to:'/admin/dossiers', delay:0.12  },
    { iconName:'personBadge', label:'Comptes Employés', sub:'Utilisateurs actifs', color:'#14B8A6', value:stats?.total_employees,   to:'/admin/comptes',  delay:0.18  },
  ]

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Vue d'ensemble" />
        <main style={{flex:1, padding:'22px 24px', overflowY:'auto'}}>

          {/* Welcome */}
          <motion.div {...fade(0)} style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap', marginBottom:20}}>
            <div>
              <h1 style={{fontFamily:'var(--font-display)', fontSize:23, fontWeight:700, letterSpacing:'-0.04em', color:'var(--text-primary)', marginBottom:4}}>
                {greeting}, {displayName} 👋
              </h1>
              <p style={{fontSize:12, color:'var(--text-secondary)'}}>Aperçu de l'activité documentaire en temps réel.</p>
            </div>
            <div style={{display:'flex', gap:8}}>
              {/* Theme toggle */}
              <button onClick={toggleTheme} title={isDark ? 'Mode clair' : 'Mode sombre'}
                style={{width:34, height:34, borderRadius:10, background:'var(--glass-bg)', border:'1px solid var(--border-mid)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-secondary)', transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--glass-bg-hover)';e.currentTarget.style.transform='scale(1.08)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--glass-bg)';e.currentTarget.style.transform='scale(1)'}}
              >
                <SFIcon name={isDark ? 'sun' : 'moon'} size={15} />
              </button>
              {/* Refresh */}
              <button onClick={loadData}
                style={{display:'flex', alignItems:'center', gap:7, padding:'0 14px', height:34, background:'var(--glass-bg)', color:'var(--text-secondary)', border:'1px solid var(--border-mid)', borderRadius:10, fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.15s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--glass-bg-hover)';e.currentTarget.style.color='var(--text-primary)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='var(--glass-bg)';e.currentTarget.style.color='var(--text-secondary)'}}
              >
                <SFIcon name="refresh" size={13} />
                Actualiser
              </button>
            </div>
          </motion.div>

          {/* ⌘K hint */}
          <motion.div {...fade(0.05)} style={{marginBottom:20}}>
            <div style={{display:'inline-flex', alignItems:'center', gap:8, padding:'5px 12px', borderRadius:99, background:'var(--glass-bg)', border:'1px solid var(--border)', fontSize:11, color:'var(--text-tertiary)'}}>
              <SFIcon name="search" size={11} color="var(--text-tertiary)" />
              Naviguer rapidement :
              {['⌘','K'].map(k => (
                <kbd key={k} style={{padding:'1px 6px', borderRadius:5, background:'var(--accent-subtle)', border:'1px solid rgba(99,102,241,0.2)', fontSize:10, color:'var(--accent-bright)', fontFamily:'inherit'}}>{k}</kbd>
              ))}
            </div>
          </motion.div>

          {/* Stat cards */}
          <div className="grid-stat" style={{marginBottom:20}}>
            {statCards.map(s => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Main 2-col layout */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:16, alignItems:'start'}}>

            {/* Left */}
            <div style={{display:'flex', flexDirection:'column', gap:16}}>

              {/* Charts */}
              <div className="grid-2">
                <motion.div {...fade(0.24)} className="surface" style={{padding:'18px 20px'}}>
                  <SectionHeader title="Répartition par type" />
                  <ResponsiveContainer width="100%" height={175}>
                    <PieChart>
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {typeData.map((e,i) => <Cell key={i} fill={e.color} opacity={0.85} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{display:'flex', flexWrap:'wrap', gap:'5px 14px'}}>
                    {typeData.map(t => (
                      <div key={t.name} style={{display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--text-secondary)', fontWeight:500}}>
                        <span style={{width:8, height:8, borderRadius:2, background:t.color}} />
                        {t.name} <span style={{color:'var(--text-primary)', fontWeight:600}}>({t.value})</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div {...fade(0.28)} className="surface" style={{padding:'18px 20px'}}>
                  <SectionHeader title="Statuts" />
                  <ResponsiveContainer width="100%" height={175}>
                    <BarChart data={[
                      {name:'En attente', val: stats?.pending_dossiers  ?? 0},
                      {name:'Approuvés',  val: stats?.approved_dossiers ?? 0},
                      {name:'Rejetés',    val: stats?.rejected_dossiers ?? 0},
                    ]} barSize={22}>
                      <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize:10, fill:'var(--text-tertiary)'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize:10, fill:'var(--text-tertiary)'}} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="val" radius={[5,5,0,0]} name="Dossiers">
                        {[{color:'#FBBF24'},{color:'#34D399'},{color:'#F87171'}].map((e,i) => <Cell key={i} fill={e.color} opacity={0.85} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              </div>

              {/* Recent */}
              <motion.div {...fade(0.32)} className="surface" style={{padding:'18px 20px'}}>
                <SectionHeader title="Dossiers récents" action="/admin/dossiers" />
                {loading ? (
                  <div style={{display:'flex', flexDirection:'column', gap:8}}>
                    {[1,2,3,4].map(i => <Skel key={i} h={48} r={10} />)}
                  </div>
                ) : recent.length === 0 ? (
                  <div style={{padding:'28px 0', textAlign:'center', color:'var(--text-tertiary)', fontSize:12}}>
                    Aucun dossier — créez-en un depuis la page Dossiers.
                  </div>
                ) : recent.map((d,i) => {
                  const sc = STATUS_CFG[d.status] || {label:d.status, cls:'badge-gray', dot:'var(--text-tertiary)'}
                  const tColor = TYPE_LABELS[d.type]?.color || '#818CF8'
                  const tIcon = d.type==='enterprise' ? 'stack' : d.type==='bills' ? 'doc' : d.type==='hr' ? 'personBadge' : d.type==='reports' ? 'chartBar' : 'folder'
                  return (
                    <div key={d.id} onClick={() => navigate('/admin/dossiers')}
                      style={{display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i<recent.length-1 ? '1px solid rgba(255,255,255,0.04)':'none', cursor:'pointer', borderRadius:8, transition:'background 0.1s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <div style={{width:34, height:34, borderRadius:10, background:`${tColor}12`, border:`1px solid ${tColor}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                        <SFIcon name={tIcon} size={16} color={tColor} strokeWidth={1.6} />
                      </div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{fontSize:13, fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{d.titre||d.title||'Sans titre'}</div>
                        <div style={{fontSize:11, color:'var(--text-tertiary)', marginTop:1}}>{new Date(d.created_at||d.date_creation).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}</div>
                      </div>
                      <span className={`badge ${sc.cls}`}><span className="badge-dot" style={{background:sc.dot}}/>{sc.label}</span>
                    </div>
                  )
                })}
              </motion.div>
            </div>

            {/* Right: Activity Feed */}
            <motion.div {...fade(0.20)} className="surface" style={{padding:0, overflow:'hidden', display:'flex', flexDirection:'column', maxHeight:520}}>
              <ActivityFeed />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}
