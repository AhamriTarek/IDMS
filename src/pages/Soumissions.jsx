import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import api from '../api/axios'

const statusConfig = {
  en_attente: { cls: 'badge badge-amber', label: 'En attente' },
  approuve:   { cls: 'badge badge-green', label: 'Approuvé'   },
  rejete:     { cls: 'badge badge-red',   label: 'Rejeté'     },
}

function timeAgo(d) {
  if (!d) return ''
  const diff = (Date.now() - new Date(d)) / 1000
  if (diff < 60)    return 'À l\'instant'
  if (diff < 3600)  return `Il y a ${Math.floor(diff/60)} min`
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)} h`
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
}

function RejectModal({ sub, onClose, onDone }) {
  const [raison, setRaison] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try { await api.post(`/soumissions/${sub.id}/rejeter/`, { raison }); onDone() }
    catch { /* ignore */ }
    finally { setLoading(false); onClose() }
  }
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.3)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity:0, scale:0.96 }} animate={{ opacity:1, scale:1 }} transition={{ duration:0.18 }}
        style={{ width:'100%', maxWidth:400, background:'var(--bg-raised)', border:'1px solid var(--border)', borderRadius:18, boxShadow:'var(--shadow-xl)', overflow:'hidden' }}>
        <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
          <h3 style={{ margin:0, fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>Rejeter la soumission</h3>
        </div>
        <form onSubmit={submit} style={{ padding:'18px 22px' }}>
          <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:14 }}>
            Fichier : <strong>{sub.nom_fichier}</strong>
          </p>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'var(--text-secondary)', marginBottom:6 }}>Raison du rejet</label>
            <textarea className="input" value={raison} onChange={e => setRaison(e.target.value)} rows={3} placeholder="Expliquez pourquoi ce fichier est rejeté…" style={{ resize:'vertical', lineHeight:1.5 }} />
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex:1 }}>Annuler</button>
            <button type="submit" disabled={loading} style={{ flex:2, padding:'10px 20px', background:'var(--red)', border:'none', borderRadius:'var(--r-md)', color:'white', fontWeight:600, fontSize:14, cursor: loading ? 'not-allowed':'pointer', fontFamily:'var(--font)', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Rejet…' : 'Confirmer le rejet'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export default function Soumissions() {
  const { isAdmin } = useAuth()
  const [subs, setSubs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')
  const [rejectTarget, setRejectTarget] = useState(null)
  const [dossiers, setDossiers] = useState([])
  const [selectedDossier, setDossier] = useState('')
  const [file, setFile]       = useState(null)
  const [uploading, setUp]    = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/soumissions/')
      setSubs(data.results ?? data)
    } catch { setSubs([]) }
    finally { setLoading(false) }
  }, [])

  const loadDossiers = useCallback(async () => {
    try {
      const { data } = await api.get('/dossiers/')
      setDossiers(data.results ?? data)
    } catch { setDossiers([]) }
  }, [])

  useEffect(() => { load(); if (!isAdmin) loadDossiers() }, [load, loadDossiers, isAdmin])

  const approve = async (id) => {
    try { await api.post(`/soumissions/${id}/approuver/`); load() } catch { /* ignore */ }
  }

  const submitFile = async (e) => {
    e.preventDefault()
    if (!file || !selectedDossier) return
    setUp(true)
    try {
      const fd = new FormData()
      fd.append('fichier', file)
      fd.append('dossier_id', selectedDossier)
      await api.post('/soumissions/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setFile(null); setDossier('')
      load()
    } catch { /* ignore */ }
    finally { setUp(false) }
  }

  const filtered = filter === 'all' ? subs : subs.filter(s => s.status === filter)

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font)' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Navbar title="Soumissions" />
        <main style={{ flex:1, padding:'32px 32px 48px', overflowY:'auto', maxWidth:880, margin:'0 auto', width:'100%' }}>

          <div style={{ marginBottom:28 }}>
            <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.03em', color:'var(--text-primary)', margin:'0 0 2px' }}>Soumissions</h1>
            <p style={{ fontSize:13, color:'var(--text-tertiary)', margin:0 }}>{subs.length} soumission(s) au total</p>
          </div>

          {/* Upload form (employees only) */}
          {!isAdmin && (
            <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
              className="surface" style={{ padding:'20px 22px', marginBottom:28 }}>
              <p style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)', margin:'0 0 14px' }}>Soumettre un fichier</p>
              <form onSubmit={submitFile} style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'flex-end' }}>
                <div style={{ flex:'1 1 200px', minWidth:180 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:5 }}>Dossier</label>
                  <select className="input" value={selectedDossier} onChange={e => setDossier(e.target.value)} required style={{ fontSize:13 }}>
                    <option value="">Choisir un dossier…</option>
                    {dossiers.map(d => <option key={d.id} value={d.id}>{d.titre}</option>)}
                  </select>
                </div>
                <div style={{ flex:'2 1 240px', minWidth:200 }}>
                  <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--text-secondary)', marginBottom:5 }}>Fichier</label>
                  <label style={{
                    display:'flex', alignItems:'center', gap:10, padding:'9px 13px',
                    background:'var(--bg)', border:'1.5px dashed var(--border-mid)', borderRadius:'var(--r-md)',
                    cursor:'pointer', transition:'all 0.15s',
                    color: file ? 'var(--text-primary)' : 'var(--text-tertiary)', fontSize:13,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.background='var(--accent-soft)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-mid)'; e.currentTarget.style.background='var(--bg)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    {file ? file.name : 'Choisir un fichier…'}
                    <input type="file" style={{ display:'none' }} onChange={e => setFile(e.target.files[0])} />
                  </label>
                </div>
                <button type="submit" className="btn-primary" disabled={uploading || !file || !selectedDossier} style={{ fontSize:13, alignSelf:'flex-end' }}>
                  {uploading ? 'Envoi…' : 'Soumettre'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Filter tabs */}
          <div style={{ display:'flex', gap:6, marginBottom:18 }}>
            {[
              { key:'all',        label:`Tout (${subs.length})`                                },
              { key:'en_attente', label:`En attente (${subs.filter(s=>s.status==='en_attente').length})` },
              { key:'approuve',   label:`Approuvés (${subs.filter(s=>s.status==='approuve').length})`   },
              { key:'rejete',     label:`Rejetés (${subs.filter(s=>s.status==='rejete').length})`       },
            ].map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
                padding:'6px 14px', borderRadius:99, fontSize:13, fontWeight:500, cursor:'pointer', border:'1px solid',
                transition:'all 0.15s',
                background: filter === tab.key ? 'var(--text-primary)' : 'var(--bg-raised)',
                color:       filter === tab.key ? 'white' : 'var(--text-secondary)',
                borderColor: filter === tab.key ? 'var(--text-primary)' : 'var(--border)',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="surface" style={{ padding:'36px', textAlign:'center', color:'var(--text-tertiary)', fontSize:14 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="surface" style={{ padding:'48px 24px', textAlign:'center', color:'var(--text-tertiary)', fontSize:14 }}>
              Aucune soumission{filter !== 'all' ? ' dans cette catégorie' : ''}
            </div>
          ) : (
            <div className="surface" style={{ overflow:'hidden' }}>
              {/* Header */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, padding:'10px 18px', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
                {['Fichier', isAdmin ? 'Employé' : 'Dossier', 'Soumis', 'Statut'].map(h => (
                  <span key={h} className="label">{h}</span>
                ))}
              </div>

              {filtered.map((s, i) => {
                const b = statusConfig[s.status] ?? { cls:'badge badge-gray', label:s.status }
                return (
                  <div key={s.id} style={{
                    display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:12, alignItems:'center',
                    padding:'12px 18px',
                    borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    transition:'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                  >
                    <div>
                      <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{s.nom_fichier}</div>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text-secondary)' }}>
                      {isAdmin
                        ? `${s.employe?.prenom ?? ''} ${s.employe?.nom ?? ''}`
                        : (s.dossier?.titre ?? '—')
                      }
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-tertiary)' }}>{timeAgo(s.created_at)}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span className={b.cls}>{b.label}</span>
                      {isAdmin && s.status === 'en_attente' && (
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => approve(s.id)} style={{
                            padding:'4px 10px', borderRadius:7, border:'1px solid rgba(52,199,89,0.4)',
                            background:'var(--green-soft)', color:'#1A7F3C',
                            fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)',
                            transition:'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(52,199,89,0.25)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--green-soft)'}
                          >Approuver</button>
                          <button onClick={() => setRejectTarget(s)} style={{
                            padding:'4px 10px', borderRadius:7, border:'1px solid rgba(255,59,48,0.3)',
                            background:'var(--red-soft)', color:'#C0392B',
                            fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)',
                            transition:'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(255,59,48,0.2)'}
                          onMouseLeave={e => e.currentTarget.style.background='var(--red-soft)'}
                          >Rejeter</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {rejectTarget && (
          <RejectModal sub={rejectTarget} onClose={() => setRejectTarget(null)} onDone={load} />
        )}
      </AnimatePresence>
    </div>
  )
}
