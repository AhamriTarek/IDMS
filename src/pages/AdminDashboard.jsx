import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import StatCard from '../components/dashboard/StatCard'
import { Folder, Users, Upload, Bell } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
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
  enterprise: { label: 'Entreprise', color: '#0071E3' },
  bills:      { label: 'Factures',   color: '#FF9F0A' },
  hr:         { label: 'RH',         color: '#34C759' },
  reports:    { label: 'Rapports',   color: '#64748B' },
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function Skel({ h = 20, w = '100%', r = 8 }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r,
      background: 'var(--bg-sunken)',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  )
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ title, action, actionLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <span className="label">{title}</span>
      {action && (
        <Link to={action} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, textDecoration: 'none' }}>
          {actionLabel ?? 'Voir tout →'}
        </Link>
      )}
    </div>
  )
}

// ── Glass chart tooltip ───────────────────────────────────────────────────────
function GlassTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', fontSize: 12,
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
        {payload[0].value} fichier{payload[0].value !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

// ── Card wrapper with inner highlight ─────────────────────────────────────────
function ElevatedCard({ children, delay, style = {} }) {
  return (
    <motion.div {...fade(delay)} style={{
      position: 'relative',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-xl)',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.03), inset 0 1px 0 rgba(255,255,255,0.9)',
      ...style,
    }}>
      {/* Inner top highlight */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.72), transparent)',
        pointerEvents: 'none', zIndex: 1,
      }} />
      {children}
    </motion.div>
  )
}

// ── Status badge helpers ──────────────────────────────────────────────────────
const BADGE_CLASS = {
  en_attente: 'badge badge-amber',
  approuve:   'badge badge-green',
  rejete:     'badge badge-red',
}
const STATUS_LABEL = { en_attente: 'En attente', approuve: 'Approuvé', rejete: 'Rejeté' }

// ── Main component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats,        setStats]        = useState(null)
  const [parType,      setParType]      = useState(null)
  const [activite,     setActivite]     = useState(null)
  const [lastDossiers, setLastDossiers] = useState(null)
  const [lastSubs,     setLastSubs]     = useState(null)

  // ── Data fetching — UNCHANGED ──────────────────────────────────────────────
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

  const donutData = (parType ?? []).map(r => {
    const cfg = TYPE_LABELS[r.type] || { label: r.type, color: '#64748B' }
    return { name: cfg.label, value: r.count, color: cfg.color }
  })
  const donutTotal = donutData.reduce((s, r) => s + r.value, 0)

  const STAT_CARDS = [
    { icon: Folder, label: 'Dossiers',        sub: 'Total créés',              stat: stats?.dossiers,    gradient: 'linear-gradient(135deg, #8B7FFF 0%, #6366F1 100%)', iconShadowColor: 'rgba(99,102,241,0.28)', delay: 0.05, to: '/admin/dossiers'     },
    { icon: Users,  label: 'Employés actifs', sub: 'Comptes activés',          stat: stats?.employes,    gradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', iconShadowColor: 'rgba(16,185,129,0.28)', delay: 0.10, to: '/admin/comptes'       },
    { icon: Upload, label: 'Soumissions',     sub: 'Fichiers soumis au total', stat: stats?.soumissions, gradient: 'linear-gradient(135deg, #FB923C 0%, #F97316 100%)', iconShadowColor: 'rgba(249,115,22,0.28)',  delay: 0.15, to: '/admin/soumissions'   },
    { icon: Bell,   label: 'Notifs non lues', sub: 'En attente de lecture',    stat: stats?.notifs,      gradient: 'linear-gradient(135deg, #FB7185 0%, #F43F5E 100%)', iconShadowColor: 'rgba(244,63,94,0.28)',   delay: 0.20, to: '/admin/notifications' },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Vue d'ensemble" />

        <main className="dashboard-main" style={{ flex: 1, padding: '36px 40px 64px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 1140, margin: '0 auto' }}>

            {/* ── Welcome section ── */}
            <motion.div {...fade(0)} style={{ marginBottom: 40 }}>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 34, fontWeight: 400,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em', lineHeight: 1.15,
                margin: '0 0 6px',
              }}>
                {greeting()}, {prenom}
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </motion.div>

            {/* ── Stat cards ── */}
            <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
              {STAT_CARDS.map(c => <StatCard key={c.label} {...c} />)}
            </div>

            {/* ── Charts row ── */}
            <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18, marginBottom: 40 }}>

              {/* Donut — dossiers par type */}
              <ElevatedCard delay={0.28} style={{ padding: '24px 26px' }}>
                <SectionTitle title="Dossiers par type" />
                {!parType ? (
                  <Skel h={160} r={12} />
                ) : donutTotal === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', paddingTop: 48 }}>Aucun dossier</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={donutData} cx="50%" cy="50%"
                          innerRadius={54} outerRadius={80}
                          dataKey="value" strokeWidth={0}
                          animationBegin={100} animationDuration={700}
                        >
                          {donutData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => active && payload?.length ? (
                            <div style={{
                              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                              border: '1px solid var(--border)', borderRadius: 12, padding: '8px 12px', fontSize: 12,
                              boxShadow: 'var(--shadow-md)',
                            }}>
                              <span style={{ color: payload[0].payload.color, fontWeight: 700 }}>{payload[0].name}</span>
                              <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>{payload[0].value}</span>
                            </div>
                          ) : null}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                      {donutData.map(d => (
                        <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{d.name}</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </ElevatedCard>

              {/* Bar — activité 7 jours */}
              <ElevatedCard delay={0.32} style={{ padding: '24px 26px' }}>
                <SectionTitle title="Fichiers uploadés — 7 derniers jours" />
                {!activite ? (
                  <Skel h={220} r={12} />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={activite} barSize={24} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<GlassTooltip />} cursor={{ fill: 'rgba(0,113,227,0.05)' }} />
                      <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]}
                        animationBegin={150} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ElevatedCard>
            </div>

            {/* ── Tables row ── */}
            <div className="tables-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

              {/* Last dossiers */}
              <ElevatedCard delay={0.36}>
                <div style={{ padding: '22px 24px 14px' }}>
                  <SectionTitle title="Derniers dossiers créés" action="/admin/dossiers" />
                </div>
                {!lastDossiers ? (
                  <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1,2,3].map(i => <Skel key={i} h={46} r={10} />)}
                  </div>
                ) : lastDossiers.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>Aucun dossier</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Nom', 'Type', 'Fichiers', 'Date'].map(h => (
                          <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lastDossiers.slice(0, 5).map((d, i) => {
                        const tc = TYPE_LABELS[d.type_dossier] || { label: d.type_dossier, color: '#64748B' }
                        return (
                          <tr key={d.id}
                            style={{ borderBottom: i < lastDossiers.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.14s ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,113,227,0.04)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '11px 16px', color: 'var(--text-primary)', fontWeight: 500, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titre}</td>
                            <td style={{ padding: '11px 16px' }}>
                              <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: tc.color + '18', color: tc.color }}>{tc.label}</span>
                            </td>
                            <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}>{d.fichiers_count ?? 0}</td>
                            <td style={{ padding: '11px 16px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </ElevatedCard>

              {/* Recent submissions */}
              <ElevatedCard delay={0.40}>
                <div style={{ padding: '22px 24px 14px' }}>
                  <SectionTitle title="Soumissions récentes" action="/admin/soumissions" />
                </div>
                {!lastSubs ? (
                  <div style={{ padding: '0 24px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[1,2,3].map(i => <Skel key={i} h={54} r={10} />)}
                  </div>
                ) : lastSubs.length === 0 ? (
                  <p style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>Aucune soumission</p>
                ) : (
                  <div>
                    {lastSubs.slice(0, 5).map((s, i) => {
                      const initials = `${s.employe?.prenom?.[0] ?? ''}${s.employe?.nom?.[0] ?? ''}`.toUpperCase() || '?'
                      return (
                        <div key={s.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                            borderBottom: i < lastSubs.length - 1 ? '1px solid var(--border)' : 'none',
                            transition: 'background 0.14s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,113,227,0.04)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Gradient avatar with initials */}
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, var(--accent-soft), rgba(0,113,227,0.18))',
                            border: '1px solid var(--accent-soft)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                          }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nom_fichier}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{s.employe?.prenom} {s.employe?.nom}</div>
                          </div>
                          <span className={BADGE_CLASS[s.status] ?? 'badge badge-gray'}>
                            {STATUS_LABEL[s.status] ?? s.status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ElevatedCard>
            </div>

          </div>
        </main>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @media (max-width: 960px) {
          .charts-grid { grid-template-columns: 1fr !important; }
          .tables-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .dashboard-main { padding: 20px 16px 48px !important; }
        }
      `}</style>
    </div>
  )
}

