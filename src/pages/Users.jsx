// src/pages/Users.jsx  (Admin only)
import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Spinner, Alert, Modal, ProgressBar } from '../components/UI';
import { formatDate, apiError } from '../utils/helpers';

export default function Users() {
  const [reviewers, setReviewers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState({ name: '', email: '', password: '' });
  const [formErr,   setFormErr]   = useState({});
  const [saving,    setSaving]    = useState(false);
  const [apiErr,    setApiErr]    = useState('');
  const [success,   setSuccess]   = useState('');

  const fetchReviewers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setReviewers(data.reviewers);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviewers(); }, []);

  const onChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setFormErr(er => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())                    errs.name     = 'Name is required';
    if (!form.email.trim())                   errs.email    = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(form.email))     errs.email    = 'Invalid email';
    if (form.password.length < 6)             errs.password = 'Min 6 characters';
    setFormErr(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true); setApiErr(''); setSuccess('');
    try {
      await api.post('/auth/register', { ...form, role: 'reviewer' });
      setSuccess(`Reviewer "${form.name}" created successfully`);
      setForm({ name: '', email: '', password: '' });
      setShowAdd(false);
      fetchReviewers();
    } catch (err) {
      setApiErr(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete reviewer "${name}"? This is a soft delete.`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchReviewers();
    } catch (err) {
      alert(apiError(err));
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0' }}><Spinner size={28} /></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">Reviewers</h1>
            <p className="page-subtitle">{reviewers.length} reviewer{reviewers.length !== 1 ? 's' : ''} in system</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Reviewer</button>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error   && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Email</th>
                <th>Assigned Papers</th>
                <th>Submitted</th>
                <th>Progress</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviewers.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px' }}>
                  No reviewers found
                </td></tr>
              ) : reviewers.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--accent)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white',
                        flexShrink: 0,
                      }}>
                        {r.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{r.email}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{r.assigned_papers}</td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)' }}>
                    {r.submitted_reviews}
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <ProgressBar
                      value={parseInt(r.submitted_reviews, 10)}
                      max={parseInt(r.assigned_papers, 10)}
                      color="var(--green)"
                    />
                  </td>
                  <td style={{ fontSize: 13, color: 'var(--text-3)' }}>{formatDate(r.created_at)}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id, r.name)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reviewer Modal */}
      <Modal
        open={showAdd}
        onClose={() => { setShowAdd(false); setApiErr(''); setFormErr({}); }}
        title="Add Reviewer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? <><Spinner size={14} /> Creating…</> : 'Create Reviewer'}
            </button>
          </>
        }
      >
        {apiErr && <Alert type="error" >{apiErr}</Alert>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: apiErr ? 14 : 0 }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" value={form.name} onChange={onChange} placeholder="Dr. Jane Smith" />
            {formErr.name && <span className="form-error">{formErr.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" value={form.email} onChange={onChange} placeholder="jane@conf.io" />
            {formErr.email && <span className="form-error">{formErr.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <input className="form-input" name="password" type="password" value={form.password} onChange={onChange} placeholder="Min 6 characters" />
            {formErr.password && <span className="form-error">{formErr.password}</span>}
          </div>
        </div>
      </Modal>
    </div>
  );
}
