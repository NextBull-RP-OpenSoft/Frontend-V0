import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/portfolio', label: 'Portfolio', icon: '💰' },
  { path: '/orders', label: 'Orders', icon: '📋' },
  { path: '/bots', label: 'Bots', icon: '🤖' },
  { path: '/admin', label: 'Admin', icon: '⚙️' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar" id="main-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="logo-icon">🐂</span>
          <span className="logo-text">Synthetic<span className="logo-accent">Bull</span></span>
        </div>
        <div className="sidebar-tagline">Trading Terminal</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            id={`nav-${item.label.toLowerCase()}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.username?.charAt(0).toUpperCase() || 'T'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-username">{user?.username || 'Trader'}</div>
            <div className="sidebar-user-email">{user?.email || 'trader@syntheticbull.com'}</div>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} id="btn-logout">
          ↪ Logout
        </button>
      </div>
    </aside>
  );
}
