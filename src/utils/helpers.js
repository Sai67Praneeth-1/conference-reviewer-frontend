// src/utils/helpers.js

export const STATUS_LABELS = {
  not_started: 'Not Started',
  draft:       'Draft',
  submitted:   'Submitted',
};

export const STATUS_COLORS = {
  not_started: { bg: '#1e293b', text: '#94a3b8', border: '#334155' },
  draft:       { bg: '#1c1917', text: '#f59e0b', border: '#92400e' },
  submitted:   { bg: '#052e16', text: '#4ade80', border: '#166534' },
};

export const RECOMMENDATION_LABELS = {
  accept:      'Accept',
  reject:      'Reject',
  weak_accept: 'Weak Accept',
  weak_reject: 'Weak Reject',
};

export const RECOMMENDATION_COLORS = {
  accept:      '#4ade80',
  reject:      '#f87171',
  weak_accept: '#86efac',
  weak_reject: '#fca5a5',
};

export const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export const formatDeadline = (iso) => {
  if (!iso) return null;
  const d    = new Date(iso);
  const now  = new Date();
  const diff = d - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0)  return { label: `${Math.abs(days)}d overdue`,  urgent: true };
  if (days === 0) return { label: 'Due today',                   urgent: true };
  if (days <= 3)  return { label: `${days}d left`,               urgent: true };
  return { label: `${days}d left`, urgent: false };
};

export const scoreColor = (score) => {
  if (!score) return '#94a3b8';
  if (score >= 7) return '#4ade80';
  if (score >= 5) return '#fbbf24';
  return '#f87171';
};

export const apiError = (err) =>
  err?.response?.data?.message || err?.message || 'An unexpected error occurred';
