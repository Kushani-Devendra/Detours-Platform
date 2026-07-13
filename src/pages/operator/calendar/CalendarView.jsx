import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { Icons } from '../../../components/ui/Icons';
import { StatusBadge, OccupancyBar } from '../../../components/ui/Components';

export default function CalendarView() {
  const { state, getConfirmedCount } = useApp();
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  
  // Sort departures chronologically
  const departures = [...state.departures].sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
  
  const getTrip = (tripId) => state.trips.find(t => t.id === tripId);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatMonthYear = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Group by month
  const grouped = departures.reduce((acc, dep) => {
    const month = formatMonthYear(dep.departureDate);
    if (!acc[month]) acc[month] = [];
    acc[month].push(dep);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Trip Calendar</h1>
          <p className="page-subtitle">Schedule of all upcoming departures</p>
        </div>
        <div className="page-header-actions">
          <div className="btn-group">
            <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setViewMode('list')}>
              <Icons.List style={{ width: 14, height: 14 }} /> List
            </button>
            <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => setViewMode('grid')}>
              <Icons.Calendar style={{ width: 14, height: 14 }} /> Grid
            </button>
          </div>
        </div>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <Icons.Calendar className="empty-state-icon" />
          <div className="empty-state-title">No scheduled departures</div>
          <div className="empty-state-text">Create trips and add departures to see them on the calendar.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          {Object.entries(grouped).map(([month, deps]) => (
            <div key={month}>
              <h2 style={{ font: '600 18px/1 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
                {month}
              </h2>
              
              {viewMode === 'list' ? (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Trip</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th>Occupancy</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {deps.map(dep => {
                        const trip = getTrip(dep.tripId);
                        const confirmed = getConfirmedCount(dep);
                        return (
                          <tr key={dep.id}>
                            <td>
                              <div className="td-bold">{trip?.title}</div>
                              <div className="td-muted">{trip?.region}</div>
                            </td>
                            <td>
                              <div>{formatDate(dep.departureDate)}</div>
                              <div className="td-muted">to {formatDate(dep.returnDate)}</div>
                            </td>
                            <td><StatusBadge status={dep.status} /></td>
                            <td style={{ minWidth: 150 }}>
                              <OccupancyBar confirmed={confirmed} max={dep.maxParticipants} min={dep.minParticipants} />
                            </td>
                            <td>
                              <Link to={`/trips/${dep.tripId}/departures/${dep.id}`} className="btn btn-secondary btn-sm">Manage</Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
                  {deps.map(dep => {
                    const trip = getTrip(dep.tripId);
                    const confirmed = getConfirmedCount(dep);
                    return (
                      <div className="card" key={dep.id} style={{ padding: 'var(--space-4)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <StatusBadge status={dep.status} />
                          <div style={{ font: '600 14px/1 var(--font-family)', color: 'var(--color-primary)' }}>
                            ${dep.price?.toLocaleString()}
                          </div>
                        </div>
                        <div style={{ font: '600 16px/1.2 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 4 }}>
                          {trip?.title}
                        </div>
                        <div style={{ font: '400 13px/1 var(--font-family)', color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                          {formatDate(dep.departureDate)} — {formatDate(dep.returnDate)}
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <OccupancyBar confirmed={confirmed} max={dep.maxParticipants} min={dep.minParticipants} />
                        </div>
                        <Link to={`/trips/${dep.tripId}/departures/${dep.id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                          Manage Departure
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
