// src/pages/Analytics.jsx  (Admin only)
import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../services/api';
import { Spinner, Alert, ScoreRing } from '../components/UI';
import { RECOMMENDATION_LABELS, RECOMMENDATION_COLORS, apiError } from '../utils/helpers';

const CHART_COLORS = ['#6366f1', '#4ade80', '#f59e0b', '#f87171', '#22d3ee', '#a78bfa'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-1)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <p style={{ color: 'var(--text-2)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontFamily: 'var(--mono)' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [overview,  setOverview]  = useState(null);
  const [papers,    setPapers]    = useState([]);
  const [reviewers, setReviewers] = useState([]);
  const [recs,      setRecs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/papers'),
      api.get('/analytics/reviewers'),
      api.get('/analytics/recommendations'),
    ]).then(([ov, pa, re, rc]) => {
      setOverview(ov.data);
      setPapers(pa.data.data);
      setReviewers(re.data.data);
      setRecs(rc.data.data.map(r => ({
        name:  RECOMMENDATION_LABELS[r.recommendation] || r.recommendation,
        value: parseInt(r.count, 10),
        color: RECOMMENDATION_COLORS[r.recommendation] || '#94a3b8',
      })));
    }).catch(err => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '80px 0' }}><Spinner size={28} /></div>;
  if (error)   return <div className="page-body"><Alert type="error">{error}</Alert></div>;

  // Trim long titles for chart
  const chartPapers = papers.slice(0, 8).map(p => ({
    ...p,
    short_title: p.title.length > 30 ? p.title.slice(0, 30) + '…' : p.title,
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Analytics & Reports</h1>
        <p className="page-subtitle">System-wide review statistics</p>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Overview stats ── */}
        <div className="card-grid card-grid-4">
          {[
            { label: 'Total Papers',      value: overview?.totalPapers         ?? '—', color: null },
            { label: 'Total Reviewers',   value: overview?.totalReviewers      ?? '—', color: null },
            { label: 'Submitted Reviews', value: overview?.submittedReviews    ?? '—', color: 'var(--green)' },
            { label: 'Overdue Deadlines', value: overview?.overdueDeadlines    ?? '—', color: 'var(--red)' },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={s.color ? { color: s.color } : {}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Score per paper ── */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Average Score per Paper</h2>
          {chartPapers.length === 0 ? (
            <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No submitted reviews yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartPapers} margin={{ top: 0, right: 20, left: -10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="short_title" tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'var(--mono)' }}
                  angle={-30} textAnchor="end" interval={0} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'var(--mono)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_score" name="Avg Score" radius={[6, 6, 0, 0]}>
                  {chartPapers.map((entry, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card-grid card-grid-2">
          {/* ── Reviewer stats ── */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Reviews per Reviewer</h2>
            {reviewers.length === 0 ? (
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={reviewers} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-3)' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--text-2)' }} width={60} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="submitted" name="Submitted" fill="#4ade80" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="drafts"    name="Drafts"    fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Recommendation breakdown ── */}
          <div className="card">
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>Recommendation Breakdown</h2>
            {recs.length === 0 ? (
              <p style={{ color: 'var(--text-3)', fontSize: 14 }}>No submitted reviews yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={recs} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'var(--text-3)' }}>
                    {recs.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Reviewer table ── */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Reviewer Breakdown</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Assigned</th>
                  <th>Submitted</th>
                  <th>Drafts</th>
                  <th>Completion</th>
                  <th>Avg Score Given</th>
                </tr>
              </thead>
              <tbody>
                {reviewers.map(r => {
                  const pct = r.total_assigned > 0
                    ? Math.round((r.submitted / r.total_assigned) * 100)
                    : 0;
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{r.total_assigned}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--green)' }}>{r.submitted}</td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--yellow)' }}>{r.drafts}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div className="progress-bar-wrap">
                              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                          <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--text-3)', minWidth: 32 }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td><ScoreRing score={r.avg_score_given} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
