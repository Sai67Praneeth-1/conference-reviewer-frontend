// src/pages/PaperDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Spinner, Alert, StatusBadge, ScoreRing, RecommendationChip, DeadlineTag, Modal
} from '../components/UI';
import { formatDate, apiError } from '../utils/helpers';

// ─── Review Form (Reviewer) ───────────────────────────────
function ReviewForm({ paperId, existing, onSaved }) {
  const [form, setForm] = useState({
    score:          existing?.score          ?? '',
    comments:       existing?.comments       ?? '',
    recommendation: existing?.recommendation ?? '',
  });
  const [saving,    setSaving]    = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  const isLocked = existing?.status === 'submitted';

  const onChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError(''); setSuccess('');
  };

  const validate = (forSubmit) => {
    if (form.score !== '' && (parseFloat(form.score) < 1 || parseFloat(form.score) > 10)) {
      setError('Score must be between 1 and 10'); return false;
    }
    if (forSubmit && (!form.score || !form.recommendation)) {
      setError('Score and recommendation are required to submit'); return false;
    }
    return true;
  };

  const save = async (status) => {
    if (!validate(status === 'submitted')) return;
    const setter = status === 'submitted' ? setSubmitting : setSaving;
    setter(true); setError(''); setSuccess('');
    try {
      const { data } = await api.put(`/papers/${paperId}/review`, { ...form, status });
      setSuccess(data.message);
      onSaved(data.review);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setter(false);
    }
  };

  if (isLocked) {
    return (
      <div>
        <div className="alert alert-success" style={{ marginBottom: 20 }}>
          ✓ Review submitted — no further edits allowed
        </div>
        <ReviewReadOnly review={existing} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {error   && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="form-group">
        <label className="form-label">Score <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(1–10)</span></label>
        <input
          className="form-input"
          name="score"
          type="number"
          min="1" max="10" step="0.5"
          placeholder="e.g. 7.5"
          value={form.score}
          onChange={onChange}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Recommendation</label>
        <select className="form-select" name="recommendation" value={form.recommendation} onChange={onChange}>
          <option value="">— Select —</option>
          <option value="accept">Accept</option>
          <option value="weak_accept">Weak Accept</option>
          <option value="weak_reject">Weak Reject</option>
          <option value="reject">Reject</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Comments</label>
        <textarea
          className="form-textarea"
          name="comments"
          rows="6"
          placeholder="Provide detailed feedback on the paper's strengths, weaknesses, and suggested improvements…"
          value={form.comments}
          onChange={onChange}
          style={{ minHeight: 160 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
        <button className="btn btn-secondary" onClick={() => save('draft')} disabled={saving || submitting}>
          {saving ? <><Spinner size={14} /> Saving…</> : '💾 Save Draft'}
        </button>
        <button className="btn btn-primary" onClick={() => save('submitted')} disabled={saving || submitting}>
          {submitting ? <><Spinner size={14} /> Submitting…</> : '✓ Submit Review'}
        </button>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
        ⚠ Once submitted, the review cannot be edited.
      </p>
    </div>
  );
}

function ReviewReadOnly({ review }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="card" style={{ padding: '16px 20px', flex: 1 }}>
          <div className="stat-label">Score</div>
          <ScoreRing score={review.score} />
        </div>
        <div className="card" style={{ padding: '16px 20px', flex: 1 }}>
          <div className="stat-label">Recommendation</div>
          <div style={{ marginTop: 6 }}><RecommendationChip rec={review.recommendation} /></div>
        </div>
        <div className="card" style={{ padding: '16px 20px', flex: 1 }}>
          <div className="stat-label">Submitted</div>
          <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-2)' }}>
            {formatDate(review.submitted_at)}
          </div>
        </div>
      </div>
      {review.comments && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <div className="stat-label" style={{ marginBottom: 10 }}>Comments</div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
            {review.comments}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function PaperDetail() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [paper,       setPaper]       = useState(null);
  const [review,      setReview]      = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [allReviews,  setAllReviews]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [showAssign,  setShowAssign]  = useState(false);
  const [reviewers,   setReviewers]   = useState([]);
  const [selReviewer, setSelReviewer] = useState('');
  const [assigning,   setAssigning]   = useState(false);

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get(`/papers/${id}`);
      setPaper(data.paper);
      if (isAdmin) {
        setAssignments(data.assignments || []);
        setAllReviews(data.reviews || []);
      } else {
        setReview(data.review || null);
      }
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const openAssignModal = async () => {
    try {
      const { data } = await api.get('/users');
      setReviewers(data.reviewers);
      setShowAssign(true);
    } catch (err) { alert(apiError(err)); }
  };

  const handleAssign = async () => {
    if (!selReviewer) return;
    setAssigning(true);
    try {
      await api.post(`/papers/${id}/assign`, { reviewer_id: parseInt(selReviewer) });
      setShowAssign(false); setSelReviewer('');
      fetchData();
    } catch (err) { alert(apiError(err)); }
    finally { setAssigning(false); }
  };

  const handleUnassign = async (reviewerId, name) => {
    if (!window.confirm(`Remove ${name} from this paper?`)) return;
    try {
      await api.delete(`/papers/${id}/assign/${reviewerId}`);
      fetchData();
    } catch (err) { alert(apiError(err)); }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}><Spinner size={28} /></div>
  );
  if (error) return (
    <div className="page-body"><Alert type="error">{error}</Alert></div>
  );
  if (!paper) return null;

  const reviewStatus = isAdmin ? null : (review?.status || 'not_started');

  return (
    <div>
      <div className="page-header">
        <div style={{ marginBottom: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-3)' }}>Paper #{paper.id}</span>
              {!isAdmin && <StatusBadge status={reviewStatus} />}
              <DeadlineTag deadline={paper.deadline} />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.3, marginBottom: 6 }}>
              {paper.title}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
              by {paper.authors} · Added {formatDate(paper.created_at)}
            </p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openAssignModal}>
              + Assign Reviewer
            </button>
          )}
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Abstract */}
        <div className="card">
          <div className="stat-label" style={{ marginBottom: 10 }}>Abstract</div>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--text-2)' }}>{paper.abstract}</p>
          {paper.pdf_filename && (
            <div style={{ marginTop: 14 }}>
              <a
                href={`http://localhost:5000/uploads/${paper.pdf_filename}`}
                target="_blank" rel="noreferrer"
                className="btn btn-secondary btn-sm">
                📄 Download PDF
              </a>
            </div>
          )}
        </div>

        {/* ── Reviewer: review form ── */}
        {!isAdmin && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Your Review</h2>
              <StatusBadge status={reviewStatus} />
            </div>
            <ReviewForm paperId={id} existing={review} onSaved={(r) => setReview(r)} />
          </div>
        )}

        {/* ── Admin: assignments ── */}
        {isAdmin && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Assigned Reviewers ({assignments.length})
            </h2>
            {assignments.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-3)' }}>
                No reviewers assigned yet
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Reviewer</th><th>Email</th><th>Review Status</th><th>Assigned</th><th></th></tr>
                  </thead>
                  <tbody>
                    {assignments.map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 500, color: 'var(--text)' }}>{a.reviewer_name}</td>
                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{a.reviewer_email}</td>
                        <td><StatusBadge status={a.review_status} /></td>
                        <td style={{ fontSize: 13, color: 'var(--text-3)' }}>{formatDate(a.assigned_at)}</td>
                        <td>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => handleUnassign(a.reviewer_id, a.reviewer_name)}>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Admin: all reviews ── */}
        {isAdmin && allReviews.length > 0 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
              Submitted Reviews ({allReviews.filter(r => r.status === 'submitted').length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {allReviews.filter(r => r.status === 'submitted').map(r => (
                <div className="card" key={r.id}>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div>
                      <div className="stat-label">Reviewer</div>
                      <div style={{ color: 'var(--text)', fontWeight: 600 }}>{r.reviewer_name}</div>
                    </div>
                    <div>
                      <div className="stat-label">Score</div>
                      <ScoreRing score={r.score} />
                    </div>
                    <div>
                      <div className="stat-label">Recommendation</div>
                      <div style={{ marginTop: 6 }}><RecommendationChip rec={r.recommendation} /></div>
                    </div>
                    <div>
                      <div className="stat-label">Submitted</div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6 }}>
                        {formatDate(r.submitted_at)}
                      </div>
                    </div>
                  </div>
                  {r.comments && (
                    <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.7, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      {r.comments}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        open={showAssign}
        onClose={() => { setShowAssign(false); setSelReviewer(''); }}
        title="Assign Reviewer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign} disabled={!selReviewer || assigning}>
              {assigning ? <><Spinner size={14} /> Assigning…</> : 'Assign'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Select Reviewer</label>
          <select className="form-select" value={selReviewer} onChange={(e) => setSelReviewer(e.target.value)}>
            <option value="">— Choose a reviewer —</option>
            {reviewers.map(r => (
              <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
            ))}
          </select>
        </div>
      </Modal>
    </div>
  );
}
