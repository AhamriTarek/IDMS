import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Trash2, CheckCircle2, AlertTriangle, Mail, Shield, User as UserIcon } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ProfileAvatar from '../components/ProfileAvatar'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED   = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

function Toast({ kind, message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200)
    return () => clearTimeout(t)
  }, [onDone])

  const isErr = kind === 'error'
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0  }}
      exit={{    opacity: 0, y: -10 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed', top: 70, right: 28, zIndex: 1200,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 16px',
        background: 'var(--bg-raised)',
        border: `1px solid ${isErr ? 'var(--red)' : 'var(--green)'}`,
        borderRadius: 12,
        boxShadow: 'var(--shadow-xl)',
        color: 'var(--text-primary)',
        fontSize: 13, fontWeight: 500,
        maxWidth: 360,
      }}
    >
      {isErr
        ? <AlertTriangle size={16} color="var(--red)" />
        : <CheckCircle2 size={16} color="var(--green)" />}
      <span>{message}</span>
    </motion.div>
  )
}

export default function Profile() {
  const { user, isAdmin, fetchMe } = useAuth()
  const fileInput                  = useRef(null)

  const [photoUrl, setPhotoUrl] = useState(user?.profile?.photo_url ?? null)
  const [preview, setPreview]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [toast, setToast]       = useState(null)

  // Re-sync local state whenever the auth user updates
  useEffect(() => {
    if (!preview) setPhotoUrl(user?.profile?.photo_url ?? null)
  }, [user?.profile?.photo_url, preview])

  // Revoke preview blob URL when it changes
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview) }
  }, [preview])

  const displayName = user?.profile?.prenom
    ? `${user.profile.prenom} ${user.profile.nom}`
    : user?.username ?? '—'
  const roleLabel = isAdmin ? 'Administrateur' : 'Employé'
  const email     = user?.email ?? user?.profile?.user?.email ?? '—'

  const upload = async (file) => {
    if (!ALLOWED.includes(file.type)) {
      setToast({ kind: 'error', message: 'Type invalide. JPG, PNG ou WEBP uniquement.' })
      return
    }
    if (file.size > MAX_BYTES) {
      setToast({ kind: 'error', message: 'Fichier trop volumineux (max 5 Mo).' })
      return
    }
    const blobUrl = URL.createObjectURL(file)
    setPreview(blobUrl)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const { data } = await api.post('/profile/photo/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotoUrl(data.photo_url)
      await fetchMe()
      setToast({ kind: 'success', message: 'Photo de profil mise à jour.' })
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de l’upload.'
      setToast({ kind: 'error', message: msg })
    } finally {
      setPreview(null)
      setLoading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) upload(f)
  }

  const handleDelete = async () => {
    if (!photoUrl) return
    setLoading(true)
    try {
      await api.delete('/profile/photo/')
      setPhotoUrl(null)
      await fetchMe()
      setToast({ kind: 'success', message: 'Photo supprimée.' })
    } catch (err) {
      setToast({ kind: 'error', message: 'Suppression échouée.' })
    } finally {
      setLoading(false)
    }
  }

  const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px' }
  const val = { fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar title="Mon Profil" />
        <main style={{ flex: 1, padding: '28px 32px 48px', overflowY: 'auto' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: '0 0 2px' }}>
                Mon Profil
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
                Gérez votre photo et vos informations personnelles.
              </p>
            </div>

            <div className="surface" style={{ padding: 28 }}>
              {/* Avatar + actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <ProfileAvatar
                    photoUrl={preview || photoUrl}
                    name={displayName}
                    size={128}
                    fontSize={42}
                    ring={false}
                    style={{ border: '4px solid var(--bg-raised)', boxShadow: 'var(--shadow-xl)' }}
                  />
                  {loading && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      background: 'rgba(0,0,0,0.45)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: '2.5px solid rgba(255,255,255,0.25)',
                        borderTopColor: '#fff',
                        animation: 'profSpin 0.85s linear infinite',
                      }} />
                      <style>{`@keyframes profSpin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {displayName}
                  </h2>
                  <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--text-tertiary)' }}>
                    {email}
                  </p>

                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFile}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => fileInput.current?.click()}
                      disabled={loading}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '9px 16px', borderRadius: 9, border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        background: 'var(--accent)', color: '#fff',
                        fontSize: 13, fontWeight: 600,
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      <Camera size={14} />
                      {photoUrl ? 'Changer la photo' : 'Ajouter une photo'}
                    </button>
                    {photoUrl && !loading && (
                      <button
                        onClick={handleDelete}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 7,
                          padding: '9px 16px', borderRadius: 9,
                          border: '1px solid rgba(239,68,68,0.25)',
                          background: 'rgba(239,68,68,0.07)',
                          color: 'var(--red)',
                          cursor: 'pointer',
                          fontSize: 13, fontWeight: 600,
                        }}
                      >
                        <Trash2 size={14} /> Supprimer
                      </button>
                    )}
                  </div>

                  <p style={{ margin: '12px 0 0', fontSize: 11.5, color: 'var(--text-tertiary)' }}>
                    JPG, PNG ou WEBP — 5 Mo maximum.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border)', margin: '28px 0' }} />

              {/* Identity rows */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 22 }}>
                <div>
                  <p style={lbl}><UserIcon size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Nom complet</p>
                  <p style={val}>{displayName}</p>
                </div>
                <div>
                  <p style={lbl}><Mail size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Email</p>
                  <p style={val}>{email}</p>
                </div>
                <div>
                  <p style={lbl}><Shield size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Rôle</p>
                  <p style={val}>{roleLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.message + toast.kind}
            kind={toast.kind}
            message={toast.message}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
