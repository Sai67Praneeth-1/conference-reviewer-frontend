// src/pages/Papers.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Spinner, StatusBadge, ScoreRing, DeadlineTag, Pagination, EmptyState, Alert } from '../components/UI';
import { apiError } from '../utils/helpers';

const FILTERS = [
  { label: 'All',         value: 'all' },
  { label: 'Not Started', value: 'not_started' },
  { label: 'Draft',       value: 'draft' },
  { label: 'Submitted',   value: 'submitted' },
];

export default function Papers() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [papers,  setPapers]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const LIMIT = 8;

  const fetchPapers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page, limit: LIMIT, search, status });
      const { data } = await api.get(`/papers?${params}`);
      setPapers(data.papers);
      setTotal(data.total);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchPapers(); }, [fetchPapers]);

  // Debounce search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/papers/${id}`);
      fetchPapers();
    } catch (err) {
      alert(apiError(err));
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className="page-title">{isAdmin ? 'All Papers' : 'My Assignments'}</h1>
            <p className="page-subtitle">
              {total} paper{total !== 1 ? 's' : ''} {!isAdmin && 'assigned to you'}
            </p>
          </div>
          {isAdmin && (
            <Link to="/papers/new" className="btn btn-primary">+ Add Paper</Link>
          )}
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* ── Toolbar ── */}
        <div className="toolbar">
          <div className="search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              placeholder="Search by title…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {!isAdmin && (
            <div className="filter-tabs">
              {FILTERS.map(f => (
                <button key={f.value}
                  className={`filter-tab${status === f.value ? ' active' : ''}`}
                  onClick={() => { setStatus(f.value); setPage(1); }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)' }}>
            <Spinner size={24} />
          </div>
        ) : papers.length === 0 ? (
          <EmptyState
            icon="📄"
            title="No papers found"
            message={search ? 'Try adjusting your search.' : 'No papers match the current filter.'}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Authors</th>
                  {!isAdmin && <th>Status</th>}
                  {!isAdmin && <th>Score</th>}
                  {isAdmin  && <th>Reviewers</th>}
                  {isAdmin  && <th>Avg Score</th>}
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {papers.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-3)', fontSize: 12 }}>
                      #{p.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text)', maxWidth: 280 }}>
                        {p.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                        {p.abstract?.slice(0, 80)}…
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-3)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.authors}
                    </td>
                    {!isAdmin && <td><StatusBadge status={p.review_status} /></td>}
                    {!isAdmin && <td><ScoreRing score={p.score} /></td>}
                    {isAdmin && (
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>
                        {p.assigned_count ?? 0}
                      </td>
                    )}
                    {isAdmin && (
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 13, color: p.avg_score ? 'var(--green)' : 'var(--text-3)' }}>
                        {p.avg_score ?? '—'}
                      </td>
                    )}
                    <td><DeadlineTag deadline={p.deadline} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/papers/${p.id}`)}>
                          Open
                        </button>
                        {isAdmin && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.title)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} total={total} limit={LIMIT} onPage={setPage} />
      </div>
    </div>
  );
}
