// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Spinner, StatusBadge, ScoreRing, DeadlineTag, RecommendationChip } from '../components/UI';
import { formatDate } from '../utils/helpers';

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data,    setData]    = useState(null);
  const [papers,  setPapers]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (isAdmin) {
          const [overview, pRes] = await Promise.all([
            api.get('/analytics/overview'),
            api.get('/papers?limit=5'),
          ]);
          setData(overview.data);
          setPapers(pRes.data.papers);
        } else {
          const pRes = await api.get('/papers?limit=10');
          setPapers(pRes.data.papers);
          const counts = pRes.data.papers.reduce(
            (acc, p) => {
              acc.total++;
              acc[p.review_status] = (acc[p.review_status] || 0) + 1;
              return acc;
            }, { total: 0, not_started: 0, draft: 0, submitted: 0 }
          );
          setData(counts);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [isAdmin]);

  if (loading) return (
    <div className="loading-page" style={{ minHeight: 'unset', padding: '80px 0' }}>
      <Spinner size={28} />
      <span style={{ color: 'var(--text-3)' }}>Loading dashboard…</span>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="page-subtitle">
              {isAdmin ? 'System overview and recent activity' : 'Your review assignments at a glance'}
            </p>
          </div>
          {isAdmin && (
            <Link to="/papers/new" className="btn btn-primary">
              + Add Paper
            </Link>
          )}
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Stats ── */}
        {isAdmin ? (
          <div className="card-grid card-grid-4">
            <StatCard label="Total Papers"      value={data?.totalPapers      ?? '—'} sub="in system" />
            <StatCard label="Reviewers"         value={data?.totalReviewers   ?? '—'} sub="active" />
            <StatCard label="Reviews Submitted" value={data?.submittedReviews ?? '—'} sub="finalised" accent="var(--green)" />
            <StatCard label="Overdue Deadlines" value={data?.overdueDeadlines ?? '—'} sub="need attention" accent="var(--red)" />
          </div>
        ) : (
          <div className="card-grid card-grid-4">
            <StatCard label="Assigned Papers"  value={data?.total        ?? 0} sub="total assignments" />
            <StatCard label="Not Started"      value={data?.not_started  ?? 0} sub="pending" accent="var(--text-2)" />
            <StatCard label="Drafts Saved"     value={data?.draft        ?? 0} sub="in progress" accent="var(--yellow)" />
            <StatCard label="Submitted"        value={data?.submitted    ?? 0} sub="finalised" accent="var(--green)" />
          </div>
        )}

        {/* ── Recent Papers ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>
              {isAdmin ? 'Recent Papers' : 'Your Assignments'}
            </h2>
            <Link to="/papers" className="btn btn-ghost btn-sm">View all →</Link>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Authors</th>
                  {!isAdmin && <th>Review Status</th>}
                  {!isAdmin && <th>Score</th>}
                  {!isAdmin && <th>Recommendation</th>}
                  <th>Deadline</th>
                  {isAdmin && <th>Avg Score</th>}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {papers.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    No papers found
                  </td></tr>
                ) : papers.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text-3)', fontSize: 12 }}>
                      #{p.id}
                    </td>
                    <td style={{ color: 'var(--text)', fontWeight: 500, maxWidth: 260 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.title}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.authors}
                    </td>
                    {!isAdmin && <td><StatusBadge status={p.review_status} /></td>}
                    {!isAdmin && <td><ScoreRing score={p.score} /></td>}
                    {!isAdmin && <td><RecommendationChip rec={p.recommendation} /></td>}
                    <td><DeadlineTag deadline={p.deadline} /></td>
                    {isAdmin && (
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 13, color: p.avg_score ? 'var(--green)' : 'var(--text-3)' }}>
                        {p.avg_score ?? '—'}
                      </td>
                    )}
                    <td>
                      <Link to={`/papers/${p.id}`} className="btn btn-ghost btn-sm">Open →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
