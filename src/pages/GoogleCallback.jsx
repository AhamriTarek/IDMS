import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api, { tokenStorage } from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function GoogleCallback() {
  const [searchParams]    = useSearchParams()
  const navigate          = useNavigate()
  const { fetchMe }       = useAuth()
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) { setError('Paramètre code manquant'); return }
    ;(async () => {
      try {
        const { data } = await api.post('/auth/google/', { code })
        tokenStorage.setTokens(data.access, data.refresh)
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`
        const user = await fetchMe()
        navigate(user?.role === 'admin' ? '/admin' : '/employe/dashboard', { replace: true })
      } catch { setError('Échec de l\'authentification Google. Réessayez.') }
    })()
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      {error ? (
        <>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Erreur d'authentification</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</div>
          <button onClick={() => navigate('/')} className="btn-primary" style={{ fontSize: 13 }}>Retour à la connexion</button>
        </>
      ) : (
        <>
          <div style={{ position: 'relative', width: 48, height: 48 }}>
            <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(99,102,241,0.15)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', inset: 0, border: '2px solid transparent', borderTopColor: '#6366F1', borderRightColor: 'rgba(99,102,241,0.35)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Connexion Google en cours…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </div>
  )
}
