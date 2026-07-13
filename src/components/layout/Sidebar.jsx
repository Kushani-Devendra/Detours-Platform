import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Icons } from '../ui/Icons';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/', label: 'Dashboard', icon: 'Home', exact: true },
    ],
  },
  {
    label: 'Trip Management',
    items: [
      { to: '/trips', label: 'All Trips', icon: 'Map' },
      { to: '/calendar', label: 'Trip Calendar', icon: 'Calendar' },
    ],
  },
  {
    label: 'Communications',
    items: [
      { to: '/email-templates', label: 'Email Templates', icon: 'Mail' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', label: 'Settings', icon: 'Settings' },
    ],
  },
];

export default function Sidebar() {
  const { stats, state } = useApp();

  const atRiskDeps = state.departures.filter(d => {
    const days = Math.floor((new Date(d.departureDate) - new Date()) / (1000 * 60 * 60 * 24));
    const confirmed = 0; // simplified
    return days <= 90 && days > 0 && d.status === 'Open for Booking';
  });

  return (
    <aside className="sidebar" role="navigation" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-mark">
          <div className="sidebar-logo-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div>
            <div className="sidebar-logo-text">Kapuli</div>
            <div className="sidebar-logo-sub">Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_SECTIONS.map(section => (
          <div className="sidebar-section" key={section.label}>
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(item => {
              const IconComp = Icons[item.icon];
              const badge = item.label === 'All Trips' && stats.atRiskCount > 0 ? stats.atRiskCount : null;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {IconComp && <IconComp style={{ width: 16, height: 16 }} />}
                  {item.label}
                  {badge && (
                    <span className="sidebar-link-badge warning" aria-label={`${badge} at-risk departures`}>
                      {badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}

        {/* Quick Links */}
        <div className="sidebar-section">
          <div className="sidebar-section-label">Guest Pages</div>
          <a
            href="/public/calendar"
            className="sidebar-link"
            onClick={e => { e.preventDefault(); window.open('/public/calendar', '_blank'); }}
          >
            <Icons.Globe style={{ width: 16, height: 16 }} />
            Trip Calendar ↗
          </a>
        </div>
      </nav>

      {/* User */}
      <div className="sidebar-footer">
        <div className="sidebar-user" role="button" tabIndex={0}>
          <div className="sidebar-avatar">SO</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">Sarah Owen</div>
            <div className="sidebar-user-role">Owner</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
