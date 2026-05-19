import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SFIcon from '../components/SFIcon'

const DJANGO_URL          = import.meta.env.VITE_API_URL        || 'http://localhost:8000'
const GOOGLE_CLIENT_ID    = import.meta.env.VITE_GOOGLE_CLIENT_ID    || ''
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID || ''
const GITHUB_CLIENT_ID    = import.meta.env.VITE_GITHUB_CLIENT_ID    || ''
const ORIGIN   = typeof window !== 'undefined' ? window.location.origin : ''
const REDIRECT = `${ORIGIN}/auth/callback`
const GOOGLE_CB = `${DJANGO_URL}/accounts/google/login/callback/`

const oauthUrls = {
  google:    GOOGLE_CLIENT_ID    ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_CB)}&response_type=code&scope=openid%20email%20profile&access_type=online&prompt=select_account` : null,
  microsoft: MICROSOFT_CLIENT_ID ? `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${MICROSOFT_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT)}&scope=openid%20email%20profile` : null,
  github:    GITHUB_CLIENT_ID    ? `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&scope=user:email` : null,
}

/* ── Animated orb canvas ── */
function OrbCanvas() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); let raf, t = 0
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const orbs = [
      { x:0.18, y:0.28, r:0.42, s:0.0004, rgb:[99,102,241]  },
      { x:0.80, y:0.65, r:0.32, s:0.0006, rgb:[20,184,166]  },
      { x:0.50, y:0.05, r:0.22, s:0.0008, rgb:[99,102,241]  },
    ]
    const draw = () => {
      t++; ctx.clearRect(0,0,c.width,c.height)
      orbs.forEach((o,i) => {
        const px = (o.x + Math.sin(t*o.s+i)*0.10)*c.width
        const py = (o.y + Math.cos(t*o.s+i*1.3)*0.08)*c.height
        const g  = ctx.createRadialGradient(px,py,0,px,py,o.r*Math.min(c.width,c.height))
        const [r,gr,b] = o.rgb
        g.addColorStop(0, `rgba(${r},${gr},${b},0.22)`)
        g.addColorStop(1, `rgba(${r},${gr},${b},0)`)
        ctx.fillStyle = g; ctx.fillRect(0,0,c.width,c.height)
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} />
}

/* ── Dot grid canvas ── */
function DotGrid() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d'); let raf, t = 0
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const COLS=14, ROWS=18
    const draw = () => {
      t += 0.013; ctx.clearRect(0,0,c.width,c.height)
      const cw = c.width/COLS, ch = c.height/ROWS
      for (let col=0; col<=COLS; col++) {
        for (let row=0; row<=ROWS; row++) {
          const d = Math.sin(t+col*0.4)*Math.cos(t*0.7+row*0.3)
          const opacity = (d+1)/2*0.16
          ctx.beginPath(); ctx.arc(col*cw, row*ch, 1.1, 0, Math.PI*2)
          ctx.fillStyle = `rgba(99,102,241,${opacity})`; ctx.fill()
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}} />
}

/* ── Input field ── */
function InputField({ label, type='text', value, onChange, placeholder, iconName, autoComplete }) {
  const [focused, setFocused] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const actualType = type === 'password' ? (showPass ? 'text' : 'password') : type
  return (
    <div style={{marginBottom:14}}>
      <label style={{display:'block', fontSize:11, fontWeight:700, color:'var(--text-secondary)', marginBottom:6, letterSpacing:'0.06em', textTransform:'uppercase'}}>
        {label}
      </label>
      <div style={{position:'relative'}}>
        <div style={{position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: focused ? 'var(--accent-bright)' : 'var(--text-tertiary)', pointerEvents:'none', transition:'color 0.12s', display:'flex'}}>
          <SFIcon name={iconName} size={14} />
        </div>
        <input
          type={actualType} value={value} onChange={onChange}
          placeholder={placeholder} required autoComplete={autoComplete}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width:'100%',
            padding: type==='password' ? '11px 40px 11px 38px' : '11px 14px 11px 38px',
            background: focused ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
            border:`1px solid ${focused ? 'var(--accent)' : 'rgba(255,255,255,0.10)'}`,
            borderRadius:10, color:'var(--text-primary)',
            fontSize:14, fontFamily:'var(--font-body)', outline:'none',
            boxShadow: focused ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none',
            transition:'all 0.15s',
          }}
        />
        {type === 'password' && (
          <button type="button" tabIndex={-1} onClick={() => setShowPass(v=>!v)}
            style={{position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-tertiary)', display:'flex', padding:0, transition:'color 0.1s'}}
            onMouseEnter={e=>e.currentTarget.style.color='var(--text-secondary)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--text-tertiary)'}
          >
            <SFIcon name={showPass ? 'eyeOff' : 'eye'} size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── OAuth button ── */
function OAuthBtn({ href, logo, label, full=false }) {
  return (
    <a href={href} style={{textDecoration:'none', display:'block', flex: full ? undefined : 1}}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        width:'100%', padding: full ? '12px 20px' : '11px',
        background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.10)',
        borderRadius:10, cursor:'pointer', fontSize: full ? 14 : 12,
        fontWeight:500, color:'var(--text-primary)', transition:'all 0.14s',
      }}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.09)';e.currentTarget.style.borderColor='rgba(255,255,255,0.16)';e.currentTarget.style.transform='translateY(-1px)'}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.borderColor='rgba(255,255,255,0.10)';e.currentTarget.style.transform='translateY(0)'}}
      >
        {logo}
        {full && label}
        {!full && <span style={{color:'var(--text-secondary)', fontSize:12}}>{label}</span>}
      </div>
    </a>
  )
}

const GoogleLogo = (
  <svg width="17" height="17" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)
const MsLogo = (
  <svg width="15" height="15" viewBox="0 0 23 23">
    <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
    <rect x="12" y="1" width="10" height="10" fill="#7FBA00"/>
    <rect x="1" y="12" width="10" height="10" fill="#00A4EF"/>
    <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
  </svg>
)
const GhLogo = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--text-secondary)">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
)

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [mode, setMode]           = useState('main')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const user = await login(identifier, password)
      navigate(user.role === 'admin' ? '/admin' : '/employe/dashboard', {replace:true})
    } catch(err) {
      setError(err?.response?.data?.detail || err?.response?.data?.error || 'Identifiants invalides.')
    } finally { setLoading(false) }
  }

  const FEATURES = [
    { icon:'stack',       label:'Gestion documentaire centralisée',  color:'#818CF8' },
    { icon:'personBadge', label:'Contrôle d\'accès par rôle',        color:'#34D399' },
    { icon:'bell',        label:'Notifications en temps réel',       color:'#FBBF24' },
    { icon:'chartBar',    label:'Analyse IA des documents',          color:'#F87171' },
  ]

  return (
    <div style={{display:'flex', minHeight:'100vh', background:'var(--bg-base)'}}>

      {/* ── LEFT PANEL ── */}
      <div style={{flex:1, position:'relative', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 64px', overflow:'hidden', background:'linear-gradient(135deg,#080C14 0%,#0D1220 50%,#0A0E1A 100%)'}}>
        <OrbCanvas />
        <DotGrid />

        {/* Logo */}
        <motion.div initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:0.6}}
          style={{position:'absolute', top:30, left:64, display:'flex', alignItems:'center', gap:10, zIndex:2}}>
          <div style={{width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366F1,#818CF8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 24px rgba(99,102,241,0.5)'}}>
            <SFIcon name="doc" size={16} color="white" strokeWidth={2} />
          </div>
          <div>
            <div style={{fontSize:14, fontWeight:700, fontFamily:'var(--font-display)', color:'#fff', letterSpacing:'-0.03em', lineHeight:1}}>IDMS</div>
            <div style={{fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', textTransform:'uppercase', marginTop:1}}>Platform</div>
          </div>
        </motion.div>

        {/* Hero */}
        <div style={{position:'relative', zIndex:2}}>
          <motion.div initial={{opacity:0,y:32}} animate={{opacity:1,y:0}} transition={{delay:0.2, duration:0.8, ease:[0.16,1,0.3,1]}}>
            <div style={{display:'inline-flex', alignItems:'center', gap:7, padding:'5px 12px', borderRadius:99, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)', marginBottom:26}}>
              <div style={{width:6, height:6, borderRadius:'50%', background:'var(--accent)', animation:'live-pulse 2s infinite'}} />
              <span style={{fontSize:10, fontWeight:700, color:'var(--accent-bright)', letterSpacing:'0.09em'}}>SYSTÈME ACTIF</span>
            </div>
            <h1 style={{fontSize:50, fontWeight:700, lineHeight:1.06, letterSpacing:'-0.04em', marginBottom:18, fontFamily:'var(--font-display)', background:'linear-gradient(135deg,#fff 0%,rgba(255,255,255,0.65) 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>
              Documents.<br/>
              <span style={{background:'linear-gradient(135deg,#818CF8 0%,#14B8A6 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>Intelligemment</span>
              <br/>gérés.
            </h1>
            <p style={{color:'rgba(255,255,255,0.38)', fontSize:14, lineHeight:1.7, maxWidth:320}}>
              Plateforme unifiée pour les flux documentaires, le contrôle d'accès et l'analyse IA.
            </p>
          </motion.div>

          {/* Feature list */}
          <div style={{display:'flex', flexDirection:'column', gap:9, marginTop:36}}>
            {FEATURES.map((f,i) => (
              <motion.div key={f.label}
                initial={{opacity:0, x:-16}} animate={{opacity:1, x:0}}
                transition={{delay:0.65+i*0.1, ease:[0.16,1,0.3,1]}}
                style={{display:'inline-flex', alignItems:'center', gap:10, padding:'8px 14px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:99, width:'fit-content'}}
              >
                <div style={{width:22, height:22, borderRadius:7, background:`${f.color}18`, border:`1px solid ${f.color}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <SFIcon name={f.icon} size={12} color={f.color} strokeWidth={1.8} />
                </div>
                <span style={{fontSize:12, color:'rgba(255,255,255,0.58)', fontWeight:500}}>{f.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1}}
          style={{position:'absolute', bottom:28, left:64, zIndex:2}}>
          <div style={{fontSize:11, color:'rgba(255,255,255,0.18)', letterSpacing:'0.05em'}}>© 2026 IDMS Platform — Accès réservé</div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <motion.div
        initial={{opacity:0, x:40}} animate={{opacity:1, x:0}}
        transition={{duration:0.5, ease:[0.16,1,0.3,1]}}
        style={{width:'100%', maxWidth:460, display:'flex', flexDirection:'column', justifyContent:'center', padding:'48px 44px', background:'var(--bg-surface)', borderLeft:'1px solid rgba(255,255,255,0.06)', overflowY:'auto'}}
      >
        <div style={{maxWidth:340, margin:'0 auto', width:'100%'}}>
          <AnimatePresence mode="wait">

            {/* MAIN mode */}
            {mode === 'main' && (
              <motion.div key="main" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.22}}>
                <div style={{marginBottom:30}}>
                  <h2 style={{fontFamily:'var(--font-display)', fontSize:26, fontWeight:700, letterSpacing:'-0.04em', color:'var(--text-primary)', marginBottom:7}}>Bon retour</h2>
                  <p style={{fontSize:13, color:'var(--text-secondary)', lineHeight:1.55}}>Accès réservé au personnel autorisé.</p>
                </div>

                {/* Google OAuth */}
                {oauthUrls.google && (
                  <div style={{marginBottom:9}}>
                    <OAuthBtn href={oauthUrls.google} logo={GoogleLogo} label="Continuer avec Google" full />
                  </div>
                )}

                {/* MS + GitHub */}
                {(oauthUrls.microsoft || oauthUrls.github) && (
                  <div style={{display:'flex', gap:8, marginBottom:9}}>
                    {oauthUrls.microsoft && <OAuthBtn href={oauthUrls.microsoft} logo={MsLogo} label="Microsoft" />}
                    {oauthUrls.github    && <OAuthBtn href={oauthUrls.github}    logo={GhLogo} label="GitHub"    />}
                  </div>
                )}

                {/* Divider */}
                <div style={{display:'flex', alignItems:'center', gap:10, margin:'18px 0'}}>
                  <div style={{flex:1, height:1, background:'rgba(255,255,255,0.07)'}} />
                  <span style={{fontSize:10, color:'var(--text-tertiary)', fontWeight:600, letterSpacing:'0.08em'}}>OU</span>
                  <div style={{flex:1, height:1, background:'rgba(255,255,255,0.07)'}} />
                </div>

                {/* Email button */}
                <button onClick={() => { setMode('email'); setError(null) }} style={{
                  width:'100%', padding:'12px 20px',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                  background:'var(--accent)', border:'none', borderRadius:10,
                  color:'#fff', fontSize:14, fontWeight:500,
                  cursor:'pointer', transition:'all 0.14s',
                  boxShadow:'0 4px 20px rgba(99,102,241,0.3)',
                }}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-bright)';e.currentTarget.style.transform='translateY(-1px)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='var(--accent)';e.currentTarget.style.transform='translateY(0)'}}
                >
                  <SFIcon name="mail" size={15} color="white" strokeWidth={2} />
                  Continuer avec email
                </button>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{opacity:0,y:-8,height:0}} animate={{opacity:1,y:0,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden',marginTop:12}}>
                      <div style={{padding:'10px 13px', background:'var(--red-subtle)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, color:'#F87171', fontSize:12, display:'flex', alignItems:'center', gap:7}}>
                        <SFIcon name="warning" size={13} color="#F87171" />
                        {error}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p style={{textAlign:'center', marginTop:24, fontSize:11, color:'var(--text-tertiary)', lineHeight:1.7}}>
                  En vous connectant, vous acceptez les conditions d'utilisation du Système IDMS.
                </p>
              </motion.div>
            )}

            {/* EMAIL mode */}
            {mode === 'email' && (
              <motion.div key="email" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-16}} transition={{duration:0.22}}>
                <button onClick={() => { setMode('main'); setError(null) }}
                  style={{display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontSize:13, fontWeight:500, marginBottom:28, padding:0, transition:'color 0.1s'}}
                  onMouseEnter={e=>e.currentTarget.style.color='var(--text-primary)'}
                  onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}
                >
                  <SFIcon name="chevLeft" size={14} />
                  Retour
                </button>

                <div style={{marginBottom:26}}>
                  <h2 style={{fontFamily:'var(--font-display)', fontSize:23, fontWeight:700, letterSpacing:'-0.04em', color:'var(--text-primary)', marginBottom:5}}>Connexion</h2>
                  <p style={{fontSize:13, color:'var(--text-secondary)'}}>Entrez vos identifiants IDMS</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <InputField label="Identifiant ou email" value={identifier} onChange={e=>setIdentifier(e.target.value)}
                    placeholder="nom_utilisateur ou email" autoComplete="username" iconName="users" />
                  <InputField label="Mot de passe" type="password" value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password" iconName="lock" />

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} style={{overflow:'hidden', marginBottom:12}}>
                        <div style={{padding:'10px 13px', borderRadius:10, background:'var(--red-subtle)', border:'1px solid rgba(239,68,68,0.2)', color:'#F87171', fontSize:12, display:'flex', alignItems:'center', gap:7}}>
                          <SFIcon name="warning" size={13} color="#F87171" />
                          {error}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" disabled={loading} style={{
                    width:'100%', padding:'12px', marginTop:4,
                    display:'flex', alignItems:'center', justifyContent:'center', gap:9,
                    background: loading ? 'rgba(99,102,241,0.5)' : 'var(--accent)',
                    border:'none', borderRadius:10, color:'#fff', fontSize:14, fontWeight:500,
                    cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.14s',
                    boxShadow:'0 4px 20px rgba(99,102,241,0.3)',
                  }}
                    onMouseEnter={e=>{ if(!loading){e.currentTarget.style.background='var(--accent-bright)';e.currentTarget.style.transform='translateY(-1px)'}}}
                    onMouseLeave={e=>{ e.currentTarget.style.background=loading?'rgba(99,102,241,0.5)':'var(--accent)';e.currentTarget.style.transform='translateY(0)'}}
                  >
                    {loading ? (
                      <><span style={{width:15, height:15, border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0}} />Connexion…</>
                    ) : (
                      <>Se connecter <SFIcon name="arrowRight" size={14} color="white" strokeWidth={2.2} /></>
                    )}
                  </button>
                </form>

                {oauthUrls.google && (
                  <div style={{marginTop:18, textAlign:'center'}}>
                    <a href={oauthUrls.google} style={{fontSize:12, color:'var(--accent-bright)', fontWeight:500, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:5, transition:'opacity 0.1s'}}
                      onMouseEnter={e=>e.currentTarget.style.opacity='0.65'}
                      onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                    >
                      {GoogleLogo} Se connecter avec Google
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes live-pulse{0%,100%{opacity:1}50%{opacity:0.35}}`}</style>
    </div>
  )
}
