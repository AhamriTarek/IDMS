import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import api from '../api/axios'

// File paths returned by Django are relative (e.g. /media/…); resolve against API host
const API_URL = import.meta.env.VITE_API_URL || ''

function FileIcon({ name }) {
  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  const map = {
    pdf:  { color:'#FF3B30', label:'PDF' },
    doc:  { color:'#0071E3', label:'DOC' },
    docx: { color:'#0071E3', label:'DOC' },
    xls:  { color:'#34C759', label:'XLS' },
    xlsx: { color:'#34C759', label:'XLS' },
    ppt:  { color:'#FF9F0A', label:'PPT' },
    pptx: { color:'#FF9F0A', label:'PPT' },
    png:  { color:'#AF52DE', label:'IMG' },
    jpg:  { color:'#AF52DE', label:'IMG' },
    jpeg: { color:'#AF52DE', label:'IMG' },
    zip:  { color:'#FF9F0A', label:'ZIP' },
  }
  const cfg = map[ext] ?? { color:'#6E6E73', label: ext.toUpperCase().slice(0,3) || 'FIL' }
  return (
    <div style={{ width:38, height:38, borderRadius:9, background:cfg.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <span style={{ fontSize:9, fontWeight:800, color:cfg.color, letterSpacing:'0.03em' }}>{cfg.label}</span>
    </div>
  )
}

function formatSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1048576).toFixed(1)} MB`
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })
}

export default function Stock() {
  const [dossiers, setDossiers]           = useState([])
  const [selected, setSelected]           = useState(null)
  const [fichiers, setFichiers]           = useState([])
  const [loadingD, setLoadingD]           = useState(true)
  const [loadingF, setLoadingF]           = useState(false)
  const [search, setSearch]               = useState('')

  const loadDossiers = useCallback(async () => {
    setLoadingD(true)
    try { const { data } = await api.get('/dossiers/'); setDossiers(data.results ?? data) }
    catch { setDossiers([]) }
    finally { setLoadingD(false) }
  }, [])

  const loadFichiers = useCallback(async (dossierId) => {
    setLoadingF(true)
    try { const { data } = await api.get(`/fichiers/?dossier=${dossierId}`); setFichiers(data.results ?? data) }
    catch { setFichiers([]) }
    finally { setLoadingF(false) }
  }, [])

  useEffect(() => { loadDossiers() }, [loadDossiers])
  useEffect(() => { if (selected) loadFichiers(selected.id) else setFichiers([]) }, [selected, loadFichiers])

  const filteredD = dossiers.filter(d => d.titre?.toLowerCase().includes(search.toLowerCase()))

  const statusCls = { en_cours:'badge badge-blue', termine:'badge badge-green', archive:'badge badge-gray' }
  const statusLbl = { en_cours:'En cours', termine:'Terminé', archive:'Archivé' }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font)' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0 }}>
        <Navbar title="Documents" />
        <main style={{ flex:1, display:'flex', overflow:'hidden' }}>

          {/* ── Dossiers list ── */}
          <div style={{ width:280, flexShrink:0, borderRight:'1px solid var(--border)', background:'var(--bg-raised)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
            <div style={{ padding:'16px 14px 10px' }}>
              <div style={{ position:'relative' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ paddingLeft:30, fontSize:13 }} />
              </div>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'4px 8px 16px' }}>
              {loadingD ? (
                [1,2,3].map(i => <div key={i} style={{ height:52, borderRadius:10, background:'var(--bg-sunken)', margin:'4px 0', animation:'pulse 1.5s infinite' }} />)
              ) : filteredD.length === 0 ? (
                <div style={{ padding:'24px 10px', textAlign:'center', color:'var(--text-tertiary)', fontSize:13 }}>Aucun dossier</div>
              ) : filteredD.map(d => (
                <button key={d.id} onClick={() => setSelected(d)}
                  style={{
                    display:'flex', alignItems:'center', gap:11, width:'100%',
                    padding:'10px 12px', borderRadius:10, border:'none',
                    background: selected?.id === d.id ? 'var(--accent-soft)' : 'transparent',
                    color: selected?.id === d.id ? 'var(--accent)' : 'var(--text-primary)',
                    cursor:'pointer', textAlign:'left',
                    transition:'all 0.12s',
                    marginBottom:2,
                  }}
                  onMouseEnter={e => { if (selected?.id !== d.id) e.currentTarget.style.background='var(--bg-sunken)' }}
                  onMouseLeave={e => { if (selected?.id !== d.id) e.currentTarget.style.background='transparent' }}
                >
                  <div style={{ width:30, height:30, borderRadius:8, background: selected?.id === d.id ? 'var(--accent)' : 'var(--bg-sunken)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.12s' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={selected?.id === d.id ? 'white' : 'var(--text-secondary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.titre}</div>
                    <div style={{ fontSize:11, color:'var(--text-tertiary)', marginTop:1 }}>{d.fichiers?.length ?? 0} fichier(s)</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Fichiers panel ── */}
          <div style={{ flex:1, padding:'28px 32px', overflowY:'auto' }}>
            {!selected ? (
              <div style={{ height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-tertiary)', gap:12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.4 }}>
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p style={{ fontSize:14, margin:0 }}>Sélectionnez un dossier</p>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:24, flexWrap:'wrap' }}>
                  <div>
                    <h2 style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.03em', color:'var(--text-primary)', margin:'0 0 4px' }}>{selected.titre}</h2>
                    {selected.description && <p style={{ fontSize:13, color:'var(--text-secondary)', margin:'0 0 8px' }}>{selected.description}</p>}
                    <span className={statusCls[selected.status] ?? 'badge badge-gray'}>
                      {statusLbl[selected.status] ?? selected.status}
                    </span>
                  </div>
                </div>

                {loadingF ? (
                  <div style={{ color:'var(--text-tertiary)', fontSize:13, padding:'24px 0' }}>Chargement…</div>
                ) : fichiers.length === 0 ? (
                  <div className="surface" style={{ padding:'48px', textAlign:'center', color:'var(--text-tertiary)', fontSize:14 }}>
                    Ce dossier ne contient aucun fichier
                  </div>
                ) : (
                  <div className="surface" style={{ overflow:'hidden' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:12, padding:'10px 18px', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
                      {['Fichier','Taille','Date','Action'].map(h => <span key={h} className="label">{h}</span>)}
                    </div>
                    {fichiers.map((f, i) => (
                      <motion.div key={f.id}
                        initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
                        style={{
                          display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:12, alignItems:'center',
                          padding:'12px 18px',
                          borderBottom: i < fichiers.length-1 ? '1px solid var(--border)' : 'none',
                          transition:'background 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background='var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <FileIcon name={f.nom} />
                          <div>
                            <div style={{ fontSize:13, fontWeight:500, color:'var(--text-primary)' }}>{f.nom}</div>
                            {f.uploaded_by?.username && <div style={{ fontSize:11, color:'var(--text-tertiary)' }}>par {f.uploaded_by.username}</div>}
                          </div>
                        </div>
                        <div style={{ fontSize:12, color:'var(--text-tertiary)' }}>{formatSize(f.taille)}</div>
                        <div style={{ fontSize:12, color:'var(--text-tertiary)' }}>{formatDate(f.created_at)}</div>
                        <a href={`${API_URL}${f.fichier}`} download target="_blank" rel="noreferrer"
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 11px', borderRadius:7, border:'1px solid var(--border-mid)', background:'var(--bg)', color:'var(--text-secondary)', textDecoration:'none', fontSize:12, fontWeight:500, transition:'all 0.12s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='var(--accent)'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='var(--accent)' }}
                          onMouseLeave={e => { e.currentTarget.style.background='var(--bg)'; e.currentTarget.style.color='var(--text-secondary)'; e.currentTarget.style.borderColor='var(--border-mid)' }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          Télécharger
                        </a>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  )
}
