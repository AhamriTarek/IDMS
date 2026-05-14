import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, UserPlus, FolderOpen, ChevronDown, Upload, Pencil, Eye } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import api from '../api/axios'
import { useDossiers } from '../context/DossiersContext'

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const PREDEFINED_TYPES = [
  'Administrateur', 'Comptable', 'Ressources Humaines (RH)', 'Développeur',
  'Manager', 'Commercial', 'Juridique', 'Finance', 'IT / Technique', 'Autre',
]

// 3 individual permission checkboxes (replaces the old dropdown)
const PERM_CHECKS = [
  { key: 'ajouter',   label: 'Ajouter fichiers',   Icon: Upload, color: '#10B981' },
  { key: 'supprimer', label: 'Supprimer fichiers', Icon: Trash2, color: '#EF4444' },
]

// Table: acces string → list of icons to show
const ACCES_ICONS = {
  lecture:  [{ Icon: Eye,    color: '#64748B', label: 'Lecture'    }],
  ecriture: [{ Icon: Upload, color: '#10B981', label: 'Ajouter'    }],
  admin:    [{ Icon: Upload, color: '#10B981', label: 'Ajouter'    }, { Icon: Trash2, color: '#EF4444', label: 'Supprimer' }],
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// { ajouter, modifier, supprimer } → 'lecture' | 'ecriture' | 'admin'
function permToAcces({ ajouter, supprimer }) {
  if (supprimer) return 'admin'
  if (ajouter) return 'ecriture'
  return 'lecture'
}

// 'lecture' | 'ecriture' | 'admin' → { ajouter, modifier, supprimer }
function accesToPerm(acces) {
  if (acces === 'admin')    return { ajouter: true,  supprimer: true  }
  if (acces === 'ecriture') return { ajouter: true,  supprimer: false }
  return                           { ajouter: false, supprimer: false }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ name = '?', size = 34 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
  const palette  = ['#0071E3', '#34C759', '#FF9F0A', '#FF3B30', '#AF52DE', '#32ADE6']
  const bg       = palette[name.charCodeAt(0) % palette.length] || palette[0]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontSize: size * 0.36, fontWeight: 700,
    }}>{initials}</div>
  )
}

function Chip({ label }) {
  return (
    <span style={{
      fontSize: 11, padding: '2px 9px', borderRadius: 6, whiteSpace: 'nowrap',
      background: 'var(--bg-sunken)', color: 'var(--text-secondary)',
      border: '1px solid var(--border)', maxWidth: 130,
      overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block',
    }} title={label}>{label}</span>
  )
}

function TypeBadge({ label }) {
  return <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 99, fontWeight: 600, color: '#0071E3', background: 'rgba(0,113,227,0.1)', whiteSpace: 'nowrap' }}>{label}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────────────────────────────────────

function DeleteModal({ employe, onClose, onDeleted }) {
  const [busy, setBusy] = useState(false)
  const confirm = async () => {
    setBusy(true)
    try { await api.delete(`/employes/${employe.id}/`); onDeleted(employe.id); onClose() }
    catch { setBusy(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.15 }}
        style={{ width: '100%', maxWidth: 380, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 18, boxShadow: 'var(--shadow-xl)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 22px 16px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Trash2 size={18} color="#EF4444" />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Supprimer ce compte ?</h3>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Le compte de <strong>{employe.prenom} {employe.nom}</strong> sera supprimé définitivement.
          </p>
        </div>
        <div style={{ padding: '12px 22px 18px', display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
          <button onClick={confirm} disabled={busy} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Trash2 size={13} />{busy ? 'Suppression…' : 'Supprimer'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: dossier + permission checkboxes section
// ─────────────────────────────────────────────────────────────────────────────

function DossierPermSection({ dossiers, localDossiers, setLocalDossiers }) {
  // localDossiers: [{ id, nom, permissions: { ajouter, modifier, supprimer } }]

  const isGranted = (dossierId) => localDossiers.some(d => String(d.id) === String(dossierId))
  const getPerms  = (dossierId) => localDossiers.find(d => String(d.id) === String(dossierId))?.permissions
                                ?? { ajouter: false, modifier: false, supprimer: false }

  const toggleDossier = (dossier) => {
    setLocalDossiers(prev => {
      const exists = prev.some(d => String(d.id) === String(dossier.id))
      if (exists) return prev.filter(d => String(d.id) !== String(dossier.id))
      return [...prev, { id: dossier.id, nom: dossier.titre, permissions: { ajouter: false, modifier: false, supprimer: false } }]
    })
  }

  const togglePerm = (dossierId, key) => {
    setLocalDossiers(prev => prev.map(d =>
      String(d.id) === String(dossierId)
        ? { ...d, permissions: { ...d.permissions, [key]: !d.permissions[key] } }
        : d
    ))
  }

  if (dossiers.length === 0)
    return <p style={{ margin: 0, fontSize: 13, color: 'var(--text-tertiary)' }}>Aucun dossier disponible.</p>

  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 10 }}>
        <FolderOpen size={13} />Dossiers &amp; Permissions
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dossiers.map(d => {
          const granted = isGranted(d.id)
          const perms   = getPerms(d.id)
          return (
            <div key={d.id} style={{ border: `1px solid ${granted ? '#3B82F644' : 'var(--border)'}`, borderRadius: 10, padding: '10px 12px', background: granted ? '#3B82F608' : 'var(--bg)', transition: 'all 0.15s' }}>
              {/* Dossier row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" checked={granted} onChange={() => toggleDossier(d)}
                  style={{ width: 15, height: 15, accentColor: '#3B82F6', cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.titre}
                </span>
              </div>
              {/* Permission checkboxes (only when granted) */}
              {granted && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, paddingLeft: 25 }}>
                  {PERM_CHECKS.map(p => (
                    <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                      <input type="checkbox"
                        checked={perms[p.key] ?? false}
                        onChange={() => togglePerm(d.id, p.key)}
                        style={{ width: 13, height: 13, accentColor: p.color, cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: perms[p.key] ? p.color : 'var(--text-tertiary)', fontWeight: perms[p.key] ? 600 : 400 }}>
                        <p.Icon size={11} color={perms[p.key] ? p.color : 'var(--text-tertiary)'} />
                        {p.label}
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

// ─────────────────────────────────────────────────────────────────────────────
// CREATE MODAL
// ─────────────────────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated, dossiers, typeEmployes }) {
  const [form, setForm]               = useState({ prenom: '', nom: '', email: '', type_employe_id: '' })
  const [localDossiers, setLocalDossiers] = useState([])
  const [busy, setBusy]               = useState(false)
  const [error, setError]             = useState(null)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim()) {
      setError('Prénom, nom et email sont requis.'); return
    }
    setBusy(true); setError(null)
    try {
      // Resolve type name → DB id
      let typeId
      if (form.type_employe_id) {
        const existing = typeEmployes.find(t => t.nom === form.type_employe_id)
        typeId = existing?.id ?? (await api.post('/type-employes/', { nom: form.type_employe_id })).data.id
      }

      const username = form.email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') + '_' + Date.now().toString(36)
      const { data: reg } = await api.post('/register/', {
        username, email: form.email, prenom: form.prenom, nom: form.nom, type_employe_id: typeId,
      })

      const eid = reg.employe_id
      console.log('[CreateModal] registered employe_id:', eid)

      // Create permissions
      if (eid && localDossiers.length > 0) {
        const errs = []
        await Promise.all(localDossiers.map(async d => {
          const acces = permToAcces(d.permissions)
          try { await api.post('/permissions/', { employe_id: eid, dossier_id: Number(d.id), acces }) }
          catch (err) { errs.push(JSON.stringify(err.response?.data ?? 'unknown')); console.error('[CreateModal] perm error:', err.response?.data) }
        }))
        if (errs.length) { setError(`Compte créé, erreur permission : ${errs.join('; ')}`); setBusy(false); onCreated(); return }
      }

      // Pass back the new account info so parent can optimistically show it
      onCreated({
        employe_id: eid,
        dossiers: localDossiers.map(d => ({ id: d.id, nom: d.nom, permissions: d.permissions })),
      })
      onClose()
    } catch (err) {
      const d = err.response?.data
      setError(typeof d === 'object' ? JSON.stringify(d) : d?.detail || 'Erreur création')
    } finally { setBusy(false) }
  }

  const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 5 }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.18 }}
        style={{ width: '100%', maxWidth: 520, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-xl)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,212,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserPlus size={16} color="var(--accent)" />
          </div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Créer un compte</h3>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 20 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <select className="input" value={form.type_employe_id} onChange={set('type_employe_id')} style={{ fontSize: 13, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}>
                <option value="">— Sélectionner —</option>
                {PREDEFINED_TYPES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
            </div>
          </div>
          <DossierPermSection dossiers={dossiers} localDossiers={localDossiers} setLocalDossiers={setLocalDossiers} />
          {error && <p style={{ margin: 0, color: '#EF4444', fontSize: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.07)', borderRadius: 8 }}>{error}</p>}
        </form>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
          <button onClick={submit} disabled={busy} style={{ flex: 2, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#000', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: busy ? 0.7 : 1 }}>
            <UserPlus size={14} />{busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL
// KEY FIX: onDone(employeId, newDossiers) returns the saved data to the parent
// so the parent can update the table row IMMEDIATELY without waiting for reload.
// ─────────────────────────────────────────────────────────────────────────────

function EditModal({ employe, onClose, onDone, dossiers }) {
  // localDossiers: [{ id, nom, permissions: { ajouter, modifier, supprimer } }]
  const [localDossiers, setLocalDossiers] = useState(() =>
    (employe.dossiers || []).map(d => ({
      id:          d.dossier_id,
      nom:         d.titre,
      permissions: accesToPerm(d.acces),
    }))
  )
  const [busy, setBusy]   = useState(false)
  const [error, setError] = useState(null)

  // ── handleSavePermissions ─────────────────────────────────────────────────
  const handleSavePermissions = async () => {
    setBusy(true); setError(null)
    const eid = employe.id

    // current: { dossier_id → { permId, acces } }
    const current = {}
    ;(employe.dossiers || []).forEach(d => { current[d.dossier_id] = d })

    const oldSet = new Set(Object.keys(current).map(Number))
    const newSet = new Set(localDossiers.map(d => Number(d.id)))

    const toDelete = [...oldSet].filter(id => !newSet.has(id))
    const toCreate = [...newSet].filter(id => !oldSet.has(id))
    const toUpdate = [...newSet].filter(id => {
      if (!oldSet.has(id)) return false
      const newAcces = permToAcces(localDossiers.find(d => Number(d.id) === id).permissions)
      return current[id].acces !== newAcces
    })

    console.log('[EditModal] save — eid:', eid, '| create:', toCreate, '| update:', toUpdate, '| delete:', toDelete)

    const errs = []
    await Promise.all([
      ...toDelete.map(id =>
        api.delete(`/permissions/${current[id].permId}/`)
          .catch(e => { console.error('DELETE failed', e.response?.data); errs.push(e) })
      ),
      ...toUpdate.map(id => {
        const newAcces = permToAcces(localDossiers.find(d => Number(d.id) === id).permissions)
        return api.patch(`/permissions/${current[id].permId}/`, { acces: newAcces })
          .catch(e => { console.error('PATCH failed', e.response?.data); errs.push(e) })
      }),
      ...toCreate.map(id => {
        const entry  = localDossiers.find(d => Number(d.id) === id)
        const acces  = permToAcces(entry.permissions)
        console.log('[EditModal] POST /permissions/ — employe_id:', eid, 'dossier_id:', id, 'acces:', acces)
        return api.post('/permissions/', { employe_id: eid, dossier_id: id, acces })
          .catch(e => { console.error('POST failed', e.response?.data); errs.push(e) })
      }),
    ])

    if (errs.length) {
      const msg = errs.map(e => JSON.stringify(e.response?.data ?? 'erreur')).join('; ')
      setError(`Erreur(s) : ${msg}`)
      setBusy(false)
      return
    }

    console.log('SAVING DOSSIERS:', localDossiers) // DEBUG
    // ── CRITICAL: pass updated dossiers back so parent updates the table row IMMEDIATELY ──
    onDone(eid, localDossiers)   // parent calls setAccounts immediately, no API round-trip needed
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.18 }}
        style={{ width: '100%', maxWidth: 520, background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 20, boxShadow: 'var(--shadow-xl)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pencil size={15} color="#3B82F6" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Modifier les permissions</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {employe.prenom} {employe.nom} · {employe.user?.email ?? ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 20 }}>×</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <DossierPermSection dossiers={dossiers} localDossiers={localDossiers} setLocalDossiers={setLocalDossiers} />
          {error && <p style={{ margin: '12px 0 0', color: '#EF4444', fontSize: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.07)', borderRadius: 8 }}>{error}</p>}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, fontSize: 13 }}>Annuler</button>
          <button onClick={handleSavePermissions} disabled={busy} style={{ flex: 2, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', background: '#3B82F6', color: '#fff', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: busy ? 0.7 : 1 }}>
            <Pencil size={14} />{busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function Comptes() {
  const { dossiers } = useDossiers()

  // accounts = enriched employes: each has .dossiers [{ id, nom, permissions }]
  const [accounts, setAccounts]         = useState([])
  const [typeEmployes, setTypeEmployes] = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [showCreate, setShowCreate]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget]     = useState(null)

  // ── load: fetch employes + permissions, merge into accounts ────────────────
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const safe = async (url) => {
        const { data } = await api.get(url)
        return data.results ?? data
      }
      const [emps, perms, types] = await Promise.all([
        safe('/employes/'),
        safe('/permissions/'),
        safe('/type-employes/'),
      ])

      console.log('[Comptes] load — employes:', emps.length, '| permissions:', perms.length)

      // Build map: employe_id → [permission objects]
      const permsMap = {}
      perms.forEach(p => {
        const eid = p.employe?.id ?? p.employe
        if (eid == null) return
        if (!permsMap[eid]) permsMap[eid] = []
        permsMap[eid].push(p)
      })

      // Merge into accounts, giving each a .dossiers array with the shape
      // that the table and editModal expect: [{ id, nom, permissions: { ajouter, modifier, supprimer } }]
      const merged = emps.map(emp => {
        const empPerms = permsMap[emp.id] || []
        return {
          ...emp,
          // keep the raw form too so EditModal can compute diffs (needs dossier_id, permId, acces)
          _rawDossiers: empPerms.map(p => ({
            permId:     p.id,
            dossier_id: typeof p.dossier === 'object' ? p.dossier?.id : p.dossier,
            titre:      p.dossier_titre || `Dossier #${typeof p.dossier === 'object' ? p.dossier?.id : p.dossier}`,
            acces:      p.acces,
          })),
          // display form used by the table
          dossiers: empPerms.map(p => {
            const did   = typeof p.dossier === 'object' ? p.dossier?.id : p.dossier
            const titre = p.dossier_titre || `Dossier #${did}`
            return { id: did, nom: titre, permissions: accesToPerm(p.acces) }
          }),
        }
      })

      console.log('[Comptes] merged accounts:', merged.map(a => ({ name: `${a.prenom} ${a.nom}`, dossiers: a.dossiers.length })))

      setAccounts(merged)
      setTypeEmployes(types)
    } catch (err) {
      console.error('[Comptes] load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    console.log('[Comptes] dossiers from context:', dossiers.map(d => d.titre))
  }, [dossiers])

  useEffect(() => {
    console.log('ACCOUNTS STATE:', JSON.stringify(accounts.map(a => ({ id: a.id, name: `${a.prenom} ${a.nom}`, dossiers: a.dossiers?.length })), null, 2))
  }, [accounts])

  // ── handleSavePermissions: IMMEDIATE optimistic update, no reload needed ───
  //
  // EditModal calls onDone(employeId, localDossiers) where localDossiers is
  // [{ id, nom, permissions: { ajouter, modifier, supprimer } }]
  //
  const handleSavePermissions = useCallback((employeId, updatedDossiers) => {
    console.log('RECEIVED UPDATED ACCOUNT:', employeId, updatedDossiers) // DEBUG

    setAccounts(prev => {
      const newAccounts = prev.map(acc => {
        if (acc.id !== employeId) return acc
        const newRaw = updatedDossiers.map(d => ({
          permId:     acc._rawDossiers?.find(r => Number(r.dossier_id) === Number(d.id))?.permId ?? null,
          dossier_id: Number(d.id),
          titre:      d.nom,
          acces:      permToAcces(d.permissions),
        }))
        return { ...acc, dossiers: updatedDossiers, _rawDossiers: newRaw }
      })
      console.log('NEW ACCOUNTS ARRAY:', newAccounts.map(a => ({ id: a.id, name: `${a.prenom} ${a.nom}`, dossiers: a.dossiers?.length }))) // DEBUG
      return newAccounts
    })

    // Reload after 2s to sync permIds from DB (delayed to avoid race condition)
    setTimeout(() => load(), 2000)
  }, [load])

  // ── handleDeleted ──────────────────────────────────────────────────────────
  const handleDeleted = useCallback((id) => {
    setAccounts(prev => prev.filter(a => a.id !== id))
  }, [])

  // ── handleCreated: reload to get the full account with DB-assigned IDs ─────
  const handleCreated = useCallback(() => {
    load()
  }, [load])

  // ── editTarget with _rawDossiers mapped to the shape EditModal uses ─────────
  // EditModal still needs the old .dossiers shape (dossier_id, permId, acces, titre)
  const editTargetForModal = editTarget
    ? { ...editTarget, dossiers: editTarget._rawDossiers ?? [] }
    : null

  const filtered = accounts.filter(a =>
    `${a.prenom} ${a.nom} ${a.user?.email ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )

  const colHdr = { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase' }
  const cols   = '2.2fr 1fr 1.6fr 2fr 76px'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Comptes" />
        <main style={{ flex: 1, padding: '28px 32px 48px', overflowY: 'auto' }}>

          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 2px' }}>Comptes</h1>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>{accounts.length} compte(s)</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round"
                  style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ paddingLeft: 34, width: 200, fontSize: 13 }} />
              </div>
              <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', background: 'var(--accent)', color: '#000', fontSize: 13, fontWeight: 600 }}>
                <UserPlus size={14} />Nouveau compte
              </button>
            </div>
          </div>

          {/* ── Table ── */}
          {loading ? (
            <div className="surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div className="surface" style={{ padding: 56, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
              {search ? 'Aucun résultat' : 'Aucun compte enregistré'}
            </div>
          ) : (
            <div className="surface" style={{ overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                {['Employé', 'Type', 'Dossiers', 'Permissions'].map(h => <span key={h} style={colHdr}>{h}</span>)}
                <span />
              </div>

              {/* Data rows */}
              {filtered.map((acc, i) => {
                // acc.dossiers = [{ id, nom, permissions: { ajouter, modifier, supprimer } }]
                const acDossiers = acc.dossiers || []
                return (
                  <motion.div key={acc.id}
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    style={{ display: 'grid', gridTemplateColumns: cols, gap: 12, alignItems: 'center', padding: '13px 18px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* EMPLOYÉ */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar name={`${acc.prenom} ${acc.nom}`} size={34} />
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{acc.prenom} {acc.nom}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-tertiary)' }}>{acc.user?.email ?? '—'}</div>
                      </div>
                    </div>

                    {/* TYPE */}
                    <div>
                      {acc.type_employe ? <TypeBadge label={acc.type_employe.nom} /> : <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>—</span>}
                    </div>

                    {/* DOSSIERS column: one chip per line, aligned with permissions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {acDossiers.length > 0
                        ? acDossiers.map(d => (
                            <div key={d.id} style={{ height: 24, display: 'flex', alignItems: 'center' }}>
                              <Chip label={d.nom} />
                            </div>
                          ))
                        : <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Aucun</span>
                      }
                    </div>

                    {/* PERMISSIONS column: icons per dossier, same line height as chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {acDossiers.length > 0
                        ? acDossiers.map(d => {
                            const acces = permToAcces(d.permissions)
                            const icons = ACCES_ICONS[acces] || ACCES_ICONS.lecture
                            return (
                              <div key={d.id} style={{ height: 24, display: 'flex', gap: 4, alignItems: 'center' }}>
                                {icons.map(ic => (
                                  <span key={ic.label} title={ic.label} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 6, background: ic.color + '18' }}>
                                    <ic.Icon size={11} color={ic.color} />
                                  </span>
                                ))}
                              </div>
                            )
                          })
                        : <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>—</span>
                      }
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button onClick={() => setEditTarget(acc)} title="Modifier les permissions" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(59,130,246,0.2)', background: 'rgba(59,130,246,0.06)', color: '#3B82F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.14)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.06)'; e.currentTarget.style.borderColor = 'rgba(59,130,246,0.2)' }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteTarget(acc)} title="Supprimer" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.14)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreated={handleCreated}
            dossiers={dossiers}
            typeEmployes={typeEmployes}
          />
        )}
        {editTargetForModal && (
          <EditModal
            employe={editTargetForModal}
            onClose={() => setEditTarget(null)}
            onDone={handleSavePermissions}
            dossiers={dossiers}
          />
        )}
        {deleteTarget && (
          <DeleteModal
            employe={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onDeleted={handleDeleted}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
