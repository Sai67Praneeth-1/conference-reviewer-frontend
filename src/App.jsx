// src/App.jsx – Root component with route definitions
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar      from './components/Sidebar';
import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import Papers       from './pages/Papers';
import PaperDetail  from './pages/PaperDetail';
import PaperForm    from './pages/PaperForm';
import Users        from './pages/Users';
import Analytics    from './pages/Analytics';
import { Spinner }  from './components/UI';

// ── Protected route wrapper ───────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return (
    <div className="loading-page">
      <Spinner size={32} />
      <span>Loading…</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Shell: sidebar + content ──────────────────────────────
function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginGuard />} />

          {/* Protected */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppShell><Dashboard /></AppShell>
            </ProtectedRoute>
          } />

          <Route path="/papers" element={
            <ProtectedRoute>
              <AppShell><Papers /></AppShell>
            </ProtectedRoute>
          } />

          <Route path="/papers/new" element={
            <ProtectedRoute adminOnly>
              <AppShell><PaperForm /></AppShell>
            </ProtectedRoute>
          } />

          <Route path="/papers/:id" element={
            <ProtectedRoute>
              <AppShell><PaperDetail /></AppShell>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute adminOnly>
              <AppShell><Users /></AppShell>
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute adminOnly>
              <AppShell><Analytics /></AppShell>
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Redirect logged-in users away from /login
function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-page"><Spinner size={32} /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Login />;
}
