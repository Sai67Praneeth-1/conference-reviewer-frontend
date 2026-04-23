// src/components/Sidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  papers:    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  users:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  analytics: "M18 20V10 M12 20V4 M6 20v-6",
  logout:    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
};

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>⚗️ ConfReview</h1>
        <span>Academic Review System</span>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Navigation</span>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon d={icons.dashboard} /> Dashboard
        </NavLink>

        <NavLink to="/papers" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <Icon d={icons.papers} /> Papers
        </NavLink>

        {isAdmin && (
          <>
            <span className="nav-section-label" style={{ marginTop: 8 }}>Admin</span>
            <NavLink to="/users" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Icon d={icons.users} /> Reviewers
            </NavLink>
            <NavLink to="/analytics" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Icon d={icons.analytics} /> Analytics
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <strong>{user?.name}</strong>
            <span>{user?.role}</span>
          </div>
        </div>
        <button className="nav-item" onClick={handleLogout} style={{ marginTop: 6, color: '#f87171' }}>
          <Icon d={icons.logout} /> Logout
        </button>
      </div>
    </aside>
  );
}
