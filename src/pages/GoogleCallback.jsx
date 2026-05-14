import React, { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { tokenStorage } from '../api/axios'

export default function GoogleCallback() {
  const navigate    = useNavigate()
  const location    = useLocation()
  const { fetchMe } = useAuth()
  const didRun      = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true

    const params = new URLSearchParams(location.search)

    // ── New flow: allauth → JWTRedirectView passes tokens directly in URL ──
    const access  = params.get('access')
    const refresh = params.get('refresh')

    if (access && refresh) {
      tokenStorage.setTokens(access, refresh)
      api.defaults.headers.common.Authorization = `Bearer ${access}`
      fetchMe()
        .then((user) => {
          navigate(user?.role === 'admin' ? '/admin' : '/employe', { replace: true })
        })
        .catch(() => navigate('/?error=google_failed', { replace: true }))
      return
    }

    // ── Legacy flow: code exchange (fallback) ──────────────────────────────
    const code  = params.get('code')
    const error = params.get('error')

    if (error) { navigate(`/?error=${encodeURIComponent(error)}`); return }
    if (!code)  { navigate('/'); return }

    fetch('/auth/google/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        redirect_uri: `${window.location.origin}/auth/callback`,
      }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d))
        return res.json()
      })
      .then(({ access, refresh }) => {
        tokenStorage.setTokens(access, refresh)
        api.defaults.headers.common.Authorization = `Bearer ${access}`
        return fetchMe()
      })
      .then((user) => {
        navigate(user?.role === 'admin' ? '/admin' : '/employe', { replace: true })
      })
      .catch((err) => {
        console.error('Google OAuth failed:', err)
        navigate('/?error=google_failed', { replace: true })
      })
  }, [location, navigate, fetchMe])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh',
      background: 'linear-gradient(145deg, #0f0c29, #1a1040, #24243e)',
      fontFamily: 'var(--font)',
      gap: 0,
    }}>
      <style>{`
        @keyframes gcSpin { to { transform: rotate(360deg); } }
        @keyframes gcPulse {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes gcFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48,
        animation: 'gcFadeUp 0.5s ease both',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(99,102,241,0.45)',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="13" y2="17"/>
          </svg>
        </div>
        <span style={{ color: 'white', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>IDMS</span>
      </div>

      {/* Spinner */}
      <div style={{
        position: 'relative', width: 64, height: 64, marginBottom: 28,
        animation: 'gcFadeUp 0.5s 0.1s ease both',
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '2px solid rgba(99,102,241,0.18)',
          borderRadius: '50%',
        }} />
        {/* Spinning ring */}
        <div style={{
          position: 'absolute', inset: 0,
          border: '2px solid transparent',
          borderTopColor: '#6366f1',
          borderRightColor: 'rgba(99,102,241,0.4)',
          borderRadius: '50%',
          animation: 'gcSpin 0.85s linear infinite',
        }} />
        {/* Google G inside */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ animation: 'gcPulse 2s ease infinite' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
      </div>

      {/* Status text */}
      <p style={{
        color: 'white', fontSize: 16, fontWeight: 600, marginBottom: 8,
        animation: 'gcFadeUp 0.5s 0.2s ease both', opacity: 0,
        animationFillMode: 'forwards',
      }}>
        Connexion en cours…
      </p>
      <p style={{
        color: 'rgba(255,255,255,0.42)', fontSize: 13.5, margin: 0,
        animation: 'gcFadeUp 0.5s 0.3s ease both', opacity: 0,
        animationFillMode: 'forwards',
      }}>
        Finalisation de l'authentification Google
      </p>
    </div>
  )
}
