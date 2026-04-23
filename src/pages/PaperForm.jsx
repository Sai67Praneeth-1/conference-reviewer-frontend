// src/pages/PaperForm.jsx  (Admin only – create paper)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Spinner, Alert } from '../components/UI';
import { apiError } from '../utils/helpers';

export default function PaperForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', abstract: '', authors: '', deadline: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [apiErr,  setApiErr]  = useState('');

  const onChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim())    errs.title    = 'Title is required';
    if (!form.abstract.trim()) errs.abstract = 'Abstract is required';
    if (!form.authors.trim())  errs.authors  = 'Authors are required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setApiErr('');

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    if (pdfFile) fd.append('pdf', pdfFile);

    try {
      const { data } = await api.post('/papers', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/papers/${data.paper.id}`);
    } catch (err) {
      setApiErr(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>← Back</button>
        <h1 className="page-title">Add New Paper</h1>
        <p className="page-subtitle">Fill in the details and optionally upload a PDF</p>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 680 }}>
          {apiErr && <Alert type="error" >{apiErr}</Alert>}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: apiErr ? 20 : 0 }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-2)' }}>Paper Details</h2>

              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className={`form-input${errors.title ? ' error' : ''}`}
                  name="title" value={form.title} onChange={onChange}
                  placeholder="Enter the paper title…" />
                {errors.title && <span className="form-error">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Authors *</label>
                <input className={`form-input${errors.authors ? ' error' : ''}`}
                  name="authors" value={form.authors} onChange={onChange}
                  placeholder="e.g. Alice Smith, Bob Johnson" />
                {errors.authors && <span className="form-error">{errors.authors}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Abstract *</label>
                <textarea className={`form-textarea${errors.abstract ? ' error' : ''}`}
                  name="abstract" value={form.abstract} onChange={onChange}
                  rows={6} placeholder="Provide a concise summary of the paper…" />
                {errors.abstract && <span className="form-error">{errors.abstract}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Review Deadline</label>
                <input className="form-input" type="datetime-local"
                  name="deadline" value={form.deadline} onChange={onChange} />
                <span className="form-hint">Leave blank for no deadline</span>
              </div>

              <div className="form-group">
                <label className="form-label">Upload PDF <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional, max 10 MB)</span></label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  background: pdfFile ? 'rgba(99,102,241,0.05)' : 'transparent',
                }}>
                  <input type="file" accept=".pdf" id="pdf-upload"
                    style={{ display: 'none' }}
                    onChange={(e) => setPdfFile(e.target.files[0] || null)} />
                  <label htmlFor="pdf-upload" style={{ cursor: 'pointer' }}>
                    {pdfFile ? (
                      <span style={{ color: 'var(--accent-h)' }}>📄 {pdfFile.name}</span>
                    ) : (
                      <span style={{ color: 'var(--text-3)' }}>Click to upload PDF</span>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" type="button" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? <><Spinner size={14} /> Creating…</> : '+ Create Paper'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
