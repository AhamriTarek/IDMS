import React, { Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import CommandPalette from './components/CommandPalette'
import PageTransition from './components/PageTransition'

const Login                 = React.lazy(() => import('./pages/Login'))
const AdminDashboard        = React.lazy(() => import('./pages/AdminDashboard'))
const Dossiers              = React.lazy(() => import('./pages/Dossiers'))
const Comptes               = React.lazy(() => import('./pages/Comptes'))
const AdminNotifications    = React.lazy(() => import('./pages/Notifications'))
const AdminSoumissions      = React.lazy(() => import('./pages/admin/AdminSoumissions'))
const GoogleCallback        = React.lazy(() => import('./pages/GoogleCallback'))
const EmployeeDashboard     = React.lazy(() => import('./pages/employe/Dashboard'))
const EmployeeDossiers      = React.lazy(() => import('./pages/employe/Dossiers'))
const EmployeeSoumissions   = React.lazy(() => import('./pages/employe/Soumissions'))
const EmployeeNotifications = React.lazy(() => import('./pages/employe/Notifications'))

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg-base, #080C14)',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(99,102,241,0.15)', borderRadius: '50%' }} />
        <div style={{
          position: 'absolute', inset: 0,
          border: '2px solid transparent', borderTopColor: '#6366F1', borderRightColor: 'rgba(99,102,241,0.35)',
          borderRadius: '50%', animation: 'appSpin 0.8s linear infinite',
        }} />
      </div>
      <span style={{ fontSize: 12, color: 'rgba(139,150,176,0.6)', letterSpacing: '0.06em', fontFamily: 'Inter,sans-serif' }}>Chargement…</span>
      <style>{`@keyframes appSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employe/dashboard'} replace />
  }
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/employe/dashboard'} replace />
  return children
}

// Thin "keyboard shortcut hint" bar — shown once, dismissed with Escape
function ShortcutHint() {
  const [visible, setVisible] = React.useState(() => !localStorage.getItem('idms-cmd-hint'))
  const { user } = useAuth()
  React.useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => { setVisible(false); localStorage.setItem('idms-cmd-hint', '1') }, 6000)
    return () => clearTimeout(t)
  }, [visible])
  if (!visible || !user) return null
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 8000, padding: '10px 18px',
      background: 'rgba(15, 22, 35, 0.92)',
      border: '1px solid rgba(99,102,241,0.25)',
      borderRadius: 99, backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both',
    }}>
      <span style={{ fontSize: 12, color: 'rgba(139,150,176,0.9)' }}>Accès rapide :</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {['⌘', 'K'].map(k => (
          <kbd key={k} style={{ padding: '2px 7px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', fontSize: 11, color: '#818CF8', fontFamily: 'inherit' }}>{k}</kbd>
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'rgba(139,150,176,0.9)' }}>Palette de commandes</span>
      <button onClick={() => { setVisible(false); localStorage.setItem('idms-cmd-hint','1') }}
        style={{ background: 'none', border: 'none', color: 'rgba(74,85,104,0.8)', cursor: 'pointer', fontSize: 13, padding: 0, marginLeft: 4 }}>✕</button>
    </div>
  )
}

function AppInner() {
  const { toggleTheme } = useTheme()
  const location        = useLocation()

  return (
    <>
      <CommandPalette onThemeToggle={toggleTheme} />
      <ShortcutHint />

      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public */}
            <Route path="/" element={<PublicRoute><PageTransition><Login /></PageTransition></PublicRoute>} />
            <Route path="/auth/callback" element={<GoogleCallback />} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/dossiers" element={<ProtectedRoute requiredRole="admin"><PageTransition><Dossiers /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/comptes" element={<ProtectedRoute requiredRole="admin"><PageTransition><Comptes /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/soumissions" element={<ProtectedRoute requiredRole="admin"><PageTransition><AdminSoumissions /></PageTransition></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute requiredRole="admin"><PageTransition><AdminNotifications /></PageTransition></ProtectedRoute>} />

            {/* Employé */}
            <Route path="/employe" element={<Navigate to="/employe/dashboard" replace />} />
            <Route path="/employe/dashboard" element={<ProtectedRoute requiredRole="employe"><PageTransition><EmployeeDashboard /></PageTransition></ProtectedRoute>} />
            <Route path="/employe/dossiers" element={<ProtectedRoute requiredRole="employe"><PageTransition><EmployeeDossiers /></PageTransition></ProtectedRoute>} />
            <Route path="/employe/soumissions" element={<ProtectedRoute requiredRole="employe"><PageTransition><EmployeeSoumissions /></PageTransition></ProtectedRoute>} />
            <Route path="/employe/notifications" element={<ProtectedRoute requiredRole="employe"><PageTransition><EmployeeNotifications /></PageTransition></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  )
}
