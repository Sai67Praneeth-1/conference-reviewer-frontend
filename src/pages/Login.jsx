// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiError } from '../utils/helpers';
import { Spinner, Alert } from '../components/UI';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email) => setForm({ email, password: 'password' });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      {/* Background grid effect */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        opacity: 0.3,
      }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚗️</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)' }}>
            ConfReview
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginTop: 4 }}>
            Academic Conference Reviewer Portal
          </p>
        </div>

        <div className="card" style={{ padding: '28px 32px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Sign in to your account</h2>

          {error && <Alert type="error" >{error}</Alert>}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: error ? 16 : 0 }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                name="email"
                type="email"
                placeholder="you@conference.io"
                value={form.email}
                onChange={onChange}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
              />
            </div>

            <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
              style={{ marginTop: 4, justifyContent: 'center' }}>
              {loading ? <><Spinner size={16} /> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <div className="divider" style={{ margin: '20px 0' }} />

          {/* Demo accounts */}
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 10, fontFamily: 'var(--mono)' }}>
            DEMO ACCOUNTS (password: password)
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: '👑 Admin',          email: 'admin@conf.io' },
              { label: '🔬 Alice (Reviewer)', email: 'alice@conf.io' },
              { label: '🔬 Bob (Reviewer)',   email: 'bob@conf.io' },
              { label: '🔬 Carol (Reviewer)', email: 'carol@conf.io' },
            ].map(({ label, email }) => (
              <button key={email} className="btn btn-ghost btn-sm"
                style={{ justifyContent: 'flex-start', fontFamily: 'var(--mono)', fontSize: 12 }}
                onClick={() => fillDemo(email)}>
                {label} — {email}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
