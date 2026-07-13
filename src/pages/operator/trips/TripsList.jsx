import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { StatusBadge, Modal, ConfirmDialog } from '../../../components/ui/Components';
import { Icons } from '../../../components/ui/Icons';

export default function TripsList() {
  const { state, dispatch, showToast, addAuditEntry, getDepartures, isAtRisk } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const filtered = useMemo(() => {
    return state.trips.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.destinations.some(d => d.toLowerCase().includes(search.toLowerCase()));
      const matchType = filterType === 'All' || t.tripType === filterType;
      const matchStatus = filterStatus === 'All' || t.publishStatus === filterStatus;
      const matchRegion = filterRegion === 'All' || t.region === filterRegion;
      return matchSearch && matchType && matchStatus && matchRegion;
    });
  }, [state.trips, search, filterType, filterStatus, filterRegion]);

  const cyclePublishStatus = (trip) => {
    const next = { Draft: 'Published', Published: 'Inactive', Inactive: 'Draft' };
    const newStatus = next[trip.publishStatus];
    addAuditEntry('Trip', trip.id, 'publishStatus', trip.publishStatus, newStatus);
    dispatch({ type: 'UPDATE_TRIP', payload: { id: trip.id, publishStatus: newStatus } });
    showToast(`"${trip.title}" set to ${newStatus}`, 'success');
  };

  const deleteTrip = (trip) => {
    dispatch({ type: 'DELETE_TRIP', payload: trip.id });
    showToast(`"${trip.title}" deleted`, 'success');
    setConfirmDelete(null);
  };

  const getDepartureSummary = (tripId) => {
    const deps = getDepartures(tripId);
    const open = deps.filter(d => d.status === 'Open for Booking').length;
    const atRiskCount = deps.filter(d => isAtRisk(d)).length;
    return { total: deps.length, open, atRisk: atRiskCount };
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">All Trips</h1>
          <p className="page-subtitle">{state.trips.length} trips · {state.trips.filter(t => t.publishStatus === 'Published').length} published</p>
        </div>
        <div className="page-header-actions">
          <Link to="/trips/new" className="btn btn-primary" id="trips-list-new-btn">
            <Icons.Plus style={{ width: 14, height: 14 }} />
            New Trip
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Icons.Search style={{ width: 14, height: 14 }} />
          <input
            type="search"
            className="search-input"
            placeholder="Search trips or destinations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="trips-search"
          />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterType} onChange={e => setFilterType(e.target.value)} id="filter-type">
          <option value="All">All Types</option>
          <option>Standard Trip</option>
          <option>One-Time Trip</option>
          <option>Trip Extension</option>
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} id="filter-status">
          <option value="All">All Statuses</option>
          <option>Draft</option>
          <option>Published</option>
          <option>Inactive</option>
        </select>
        <select className="form-select" style={{ width: 'auto', minWidth: 130 }} value={filterRegion} onChange={e => setFilterRegion(e.target.value)} id="filter-region">
          <option value="All">All Regions</option>
          <option>Europe</option>
          <option>Asia-Pacific</option>
          <option>Africa</option>
          <option>Latin America</option>
          <option>Other</option>
        </select>
        {(search || filterType !== 'All' || filterStatus !== 'All' || filterRegion !== 'All') && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setFilterType('All'); setFilterStatus('All'); setFilterRegion('All'); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}></th>
              <th>Trip</th>
              <th>Type</th>
              <th>Region</th>
              <th>Price</th>
              <th>Departures</th>
              <th>Status</th>
              <th style={{ width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <Icons.Map className="empty-state-icon" />
                    <div className="empty-state-title">No trips found</div>
                    <div className="empty-state-text">Try adjusting your filters or create a new trip.</div>
                    <Link to="/trips/new" className="btn btn-primary">New Trip</Link>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map(trip => {
              const depSummary = getDepartureSummary(trip.id);
              return (
                <tr key={trip.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/trips/${trip.id}`)}>
                  <td onClick={e => e.stopPropagation()}>
                    {trip.heroImage && (
                      <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden' }}>
                        <img src={trip.heroImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="td-bold">{trip.title}</div>
                    <div className="td-muted">{trip.departureCity} → {trip.endCity} · {trip.duration} days</div>
                    {depSummary.atRisk > 0 && (
                      <span className="badge badge-at-risk" style={{ marginTop: 4 }}>
                        <Icons.AlertTriangle style={{ width: 10, height: 10 }} />
                        {depSummary.atRisk} at-risk
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-neutral">{trip.tripType}</span>
                  </td>
                  <td className="td-muted">{trip.region}</td>
                  <td>
                    <span style={{ font: '600 13px/1 var(--font-family)' }}>${trip.basePrice.toLocaleString()}</span>
                  </td>
                  <td>
                    <span style={{ font: '500 13px/1 var(--font-family)' }}>{depSummary.total}</span>
                    <span className="td-muted"> · {depSummary.open} open</span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <StatusBadge status={trip.publishStatus} />
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 items-center">
                      {/* Publish Toggle */}
                      <button
                        className="btn btn-ghost btn-sm"
                        title={`Set to ${trip.publishStatus === 'Published' ? 'Inactive' : 'Published'}`}
                        onClick={() => cyclePublishStatus(trip)}
                        id={`trip-status-toggle-${trip.id}`}
                      >
                        {trip.publishStatus === 'Published' ? <Icons.EyeOff style={{ width: 14, height: 14 }} /> : <Icons.Eye style={{ width: 14, height: 14 }} />}
                      </button>
                      <Link to={`/trips/${trip.id}/edit`} className="btn btn-ghost btn-sm" onClick={e => e.stopPropagation()}>
                        <Icons.Edit style={{ width: 14, height: 14 }} />
                      </Link>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--color-error)' }}
                        onClick={() => setConfirmDelete(trip)}
                        id={`trip-delete-${trip.id}`}
                      >
                        <Icons.Trash style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => deleteTrip(confirmDelete)}
        title="Delete Trip"
        message={`Are you sure you want to delete "${confirmDelete?.title}"? This action cannot be undone and will also remove all associated departures.`}
        confirmLabel="Delete Trip"
      />
    </div>
  );
}
