// src/components/UI.jsx – reusable atomic UI pieces
import React from 'react';
import { STATUS_LABELS, RECOMMENDATION_LABELS, RECOMMENDATION_COLORS, formatDeadline, scoreColor } from '../utils/helpers';

export const Spinner = ({ size = 20 }) => (
  <span className="spinner" style={{ width: size, height: size }} />
);

export const Alert = ({ type = 'error', children }) => (
  <div className={`alert alert-${type}`}>{children}</div>
);

export const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status || 'not_started'}`}>
    {status === 'submitted' ? '✓ ' : status === 'draft' ? '✎ ' : '○ '}
    {STATUS_LABELS[status] || STATUS_LABELS.not_started}
  </span>
);

export const RoleBadge = ({ role }) => (
  <span className={`badge badge-${role}`}>{role}</span>
);

export const RecommendationChip = ({ rec }) => {
  if (!rec) return <span style={{ color: 'var(--text-3)' }}>—</span>;
  const color = RECOMMENDATION_COLORS[rec] || '#94a3b8';
  return (
    <span className="rec-chip" style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}40`,
    }}>
      {RECOMMENDATION_LABELS[rec] || rec}
    </span>
  );
};

export const ScoreRing = ({ score }) => {
  if (score == null) return <span style={{ color: 'var(--text-3)' }}>—</span>;
  const color = scoreColor(score);
  return (
    <span className="score-ring" style={{ borderColor: color, color }}>
      {parseFloat(score).toFixed(1)}
    </span>
  );
};

export const DeadlineTag = ({ deadline }) => {
  const info = formatDeadline(deadline);
  if (!info) return null;
  return (
    <span className={`deadline-badge ${info.urgent ? 'urgent' : 'normal'}`}>
      {info.urgent ? '⚠ ' : '⏰ '}{info.label}
    </span>
  );
};

export const Pagination = ({ page, total, limit, onPage }) => {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;

  const items = [];
  for (let i = 1; i <= pages; i++) items.push(i);

  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
      {items.map(i => (
        <button key={i} className={`page-btn${i === page ? ' active' : ''}`} onClick={() => onPage(i)}>
          {i}
        </button>
      ))}
      <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === pages}>›</button>
    </div>
  );
};

export const Modal = ({ open, onClose, title, children, footer }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const EmptyState = ({ icon = '📭', title, message, action }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{message}</p>
    {action && <div style={{ marginTop: 16 }}>{action}</div>}
  </div>
);

export const ProgressBar = ({ value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color || 'var(--accent)' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{value}/{max}</span>
    </div>
  );
};
