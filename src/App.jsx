import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'

// Lazy-load pages for performance
const Login                 = React.lazy(() => import('./pages/Login'))
const AdminDashboard        = React.lazy(() => import('./pages/AdminDashboard'))
const Dossiers              = React.lazy(() => import('./pages/Dossiers'))
const Comptes               = React.lazy(() => import('./pages/Comptes'))
const AdminNotifications    = React.lazy(() => import('./pages/Notifications'))
const AdminSoumissions      = React.lazy(() => import('./pages/admin/AdminSoumissions'))
const GoogleCallback        = React.lazy(() => import('./pages/GoogleCallback'))

// Employee pages
const EmployeeDashboard     = React.lazy(() => import('./pages/employe/Dashboard'))
const EmployeeDossiers      = React.lazy(() => import('./pages/employe/Dossiers'))
const EmployeeSoumissions   = React.lazy(() => import('./pages/employe/Soumissions'))
const EmployeeNotifications = React.lazy(() => import('./pages/employe/Notifications'))

// ── Full-screen loader while lazy chunk loads ──────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #0f0c29, #1a1040, #24243e)',
    }}>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <div style={{
          position: 'absolute', inset: 0,
          border: '2px solid rgba(99,102,241,0.18)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          border: '2px solid transparent',
          borderTopColor: '#6366f1',
          borderRightColor: 'rgba(99,102,241,0.4)',
          borderRadius: '50%',
          animation: 'appSpin 0.85s linear infinite',
        }} />
      </div>
      <style>{`@keyframes appSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Protected Route wrapper ────────────────────────────────────────────────
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employe/dashboard'} replace />
  }
  return children
}

// ── Public Route: redirect if already logged in ────────────────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/employe/dashboard'} replace />
  }
  return children
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={
            <PublicRoute><Login /></PublicRoute>
          } />
          <Route path="/auth/callback" element={<GoogleCallback />} />

          {/* ── Admin ── */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/dossiers" element={
            <ProtectedRoute requiredRole="admin"><Dossiers /></ProtectedRoute>
          } />
          <Route path="/admin/comptes" element={
            <ProtectedRoute requiredRole="admin"><Comptes /></ProtectedRoute>
          } />
          <Route path="/admin/soumissions" element={
            <ProtectedRoute requiredRole="admin"><AdminSoumissions /></ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute requiredRole="admin"><AdminNotifications /></ProtectedRoute>
          } />

          {/* ── Employe ── */}
          <Route path="/employe" element={<Navigate to="/employe/dashboard" replace />} />
          <Route path="/employe/dashboard" element={
            <ProtectedRoute requiredRole="employe"><EmployeeDashboard /></ProtectedRoute>
          } />
          <Route path="/employe/dossiers" element={
            <ProtectedRoute requiredRole="employe"><EmployeeDossiers /></ProtectedRoute>
          } />
          <Route path="/employe/soumissions" element={
            <ProtectedRoute requiredRole="employe"><EmployeeSoumissions /></ProtectedRoute>
          } />
          <Route path="/employe/notifications" element={
            <ProtectedRoute requiredRole="employe"><EmployeeNotifications /></ProtectedRoute>
          } />

          {/* ── Fallback ── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}
