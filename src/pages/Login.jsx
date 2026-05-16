import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const GOOGLE_CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID    || ''
const DJANGO_URL          = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
const GITHUB_CLIENT_ID    = import.meta.env.VITE_GITHUB_CLIENT_ID    || ''
const ORIGIN   = typeof window !== 'undefined' ? window.location.origin : ''
const REDIRECT = `${ORIGIN}/auth/callback`

// Google callback goes to Django (already authorized in Google Cloud Console).
// The stateless view at /accounts/google/login/callback/ exchanges the code
// and redirects to React with JWT — no allauth session state needed.
const GOOGLE_DJANGO_CB = `${DJANGO_URL}/accounts/google/login/callback/`

const oauthUrls = {
  google: GOOGLE_CLIENT_ID
    ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_DJANGO_CB)}&response_type=code&scope=openid%20email%20profile&access_type=online&prompt=select_account`
    : null,
  microsoft: MICROSOFT_CLIENT_ID
    ? `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT)}&scope=openid%20email%20profile`
    : null,
  github: GITHUB_CLIENT_ID
    ? `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&scope=user:email`
    : null,
}

/* ─── Animated orb canvas ────────────────────────────────────────────── */
function OrbCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')
    let raf, t = 0
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize()
    window.addEventListener('resize', resize)
    const orbs = [
      { x: 0.15, y: 0.25, r: 0.38, speed: 0.0004, color: [99, 102, 241] },
      { x: 0.80, y: 0.70, r: 0.30, speed: 0.0006, color: [16, 185, 129] },
      { x: 0.55, y: 0.10, r: 0.22, speed: 0.0008, color: [245, 158, 11] },
    ]
    const draw = () => {
      t++
      ctx.clearRect(0, 0, c.width, c.height)
      orbs.forEach((o, i) => {
        const px = (o.x + Math.sin(t * o.speed + i) * 0.10) * c.width
        const py = (o.y + Math.cos(t * o.speed + i * 1.3) * 0.08) * c.height
        const grad = ctx.createRadialGradient(px, py, 0, px, py, o.r * Math.min(c.width, c.height))
        const [r, g, b] = o.color
        grad.addColorStop(0, `rgba(${r},${g},${b},0.28)`)
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, c.width, c.height)
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

/* ─── Google official sign-in button ─────────────────────────────────── */
function GoogleSignInButton() {
  const [hover, setHover] = useState(false)
  const [press, setPress] = useState(false)
  return (
    <a
      href={oauthUrls.google}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false) }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, width: '100%', padding: '13px 20px',
        background: hover ? (press ? '#e8eaed' : '#f8f9fa') : '#fff',
        border: '1px solid #dadce0', borderRadius: 24,
        textDecoration: 'none',
        fontFamily: "'Google Sans', Roboto, 'DM Sans', sans-serif",
        fontSize: 15, fontWeight: 500, color: '#3c4043',
        cursor: 'pointer',
        transition: 'background 0.18s, box-shadow 0.18s, transform 0.1s',
        boxShadow: hover
          ? '0 2px 8px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.08)',
        transform: press ? 'scale(0.985)' : hover ? 'translateY(-1px)' : 'none',
        userSelect: 'none',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      Se connecter avec Google
    </a>
  )
}

/* ─── Secondary OAuth provider button (dark variant) ─────────────────── */
function ProviderButton({ id, label, icon }) {
  const [hover, setHover] = useState(false)
  if (!oauthUrls[id]) return null
  return (
    <a
      href={oauthUrls[id]}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '11px 16px',
        background: hover ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.14)', borderRadius: 14,
        color: 'rgba(255,255,255,0.85)',
        textDecoration: 'none', fontSize: 13.5, fontWeight: 500,
        transition: 'all 0.15s ease', flex: 1,
      }}
    >
      {icon} {label}
    </a>
  )
}

const MSIcon = (
  <svg width="16" height="16" viewBox="0 0 21 21">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
)
const GHIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85 0 1.33-.01 2.41-.01 2.74 0 .27.18.58.69.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z"/>
  </svg>
)

/* ─── Main Login Component ───────────────────────────────────────────── */
export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [mode, setMode]             = useState('main') // 'main' | 'email'

  useEffect(() => {
    const p = new URLSearchParams(location.search)
    if (p.get('error') === 'google_failed') {
      const detail = p.get('detail')
      setError(detail ? `OAuth échoué: ${detail}` : 'Connexion Google échouée. Réessayez.')
      setMode('email')
    }
  }, [location])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const me = await login(identifier.trim(), password)
      navigate(me?.role === 'admin' ? '/admin' : '/employe', { replace: true })
    } catch (err) {
      setError(
        err.response?.status === 401 ? 'Identifiant ou mot de passe incorrect.' :
        err.response?.status === 403 ? 'Compte verrouillé. Réessayez dans 1 heure.' :
        'Erreur de connexion. Vérifiez votre réseau.'
      )
    } finally { setLoading(false) }
  }

  const hasSecondary = oauthUrls.microsoft || oauthUrls.github

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font)' }}>
      <style>{`
        @media (min-width: 900px) { .login-hero { display: flex !important; } }
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        @keyframes grain {
          0%,100%{ transform:translate(0,0) }
          20%{ transform:translate(-2%,-3%) }
          40%{ transform:translate(3%,-1%) }
          60%{ transform:translate(-1%,2%) }
          80%{ transform:translate(2%,1%) }
        }
        .grain-layer::after {
          content:''; position:absolute; inset:-50%; width:200%; height:200%;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity:0.045; animation:grain 7s steps(10) infinite; pointer-events:none;
        }
        .input-modern {
          width:100%; padding:12px 16px 12px 42px;
          background:#F8F9FB; border:1.5px solid #E4E7EC; border-radius:12px;
          color:#1a1a2e; font-family:var(--font); font-size:15px; outline:none;
          transition:border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .input-modern::placeholder { color:#adb5bd; }
        .input-modern:focus {
          border-color:#6366f1;
          box-shadow:0 0 0 3px rgba(99,102,241,0.12);
          background:#fff;
        }
        .btn-submit {
          width:100%; padding:13px 20px;
          background:linear-gradient(135deg,#6366f1,#4f46e5);
          color:#fff; border:none; border-radius:14px;
          font-family:var(--font); font-size:15px; font-weight:600;
          cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;
          transition:all 0.2s; box-shadow:0 4px 14px rgba(99,102,241,0.38);
        }
        .btn-submit:hover:not(:disabled) {
          transform:translateY(-1px); box-shadow:0 6px 20px rgba(99,102,241,0.48);
        }
        .btn-submit:active:not(:disabled) { transform:scale(0.985); }
        .btn-submit:disabled { opacity:0.5; cursor:not-allowed; }
        .back-btn {
          display:inline-flex; align-items:center; gap:6px;
          color:#6b7280; font-size:13.5px; font-weight:500;
          background:none; border:none; cursor:pointer; padding:0;
          font-family:var(--font); transition:color 0.15s;
        }
        .back-btn:hover { color:#374151; }
        .divider { flex:1; height:1px; background:linear-gradient(90deg,transparent,rgba(0,0,0,0.1),transparent); }
        .feature-pill {
          display:inline-flex; align-items:center; gap:9px;
          background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12);
          border-radius:99px; padding:7px 16px;
          color:rgba(255,255,255,0.75); font-size:13px; font-weight:500;
        }
      `}</style>

      {/* ── LEFT HERO ─────────────────────────────────────────────── */}
      <motion.div
        className="login-hero grain-layer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          flex: 1, display: 'none', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(145deg, #0f0c29 0%, #1a1040 50%, #24243e 100%)',
          flexDirection: 'column', justifyContent: 'space-between',
          padding: '52px 60px',
        }}
      >
        <OrbCanvas />

        {/* Grid overlay */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.05 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="g" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>

        {/* Logo */}
        <motion.div
          initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.2, duration:0.6 }}
          style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:10 }}
        >
          <div style={{
            width:38, height:38, borderRadius:12,
            background:'linear-gradient(135deg,#6366f1,#4f46e5)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 4px 14px rgba(99,102,241,0.5)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="13" y2="17"/>
            </svg>
          </div>
          <span style={{ color:'white', fontWeight:700, fontSize:18, letterSpacing:'-0.02em' }}>IDMS</span>
        </motion.div>

        {/* Hero text */}
        <motion.div
          initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.35, duration:0.8, ease:[0.22,1,0.36,1] }}
          style={{ position:'relative', zIndex:2 }}
        >
          <h1 style={{
            color:'white', fontSize:50, fontWeight:300,
            lineHeight:1.08, letterSpacing:'-0.04em',
            fontFamily:'var(--font-serif)', marginBottom:20,
          }}>
            Documents.<br/>
            <em style={{ color:'rgba(165,155,255,0.9)' }}>Intelligemment</em><br/>
            gérés.
          </h1>
          <p style={{ color:'rgba(255,255,255,0.46)', fontSize:15, lineHeight:1.65, maxWidth:340 }}>
            Plateforme unifiée pour les flux documentaires, les permissions d'équipe et l'analyse IA.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
          transition={{ delay:0.55 }}
          style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', gap:10 }}
        >
          {[
            { label:'Analyse IA des documents',     dot:'#a5b4fc' },
            { label:"Contrôle d'accès par rôle",    dot:'#6ee7b7' },
            { label:'Notifications en temps réel',  dot:'#fcd34d' },
          ].map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }}
              transition={{ delay:0.65 + i*0.1 }}
              className="feature-pill"
            >
              <span style={{ width:6, height:6, borderRadius:'50%', background:f.dot, flexShrink:0 }} />
              {f.label}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── RIGHT FORM PANEL ──────────────────────────────────────── */}
      <div style={{
        width:'100%', maxWidth:500,
        display:'flex', flexDirection:'column', justifyContent:'center',
        padding:'48px 40px',
        background:'#FAFBFD',
        boxShadow:'-1px 0 0 rgba(0,0,0,0.06)',
        overflowY:'auto',
      }}>
        <motion.div
          initial={{ opacity:0, y:20 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
          style={{ maxWidth:380, margin:'0 auto', width:'100%' }}
        >
          <AnimatePresence mode="wait">

            {/* ── MAIN VIEW (Google first) ───────────────────── */}
            {mode === 'main' && (
              <motion.div
                key="main"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }} transition={{ duration:0.28 }}
              >
                {/* Mobile logo */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:28 }}>
                  <div style={{
                    width:32, height:32, borderRadius:10,
                    background:'linear-gradient(135deg,#6366f1,#4f46e5)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <span style={{ fontWeight:700, fontSize:17, letterSpacing:'-0.02em', color:'#1a1a2e' }}>IDMS</span>
                </div>

                <div style={{ textAlign:'center', marginBottom:32 }}>
                  <h2 style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.03em', color:'#1a1a2e', marginBottom:6 }}>
                    Bon retour 👋
                  </h2>
                  <p style={{ fontSize:14, color:'#6b7280' }}>
                    Accès réservé au personnel autorisé
                  </p>
                </div>

                {/* Primary: Google */}
                <div style={{ marginBottom: hasSecondary ? 12 : 24 }}>
                  <GoogleSignInButton />
                </div>

                {/* Secondary providers on dark strip */}
                {hasSecondary && (
                  <div style={{
                    display:'flex', gap:8, marginBottom:24,
                    background:'#1a1040', borderRadius:14, padding:4,
                  }}>
                    {oauthUrls.microsoft && <ProviderButton id="microsoft" label="Microsoft" icon={MSIcon} />}
                    {oauthUrls.github    && <ProviderButton id="github"    label="GitHub"    icon={GHIcon} />}
                  </div>
                )}

                {/* Divider */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                  <div className="divider" />
                  <span style={{ fontSize:12, color:'#9ca3af', fontWeight:500, whiteSpace:'nowrap' }}>
                    ou avec un mot de passe
                  </span>
                  <div className="divider" />
                </div>

                {/* Email login button */}
                <button
                  onClick={() => { setMode('email'); setError(null) }}
                  style={{
                    width:'100%', padding:'12px 20px',
                    background:'#fff', border:'1.5px solid #E4E7EC', borderRadius:14,
                    color:'#374151', fontSize:15, fontWeight:500,
                    fontFamily:'var(--font)', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#6366f1'; e.currentTarget.style.color='#4f46e5' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='#E4E7EC'; e.currentTarget.style.color='#374151' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                  Continuer avec email
                </button>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
                      style={{
                        marginTop:16, padding:'11px 14px',
                        background:'#fef2f2', border:'1px solid #fecaca',
                        borderRadius:12, color:'#b91c1c', fontSize:13.5,
                        display:'flex', alignItems:'center', gap:8,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p style={{ textAlign:'center', marginTop:32, fontSize:12, color:'#9ca3af', lineHeight:1.6 }}>
                  En vous connectant, vous acceptez les conditions d'utilisation<br/>du Système de Gestion Documentaire IDMS.
                </p>
              </motion.div>
            )}

            {/* ── EMAIL / PASSWORD VIEW ──────────────────────── */}
            {mode === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-20 }} transition={{ duration:0.28 }}
              >
                <button className="back-btn" onClick={() => { setMode('main'); setError(null) }}
                  style={{ marginBottom:28 }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Retour
                </button>

                <div style={{ marginBottom:28 }}>
                  <h2 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.03em', color:'#1a1a2e', marginBottom:5 }}>
                    Connexion par email
                  </h2>
                  <p style={{ fontSize:14, color:'#6b7280' }}>Entrez vos identifiants IDMS</p>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* Identifier */}
                  <div style={{ marginBottom:14 }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:7, letterSpacing:'0.01em' }}>
                      Identifiant ou email
                    </label>
                    <div style={{ position:'relative' }}>
                      <input
                        className="input-modern"
                        type="text" value={identifier}
                        onChange={e => setIdentifier(e.target.value)}
                        placeholder="nom_utilisateur ou email@domaine.com"
                        required autoComplete="username"
                      />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round"
                        style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  </div>

                  {/* Password */}
                  <div style={{ marginBottom:22 }}>
                    <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#374151', marginBottom:7, letterSpacing:'0.01em' }}>
                      Mot de passe
                    </label>
                    <div style={{ position:'relative' }}>
                      <input
                        className="input-modern"
                        type={showPass ? 'text' : 'password'}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" required autoComplete="current-password"
                        style={{ paddingRight:44 }}
                      />
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#adb5bd" strokeWidth="2" strokeLinecap="round"
                        style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}>
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                        style={{
                          position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                          background:'none', border:'none', cursor:'pointer', padding:4,
                          color:'#9ca3af', display:'flex', alignItems:'center',
                        }}
                      >
                        {showPass
                          ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                        exit={{ opacity:0, height:0 }}
                        style={{ overflow:'hidden', marginBottom:16 }}
                      >
                        <div style={{
                          padding:'10px 14px', borderRadius:12,
                          background:'#fef2f2', border:'1px solid #fecaca',
                          color:'#b91c1c', fontSize:13.5,
                          display:'flex', alignItems:'center', gap:8,
                        }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          {error}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? (
                      <>
                        <span style={{ width:16, height:16, border:'2.5px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'loginSpin 0.7s linear infinite', display:'inline-block' }} />
                        Connexion…
                      </>
                    ) : (
                      <>
                        Se connecter
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div style={{ marginTop:20, textAlign:'center' }}>
                  <a
                    href={oauthUrls.google}
                    style={{ fontSize:13.5, color:'#6366f1', textDecoration:'none', fontWeight:500 }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration='underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration='none'}
                  >
                    Plutôt se connecter avec Google →
                  </a>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
