import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

// ── Animations ────────────────────────────────────────────────────────────────
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0  },
  transition: { delay, duration: 0.38, ease: [0.22, 1, 0.36, 1] },
})

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_LABELS = {
  enterprise: { label: 'Entreprise', color: '#3B82F6' },
  bills:      { label: 'Factures',   color: '#F59E0B' },
  hr:         { label: 'RH',         color: '#10B981' },
  reports:    { label: 'Rapports',   color: '#8B5CF6' },
}

const STATUS_BADGE = {
  en_attente: { label: 'En attente', bg: 'rgba(245,158,11,0.12)', color: '#F59E0B' },
  approuve:   { label: 'Approuvé',   bg: 'rgba(16,185,129,0.12)', color: '#10B981' },
  rejete:     { label: 'Rejeté',     bg: 'rgba(239,68,68,0.12)',  color: '#EF4444' },
}

// ── Skeleton block ────────────────────────────────────────────────────────────
function Skel({ h = 20, w = '100%', r = 8 }) {
  return (
    <div style={{ height: h, width: w, borderRadius: r, background: 'var(--bg-sunken)', animation: 'pulse 1.4s ease-in-out infinite' }} />
  )
}

// ── Trend chip ────────────────────────────────────────────────────────────────
function Trend({ pct, dir }) {
  if (pct == null) return null
  const up = dir === 'up'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 2,
      fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      background: up ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
      color: up ? '#10B981' : '#EF4444',
    }}>
      {up ? '↑' : '↓'} {pct}%
    </span>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, sub, stat, color, delay, to }) {
  const navigate = useNavigate()
  return (
    <motion.div {...fade(delay)}
      onClick={() => navigate(to)}
      style={{
        padding: '20px 22px', borderRadius: 14, cursor: 'pointer',
        background: 'var(--bg-raised)', border: '1px solid var(--border)',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.boxShadow = `0 0 0 3px ${color}18` }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
          {icon}
        </div>
        {stat && <Trend pct={stat.pct} dir={stat.dir} />}
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', lineHeight: 1 }}>
          {stat ? stat.value : <Skel h={32} w={60} />}
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginTop: 5 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</div>
      </div>
    </motion.div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ title, action, actionLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        {title}
      </h2>
      {action && (
        <Link to={action} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
          {actionLabel ?? 'Voir tout →'}
        </Link>
      )}
    </div>
  )
}

// ── Custom donut label ────────────────────────────────────────────────────────
function DonutLabel({ cx, cy, total }) {
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-8" fontSize="22" fontWeight="700" fill="var(--text-primary)">{total}</tspan>
      <tspan x={cx} dy="20" fontSize="11" fill="var(--text-tertiary)">dossiers</tspan>
    </text>
  )
}

// ── Custom bar tooltip ────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{payload[0].value} fichier{payload[0].value !== 1 ? 's' : ''}</div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats,       setStats]       = useState(null)
  const [parType,     setParType]     = useState(null)
  const [activite,    setActivite]    = useState(null)
  const [lastDossiers, setLastDossiers] = useState(null)
  const [lastSubs,    setLastSubs]    = useState(null)

  const load = useCallback(async () => {
    try {
      const [sRes, ptRes, acRes, dRes, subRes] = await Promise.all([
        api.get('/stats/'),
        api.get('/stats/dossiers-par-type/'),
        api.get('/stats/activite/'),
        api.get('/dossiers/?page_size=5'),
        api.get('/soumissions/?page_size=5'),
      ])
      setStats(sRes.data)
      setParType(ptRes.data)
      setActivite(acRes.data)
      setLastDossiers(dRes.data.results ?? dRes.data)
      setLastSubs(subRes.data.results ?? subRes.data)
    } catch {}
  }, [])

  useEffect(() => { load() }, [load])

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bonjour'
    if (h < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }
  const prenom = user?.profile?.prenom ?? user?.username

  // Enrich donut data with labels/colors
  const donutData = (parType ?? []).map(r => {
    const cfg = TYPE_LABELS[r.type] || { label: r.type, color: '#64748B' }
    return { name: cfg.label, value: r.count, color: cfg.color }
  })
  const donutTotal = donutData.reduce((s, r) => s + r.value, 0)

  const STAT_CARDS = [
    { icon: <FolderIcon />, label: 'Dossiers',         sub: 'Total créés',              stat: stats?.dossiers,    color: '#3B82F6', delay: 0.05, to: '/admin/dossiers'       },
    { icon: <UsersIcon  />, label: 'Employés actifs',  sub: 'Comptes activés',          stat: stats?.employes,    color: '#10B981', delay: 0.10, to: '/admin/comptes'         },
    { icon: <UploadIcon />, label: 'Soumissions',      sub: 'Fichiers soumis au total', stat: stats?.soumissions, color: '#F59E0B', delay: 0.15, to: '/admin/soumissions'     },
    { icon: <BellIcon   />, label: 'Notifs non lues',  sub: 'En attente de lecture',    stat: stats?.notifs,      color: '#EF4444', delay: 0.20, to: '/admin/notifications'   },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Vue d'ensemble" />

        <main style={{ flex: 1, padding: '32px 36px 56px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>

            {/* ── Greeting ── */}
            <motion.div {...fade(0)} style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 4px' }}>
                {greeting()}, {prenom} 👋
              </h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-tertiary)', margin: 0 }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </motion.div>

            {/* ── Stat cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 36 }}>
              {STAT_CARDS.map(c => (
                <StatCard key={c.label} {...c} />
              ))}
            </div>

            {/* ── Charts row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 36 }}>

              {/* Donut — dossiers par type */}
              <motion.div {...fade(0.28)} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
                <SectionTitle title="Dossiers par type" />
                {!parType ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <Skel h={140} r={12} />
                  </div>
                ) : donutTotal === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Aucun dossier</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                          dataKey="value" strokeWidth={0}>
                          {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => active && payload?.length ? (
                            <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                              <span style={{ color: payload[0].payload.color, fontWeight: 700 }}>{payload[0].name}</span>
                              <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>{payload[0].value}</span>
                            </div>
                          ) : null}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center label overlay — absolute not available in SVG so use legend below */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                      {donutData.map(d => (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>

              {/* Bar — activité 7 jours */}
              <motion.div {...fade(0.32)} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
                <SectionTitle title="Fichiers uploadés — 7 derniers jours" />
                {!activite ? (
                  <Skel h={180} r={12} />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={activite} barSize={22} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(0,212,255,0.06)' }} />
                      <Bar dataKey="count" fill="var(--accent)" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </motion.div>
            </div>

            {/* ── Tables row ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

              {/* Last dossiers */}
              <motion.div {...fade(0.36)} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px 14px' }}>
                  <SectionTitle title="Derniers dossiers créés" action="/admin/dossiers" />
                </div>
                {!lastDossiers ? (
                  <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1,2,3].map(i => <Skel key={i} h={44} r={8} />)}
                  </div>
                ) : lastDossiers.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '28px 0' }}>Aucun dossier</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Nom', 'Type', 'Fichiers', 'Date'].map(h => (
                          <th key={h} style={{ padding: '6px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lastDossiers.slice(0, 5).map((d, i) => {
                        const tc = TYPE_LABELS[d.type_dossier] || { label: d.type_dossier, color: '#64748B' }
                        return (
                          <tr key={d.id} style={{ borderBottom: i < lastDossiers.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '10px 14px', color: 'var(--text-primary)', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titre}</td>
                            <td style={{ padding: '10px 14px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: tc.color + '18', color: tc.color }}>{tc.label}</span>
                            </td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{d.fichiers_count ?? 0}</td>
                            <td style={{ padding: '10px 14px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </motion.div>

              {/* Recent submissions */}
              <motion.div {...fade(0.40)} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px 14px' }}>
                  <SectionTitle title="Soumissions récentes" action="/admin/soumissions" />
                </div>
                {!lastSubs ? (
                  <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[1,2,3].map(i => <Skel key={i} h={44} r={8} />)}
                  </div>
                ) : lastSubs.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '28px 0' }}>Aucune soumission</p>
                ) : (
                  <div>
                    {lastSubs.slice(0, 5).map((s, i) => {
                      const b = STATUS_BADGE[s.status] ?? { label: s.status, bg: 'var(--bg-sunken)', color: 'var(--text-tertiary)' }
                      return (
                        <div key={s.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
                          borderBottom: i < lastSubs.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nom_fichier}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{s.employe?.prenom} {s.employe?.nom}</div>
                          </div>
                          <span style={{ padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: b.bg, color: b.color, flexShrink: 0 }}>{b.label}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </div>

          </div>
        </main>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function FolderIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
}
function UsersIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
function UploadIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
}
function BellIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
}
