import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { StatusBadge, OccupancyBar } from '../../components/ui/Components';
import { Icons } from '../../components/ui/Icons';

export default function Dashboard() {
  const { state, stats, getDepartures, getConfirmedCount, isAtRisk } = useApp();

  const atRiskDepartures = state.departures.filter(d => isAtRisk(d));
  const upcomingDepartures = state.departures
    .filter(d => new Date(d.departureDate) >= new Date() && d.status !== 'Cancelled')
    .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate))
    .slice(0, 6);

  const publishedTrips = state.trips.filter(t => t.publishStatus === 'Published');
  const draftTrips = state.trips.filter(t => t.publishStatus === 'Draft');

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getTrip = (tripId) => state.trips.find(t => t.id === tripId);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Good morning — here's what's happening today</p>
        </div>
        <div className="page-header-actions">
          <Link to="/trips/new" className="btn btn-primary" id="dashboard-new-trip-btn">
            <Icons.Plus style={{ width: 14, height: 14 }} />
            New Trip
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Icons.Map style={{ width: 28, height: 28 }} /></div>
          <div className="stat-label">Published Trips</div>
          <div className="stat-value">{publishedTrips.length}</div>
          <div className="stat-change">{draftTrips.length} in draft</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Icons.Calendar style={{ width: 28, height: 28 }} /></div>
          <div className="stat-label">Open Departures</div>
          <div className="stat-value">{stats.totalDepartures}</div>
          <div className="stat-change">{stats.soldOutCount} sold out</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Icons.Users style={{ width: 28, height: 28 }} /></div>
          <div className="stat-label">Confirmed Bookings</div>
          <div className="stat-value">{state.bookings.filter(b => b.status === 'Confirmed').length}</div>
          <div className="stat-change">Across all departures</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Icons.AlertTriangle style={{ width: 28, height: 28 }} /></div>
          <div className="stat-label">At-Risk Departures</div>
          <div className="stat-value" style={{ color: atRiskDepartures.length > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {atRiskDepartures.length}
          </div>
          <div className="stat-change" style={{ color: atRiskDepartures.length > 0 ? 'var(--color-warning)' : '' }}>
            {atRiskDepartures.length > 0 ? 'Action needed' : 'All on track'}
          </div>
        </div>
      </div>

      {/* At-Risk Departures */}
      {atRiskDepartures.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)', border: '1px solid rgba(193,120,0,0.25)', background: '#fffdf5' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Icons.AlertTriangle style={{ width: 16, height: 16, color: 'var(--color-warning)' }} />
              <span className="card-title" style={{ color: 'var(--color-warning)' }}>At-Risk Departures</span>
            </div>
            <span className="badge badge-at-risk">{atRiskDepartures.length} departure{atRiskDepartures.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Departure Date</th>
                  <th>Confirmed vs Min</th>
                  <th>Days Until</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {atRiskDepartures.map(dep => {
                  const trip = getTrip(dep.tripId);
                  const confirmed = getConfirmedCount(dep);
                  const daysUntil = Math.floor((new Date(dep.departureDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={dep.id}>
                      <td className="td-bold">{trip?.title}</td>
                      <td>{formatDate(dep.departureDate)}</td>
                      <td>
                        <OccupancyBar confirmed={confirmed} max={dep.maxParticipants} min={dep.minParticipants} />
                        <span style={{ font: '400 11px/1 var(--font-family)', color: 'var(--color-warning)', marginTop: 3, display: 'block' }}>
                          {confirmed}/{dep.minParticipants} minimum needed
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-at-risk">{daysUntil} days</span>
                      </td>
                      <td>
                        <Link to={`/trips/${dep.tripId}/departures/${dep.id}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
        {/* Upcoming Departures */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Upcoming Departures</span>
              <Link to="/trips" className="btn btn-ghost btn-sm">View all trips →</Link>
            </div>
            <div style={{ padding: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Date</th>
                    <th>Travelers</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDepartures.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>No upcoming departures</td></tr>
                  )}
                  {upcomingDepartures.map(dep => {
                    const trip = getTrip(dep.tripId);
                    const confirmed = getConfirmedCount(dep);
                    return (
                      <tr key={dep.id}>
                        <td>
                          <div className="td-bold" style={{ fontSize: 13 }}>{trip?.title}</div>
                          <div className="td-muted">{dep.departureCity} → {dep.endCity}</div>
                        </td>
                        <td>{formatDate(dep.departureDate)}</td>
                        <td>
                          <span style={{ font: '500 13px/1 var(--font-family)' }}>{confirmed}</span>
                          <span className="td-muted"> / {dep.maxParticipants}</span>
                        </td>
                        <td><StatusBadge status={dep.status} /></td>
                        <td>
                          <Link to={`/trips/${dep.tripId}/departures/${dep.id}`} className="btn btn-ghost btn-sm">
                            <Icons.ChevronRight style={{ width: 14, height: 14 }} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-title">Recent Changes</span>
            </div>
            <div className="card-body" style={{ paddingTop: 'var(--space-2)' }}>
              {state.auditLog.slice(0, 8).map(entry => (
                <div className="audit-entry" key={entry.id}>
                  <div className="audit-dot" />
                  <div className="audit-entry-content">
                    <div className="audit-entry-title">
                      <strong>{entry.entityType}</strong>: {entry.field} changed to <em>{entry.newValue}</em>
                    </div>
                    <div className="audit-entry-meta">
                      {entry.user} · {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card" style={{ marginTop: 'var(--space-5)' }}>
            <div className="card-header"><span className="card-title">Trip Summary</span></div>
            <div className="card-body">
              {['Standard Trip', 'One-Time Trip', 'Trip Extension'].map(type => {
                const count = state.trips.filter(t => t.tripType === type).length;
                return (
                  <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-divider)' }}>
                    <span style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-secondary)' }}>{type}</span>
                    <span className="badge badge-neutral">{count}</span>
                  </div>
                );
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', marginTop: 4 }}>
                <span style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-secondary)' }}>Waitlisted guests</span>
                <span className="badge badge-waitlist">
                  {state.departures.reduce((sum, d) => sum + (d.waitlist?.length || 0), 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
