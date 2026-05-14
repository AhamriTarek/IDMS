import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/axios'

export default function PermissionModal({ isOpen, onClose, employe, dossiers = [], existingPermissions = [] }) {
  const [dossier, setDossier]   = useState('')
  const [acces, setAcces]       = useState('lecture')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState(null)

  // Reset on open
  useEffect(() => {
    if (isOpen) { setDossier(''); setAcces('lecture'); setSuccess(false); setError(null) }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!dossier) { setError('Sélectionnez un dossier'); return }
    setLoading(true); setError(null)
    try {
      const existing = existingPermissions.find(p => p.dossier === Number(dossier))
      if (existing) {
        await api.patch(`/permissions/${existing.id}/`, { acces })
      } else {
        await api.post('/permissions/', { employe_id: employe?.id, dossier_id: Number(dossier), acces })
      }
      setSuccess(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Erreur lors de la mise à jour des permissions')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
    color: '#fff', padding: '0.6rem 0.875rem',
    fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
    outline: 'none', boxSizing: 'border-box',
  }

  const accesList = [
    { value: 'lecture',  label: '👁 Lecture',   desc: 'Peut voir les fichiers' },
    { value: 'ecriture', label: '✏️ Écriture',  desc: 'Peut modifier les fichiers' },
    { value: 'admin',    label: '🔑 Admin',      desc: 'Accès complet' },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
            }}
          />
          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            id="permission-modal"
            style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(13,21,38,0.97)',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 20,
              padding: '2rem',
              width: '94%', maxWidth: 440,
              zIndex: 1001,
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 40px rgba(0,212,255,0.06)',
            }}
          >
            <h2 style={{ margin: '0 0 0.25rem', fontFamily: '"Space Grotesk", sans-serif', color: '#fff', fontSize: '1.2rem' }}>
              Attribution de permission
            </h2>
            <p style={{ margin: '0 0 1.5rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
              Employé : <strong style={{ color: 'rgba(255,255,255,0.75)' }}>{employe?.prenom} {employe?.nom}</strong>
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                  Dossier *
                </label>
                <select value={dossier} onChange={e => setDossier(e.target.value)} required style={inputStyle}>
                  <option value="">-- Sélectionner un dossier --</option>
                  {dossiers.map(d => (
                    <option key={d.id} value={d.id}>{d.titre}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: 8, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                  Niveau d'accès *
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {accesList.map(a => (
                    <label key={a.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '0.6rem 0.875rem',
                      borderRadius: 10, cursor: 'pointer',
                      background: acces === a.value ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${acces === a.value ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.2s ease',
                    }}>
                      <input type="radio" value={a.value} checked={acces === a.value}
                        onChange={() => setAcces(a.value)} style={{ accentColor: '#00D4FF' }} />
                      <div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', color: '#fff', fontWeight: 500 }}>{a.label}</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{a.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {error && (
                <p style={{ margin: '0 0 1rem', color: '#EF4444', fontSize: '0.8rem', fontFamily: 'Inter, sans-serif',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '6px 12px' }}>
                  ⚠️ {error}
                </p>
              )}
              {success && (
                <p style={{ margin: '0 0 1rem', color: '#10B981', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif',
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                  ✓ Permission accordée avec succès !
                </p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={onClose} style={{
                  flex: 1, padding: '0.65rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '0.875rem', transition: 'all 0.2s',
                }}>
                  Annuler
                </button>
                <button type="submit" disabled={loading} style={{
                  flex: 1, padding: '0.65rem', borderRadius: 10, border: 'none',
                  background: loading ? 'rgba(0,212,255,0.3)' : 'linear-gradient(135deg, #00D4FF, #0099cc)',
                  color: '#0A0F1E', fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif', fontSize: '0.875rem',
                  boxShadow: '0 0 16px rgba(0,212,255,0.3)',
                  transition: 'all 0.2s',
                }}>
                  {loading ? '...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
