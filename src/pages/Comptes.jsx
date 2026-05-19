import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, UserPlus, FolderOpen, ChevronDown, Upload, Pencil, Eye } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useDossiers } from '../context/DossiersContext'

const PREDEFINED_TYPES = [
  'Administrateur', 'Comptable', 'Ressources Humaines (RH)', 'Développeur',
  'Manager', 'Commercial', 'Juridique', 'Finance', 'IT / Technique', 'Autre',
]
const PERM_CHECKS = [
  { key: 'ajouter',   label: 'Ajouter fichiers',   Icon: Upload, color: '#10B981' },
  { key: 'supprimer', label: 'Supprimer fichiers',  Icon: Trash2, color: '#EF4444' },
]
const ACCES_ICONS = {
  lecture:  [{ Icon: Eye,    color: '#64748B', label: 'Lecture'    }],
  ecriture: [{ Icon: Upload, color: '#10B981', label: 'Ajouter'    }],
  admin:    [{ Icon: Upload, color: '#10B981', label: 'Ajouter'    }, { Icon: Trash2, color: '#EF4444', label: 'Supprimer' }],
}
function permToAcces({ ajouter, supprimer }) {
  if (supprimer) return 'admin'; if (ajouter) return 'ecriture'; return 'lecture'
}
function accesToPerm(acces) {
  if (acces === 'admin')    return { ajouter: true,  supprimer: true  }
  if (acces === 'ecriture') return { ajouter: true,  supprimer: false }
  return                           { ajouter: false, supprimer: false }
}

function Avatar({ name = '?', size = 34 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const palette  = ['#6366F1','#14B8A6','#F59E0B','#EF4444','#8B5CF6','#06B6D4']
  const bg       = palette[name.charCodeAt(0) % palette.length] || palette[0]
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: size * 0.36, fontWeight: 700, boxShadow: `0 0 0 2px rgba(0,0,0,0.3)` }}>
      {initials}
    </div>
  )
}

function Chip({ label }) {
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, whiteSpace: 'nowrap', background: 'rgba(99,102,241,0.08)', color: 'var(--accent-bright)', border: '1px solid rgba(99,102,241,0.15)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }} title={label}>{label}</span>
  )
}

function TypeBadge({ label }) {
  return <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, fontWeight: 600, color: '#14B8A6', background: 'rgba(20,184,166,0.10)', border: '1px solid rgba(20,184,166,0.20)', whiteSpace: 'nowrap' }}>{label}</span>
}

function Modal({ children, onClose, maxW = 520 }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(4,6,12,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
        style={{ width: '100%', maxWidth: maxW, background: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20, boxShadow: '0 32px 96px rgba(0,0,0,0.8)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </motion.div>
    </div>
  )
}

function ModalHeader({ title, sub, icon, onClose }) {
  return (
    <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      {icon && <div style={{ width: 36, height: 36, borderRadius: '50%', background: icon.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon.el}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{title}</h3>
        {sub && <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</p>}
      </div>
      <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 18, transition: 'all 0.12s', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'var(--text-primary)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--text-tertiary)' }}
      >×</button>
    </div>
  )
}

function DossierPermSection({ dossiers, localDossiers, setLocalDossiers }) {
  const isGranted = (id) => localDossiers.some(d => String(d.id) === String(id))
  const getPerms  = (id) => localDossiers.find(d => String(d.id) === String(id))?.permissions ?? { ajouter: false, supprimer: false }
  const toggleDossier = (dossier) => {
    setLocalDossiers(prev => {
      const exists = prev.some(d => String(d.id) === String(dossier.id))
      if (exists) return prev.filter(d => String(d.id) !== String(dossier.id))
      return [...prev, { id: dossier.id, nom: dossier.titre, permissions: { ajouter: false, supprimer: false } }]
    })
  }
  const togglePerm = (dossierId, key) => {
    setLocalDossiers(prev => prev.map(d => String(d.id) === String(dossierId) ? { ...d, permissions: { ...d.permissions, [key]: !d.permissions[key] } } : d))
  }
  if (dossiers.length === 0) return <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>Aucun dossier disponible.</p>
  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        <FolderOpen size={12} />Dossiers & Permissions
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {dossiers.map(d => {
          const granted = isGranted(d.id); const perms = getPerms(d.id)
          return (
            <div key={d.id} style={{ border: `1px solid ${granted ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, padding: '10px 12px', background: granted ? 'rgba(99,102,241,0.07)' : 'rgba(255,255,255,0.02)', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={granted} onChange={() => toggleDossier(d)} style={{ width: 15, height: 15, accentColor: '#6366F1', cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.titre}</span>
              </div>
              {granted && (
                <div style={{ display: 'flex', gap: 14, marginTop: 10, paddingLeft: 25 }}>
                  {PERM_CHECKS.map(p => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox" checked={perms[p.key] ?? false} onChange={() => togglePerm(d.id, p.key)} style={{ width: 13, height: 13, accentColor: p.color, cursor: 'pointer' }} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: perms[p.key] ? p.color : 'var(--text-tertiary)', fontWeight: perms[p.key] ? 600 : 400 }}>
                        <p.Icon size={11} color={perms[p.key] ? p.color : 'var(--text-tertiary)'} />{p.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DeleteModal({ employe, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false)
  const confirm = async () => { setBusy(true); try { await api.delete(`/employes/${employe.id}/`); onDeleted(employe.id); onClose() } catch { setBusy(false) } }
  return (
    <Modal onClose={onClose} maxW={380}>
      <div style={{ padding: '24px 22px 20px' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <Trash2 size={18} color="#EF4444" />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Supprimer ce compte ?</h3>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Le compte de <strong style={{ color: 'var(--text-primary)' }}>{employe.prenom} {employe.nom}</strong> sera définitivement supprimé.</p>
      </div>
      <div style={{ padding: '0 22px 20px', display: 'flex', gap: 10 }}>
        <button onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
        <button onClick={confirm} disabled={busy} className="btn-danger" style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}>
          <Trash2 size={13} />{busy ? 'Suppression…' : 'Supprimer'}
        </button>
      </div>
    </Modal>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: 6, letterSpacing: '0.07em', textTransform: 'uppercase' }

function CreateModal({ onClose, onCreated, dossiers, typeEmployes }) {
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', type_employe_id: '' })
  const [localDossiers, setLocalDossiers] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const submit = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim()) { setError('Prénom, nom et email sont requis.'); return }
    setBusy(true); setError(null)
    try {
      let typeId
      if (form.type_employe_id) {
        const existing = typeEmployes.find(t => t.nom === form.type_employe_id)
        typeId = existing?.id ?? (await api.post('/type-employes/', { nom: form.type_employe_id })).data.id
      }
      const username = form.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') + '_' + Date.now().toString(36)
      const { data: reg } = await api.post('/register/', { username, email: form.email, prenom: form.prenom, nom: form.nom, type_employe_id: typeId })
      const eid = reg.employe_id
      if (eid && localDossiers.length > 0) {
        await Promise.all(localDossiers.map(d => api.post('/permissions/', { employe_id: eid, dossier_id: Number(d.id), acces: permToAcces(d.permissions) }).catch(() => {})))
      }
      onCreated(); onClose()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? JSON.stringify(d) : d?.detail || 'Erreur création')
    } finally { setBusy(false) }
  }
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Créer un compte" icon={{ bg: 'rgba(99,102,241,0.12)', el: <UserPlus size={16} color="var(--accent-bright)" /> }} onClose={onClose} />
      <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['prenom','Prénom'],['nom','Nom']].map(([k,l]) => (
            <div key={k}><label style={lbl}>{l} *</label><input className="input" value={form[k]} onChange={set(k)} placeholder={l} style={{ fontSize: 13 }} required /></div>
          ))}
        </div>
        <div>
          <label style={lbl}>Email Gmail *</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="prenom.nom@gmail.com" style={{ fontSize: 13 }} required />
          <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-tertiary)' }}>ℹ️ Connexion via Google (Gmail requis)</p>
        </div>
        <div>
          <label style={lbl}>Type de compte</label>
          <div style={{ position: 'relative' }}>
            <select className="input" value={form.type_employe_id} onChange={set('type_employe_id')} style={{ fontSize: 13, paddingRight: 32, cursor: 'pointer' }}>
              <option value="">— Sélectionner —</option>
              {PREDEFINED_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown size={13} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
          </div>
        </div>
        <DossierPermSection dossiers={dossiers} localDossiers={localDossiers} setLocalDossiers={setLocalDossiers} />
        {error && <div style={{ padding: '10px 12px', borderRadius: 9, background: 'var(--red-subtle)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: 12 }}>{error}</div>}
      </form>
      <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, flexShrink: 0 }}>
        <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
        <button onClick={submit} disabled={busy} className="btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: 13 }}>
          <UserPlus size={14} />{busy ? 'Enregistrement…' : 'Créer le compte'}
        </button>
      </div>
    </Modal>
  )
}

function EditModal({ employe, onClose, onDone, dossiers }) {
  const [localDossiers, setLocalDossiers] = useState(() =>
    (employe.dossiers || []).map(d => ({ id: d.dossier_id, nom: d.titre, permissions: accesToPerm(d.acces) }))
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const handleSave = async () => {
    setBusy(true); setError(null)
    const eid = employe.id
    const current = {}; (employe.dossiers || []).forEach(d => { current[d.dossier_id] = d })
    const oldSet = new Set(Object.keys(current).map(Number))
    const newSet = new Set(localDossiers.map(d => Number(d.id)))
    const toDelete = [...oldSet].filter(id => !newSet.has(id))
    const toCreate = [...newSet].filter(id => !oldSet.has(id))
    const toUpdate = [...newSet].filter(id => oldSet.has(id) && current[id].acces !== permToAcces(localDossiers.find(d => Number(d.id) === id).permissions))
    const errs = []
    await Promise.all([
      ...toDelete.map(id => api.delete(`/permissions/${current[id].permId}/`).catch(e => errs.push(e))),
      ...toUpdate.map(id => api.patch(`/permissions/${current[id].permId}/`, { acces: permToAcces(localDossiers.find(d => Number(d.id) === id).permissions) }).catch(e => errs.push(e))),
      ...toCreate.map(id => api.post('/permissions/', { employe_id: eid, dossier_id: id, acces: permToAcces(localDossiers.find(d => Number(d.id) === id).permissions) }).catch(e => errs.push(e))),
    ])
    if (errs.length) { setError('Erreur lors de la sauvegarde.'); setBusy(false); return }
    onDone(eid, localDossiers); onClose()
  }
  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Modifier les permissions"
        sub={`${employe.prenom} ${employe.nom} · ${employe.user?.email ?? ''}`}
        icon={{ bg: 'rgba(59,130,246,0.10)', el: <Pencil size={15} color="#3B82F6" /> }}
        onClose={onClose} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
        <DossierPermSection dossiers={dossiers} localDossiers={localDossiers} setLocalDossiers={setLocalDossiers} />
        {error && <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 9, background: 'var(--red-subtle)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: 12 }}>{error}</div>}
      </div>
      <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 10, flexShrink: 0 }}>
        <button onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
        <button onClick={handleSave} disabled={busy} className="btn-primary" style={{ flex: 2, justifyContent: 'center', fontSize: 13, background: '#3B82F6' }}>
          <Pencil size={13} />{busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </Modal>
  )
}

export default function Comptes() {
  const { dossiers } = useDossiers()
  const [accounts, setAccounts]     = useState([])
  const [typeEmployes, setTypeEmployes] = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const safe = async (url) => { const { data } = await api.get(url); return data.results ?? data }
      const [emps, perms, types] = await Promise.all([safe('/employes/'), safe('/permissions/'), safe('/type-employes/')])
      const permsMap = {}
      perms.forEach(p => { const eid = p.employe?.id ?? p.employe; if (eid == null) return; if (!permsMap[eid]) permsMap[eid] = []; permsMap[eid].push(p) })
      const merged = emps.map(emp => {
        const empPerms = permsMap[emp.id] || []
        return {
          ...emp,
          _rawDossiers: empPerms.map(p => ({ permId: p.id, dossier_id: typeof p.dossier === 'object' ? p.dossier?.id : p.dossier, titre: p.dossier_titre || `Dossier #${typeof p.dossier === 'object' ? p.dossier?.id : p.dossier}`, acces: p.acces })),
          dossiers: empPerms.map(p => { const did = typeof p.dossier === 'object' ? p.dossier?.id : p.dossier; return { id: did, nom: p.dossier_titre || `Dossier #${did}`, permissions: accesToPerm(p.acces) } }),
        }
      })
      setAccounts(merged); setTypeEmployes(types)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSavePermissions = useCallback((employeId, updatedDossiers) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id !== employeId) return acc
      const newRaw = updatedDossiers.map(d => ({ permId: acc._rawDossiers?.find(r => Number(r.dossier_id) === Number(d.id))?.permId ?? null, dossier_id: Number(d.id), titre: d.nom, acces: permToAcces(d.permissions) }))
      return { ...acc, dossiers: updatedDossiers, _rawDossiers: newRaw }
    }))
    setTimeout(() => load(), 2000)
  }, [load])

  const handleDeleted = useCallback((id) => setAccounts(prev => prev.filter(a => a.id !== id)), [])
  const handleCreated = useCallback(() => load(), [load])
  const editTargetForModal = editTarget ? { ...editTarget, dossiers: editTarget._rawDossiers ?? [] } : null
  const filtered = accounts.filter(a => `${a.prenom} ${a.nom} ${a.user?.email ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  const Skel = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div className="skeleton" style={{ height: 13, width: '45%', borderRadius: 6 }} />
        <div className="skeleton" style={{ height: 11, width: '30%', borderRadius: 5 }} />
      </div>
      <div className="skeleton" style={{ width: 70, height: 20, borderRadius: 99 }} />
    </div>
  )

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Navbar title="Comptes" />
        <main style={{ flex: 1, padding: '24px 24px', overflowY: 'auto' }}>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--text-primary)', marginBottom: 4 }}>Comptes</h1>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{accounts.length} compte{accounts.length !== 1 ? 's' : ''} enregistré{accounts.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ paddingLeft: 32, width: 190, fontSize: 13 }} />
              </div>
              <button onClick={() => setShowCreate(true)} className="btn-primary" style={{ gap: 7, fontSize: 13 }}>
                <UserPlus size={14} />Nouveau compte
              </button>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {[
              { label: 'Total comptes', value: accounts.length, color: '#818CF8', bg: 'rgba(129,140,248,0.10)' },
              { label: 'Avec accès dossiers', value: accounts.filter(a => a.dossiers?.length > 0).length, color: '#14B8A6', bg: 'rgba(20,184,166,0.10)' },
              { label: 'Sans accès', value: accounts.filter(a => !a.dossiers?.length).length, color: '#FBBF24', bg: 'rgba(251,191,36,0.10)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 16px', background: s.bg, border: `1px solid ${s.color}25`, borderRadius: 12 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="surface" style={{ overflow: 'hidden' }}>
            {/* Col headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.8fr 2fr 72px', gap: 12, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['Employé', 'Type', 'Dossiers', 'Permissions', ''].map((h, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</span>
              ))}
            </div>

            {loading ? [1,2,3,4].map(i => <Skel key={i} />) : filtered.length === 0 ? (
              <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{search ? 'Aucun résultat' : 'Aucun compte'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{search ? `Aucun résultat pour "${search}"` : 'Créez le premier compte employé.'}</div>
              </div>
            ) : filtered.map((acc, i) => {
              const acDossiers = acc.dossiers || []
              return (
                <motion.div key={acc.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 1.8fr 2fr 72px', gap: 12, alignItems: 'center', padding: '13px 20px', borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar name={`${acc.prenom} ${acc.nom}`} size={34} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{acc.prenom} {acc.nom}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{acc.user?.email ?? '—'}</div>
                    </div>
                  </div>
                  <div>{acc.type_employe ? <TypeBadge label={acc.type_employe.nom} /> : <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {acDossiers.length > 0 ? acDossiers.map(d => <div key={d.id} style={{ height: 22, display: 'flex', alignItems: 'center' }}><Chip label={d.nom} /></div>) : <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Aucun</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {acDossiers.length > 0 ? acDossiers.map(d => {
                      const acces = permToAcces(d.permissions); const icons = ACCES_ICONS[acces] || ACCES_ICONS.lecture
                      return <div key={d.id} style={{ height: 22, display: 'flex', gap: 5, alignItems: 'center' }}>{icons.map(ic => <span key={ic.label} title={ic.label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: ic.color + '15', border: `1px solid ${ic.color}25` }}><ic.Icon size={11} color={ic.color} /></span>)}</div>
                    }) : <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>—</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditTarget(acc)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.07)', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.18)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.07)' }}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setDeleteTarget(acc)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.07)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} dossiers={dossiers} typeEmployes={typeEmployes} />}
        {editTargetForModal && <EditModal employe={editTargetForModal} onClose={() => setEditTarget(null)} onDone={handleSavePermissions} dossiers={dossiers} />}
        {deleteTarget && <DeleteModal employe={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}
      </AnimatePresence>
    </div>
  )
}
