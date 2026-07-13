import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Icons } from '../ui/Icons';

function buildBreadcrumbs(pathname, state) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Dashboard', to: '/' }];

  if (parts[0] === 'trips') {
    crumbs.push({ label: 'Trips', to: '/trips' });
    if (parts[1] === 'new') {
      crumbs.push({ label: 'New Trip', to: null });
    } else if (parts[1]) {
      const trip = state.trips.find(t => t.id === parts[1]);
      if (trip) {
        crumbs.push({ label: trip.title, to: `/trips/${parts[1]}` });
        if (parts[2] === 'edit') crumbs.push({ label: 'Edit', to: null });
        if (parts[2] === 'departures' && parts[3]) {
          const dep = state.departures.find(d => d.id === parts[3]);
          if (dep) {
            crumbs.push({ label: `Departure: ${dep.departureDate}`, to: `/trips/${parts[1]}/departures/${parts[3]}` });
            if (parts[4] === 'rooms') crumbs.push({ label: 'Room Management', to: null });
          }
        }
      }
    }
  } else if (parts[0] === 'calendar') {
    crumbs.push({ label: 'Trip Calendar', to: null });
  } else if (parts[0] === 'email-templates') {
    crumbs.push({ label: 'Email Templates', to: '/email-templates' });
    if (parts[1]) {
      const tmpl = state.emailTemplates.find(t => t.id === parts[1]);
      if (tmpl) crumbs.push({ label: tmpl.name, to: null });
    }
  } else if (parts[0] === 'settings') {
    crumbs.push({ label: 'Settings', to: null });
  }

  return crumbs;
}

export default function TopBar() {
  const location = useLocation();
  const { state } = useApp();
  const crumbs = buildBreadcrumbs(location.pathname, state);

  return (
    <header className="topbar">
      <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="breadcrumb-sep">/</span>}
            {crumb.to ? (
              <Link to={crumb.to} className="breadcrumb-item">{crumb.label}</Link>
            ) : (
              <span className="breadcrumb-item active">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="topbar-actions">
        <button className="btn btn-ghost btn-icon" title="Help" aria-label="Help">
          <Icons.Info style={{ width: 16, height: 16 }} />
        </button>
        <a
          href="/public/calendar"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          title="View public website"
        >
          <Icons.ExternalLink style={{ width: 13, height: 13 }} />
          View Site
        </a>
      </div>
    </header>
  );
}
