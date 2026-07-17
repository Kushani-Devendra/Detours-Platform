import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { StatusBadge, Modal, ConfirmDialog, OccupancyBar } from '../../../components/ui/Components';
import { Icons } from '../../../components/ui/Icons';
import DepartureDetail from '../departures/DepartureDetail';
import DepartureForm from '../departures/DepartureForm';

const TRIP_TABS = ['Overview', 'Itinerary', 'Accommodations', "What's Included", 'Trip Notes', 'Departures', 'Audit Log'];

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, showToast, addAuditEntry, getDepartures, getConfirmedCount, getAvailableSpaces, isAtRisk } = useApp();

  const trip = state.trips.find(t => t.id === tripId);
  const [activeTab, setActiveTab] = useState('Overview');
  const [showDepartureForm, setShowDepartureForm] = useState(false);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (!trip) return (
    <div className="empty-state">
      <div className="empty-state-title">Trip not found</div>
      <Link to="/trips" className="btn btn-primary" style={{ marginTop: 16 }}>Back to Trips</Link>
    </div>
  );

  const departures = getDepartures(tripId);
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const auditEntries = state.auditLog.filter(e => e.entityId === tripId || departures.some(d => d.id === e.entityId));

  const cyclePublish = () => {
    const next = { Draft: 'Published', Published: 'Inactive', Inactive: 'Draft' };
    const newStatus = next[trip.publishStatus];
    addAuditEntry('Trip', trip.id, 'publishStatus', trip.publishStatus, newStatus);
    dispatch({ type: 'UPDATE_TRIP', payload: { id: trip.id, publishStatus: newStatus } });
    showToast(`Status changed to ${newStatus}`, 'success');
  };

  const deleteTrip = () => {
    dispatch({ type: 'DELETE_TRIP', payload: trip.id });
    showToast('Trip deleted', 'success');
    navigate('/trips');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left" style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          {trip.heroImage && (
            <div style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--color-border)' }}>
              <img src={trip.heroImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div>
            <h1 className="page-title">{trip.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <StatusBadge status={trip.publishStatus} />
              <span className="badge badge-neutral">{trip.tripType}</span>
              <span className="badge badge-neutral">{trip.region}</span>
              <span className="text-sm text-muted">{trip.duration} days</span>
            </div>
          </div>
        </div>
        <div className="page-header-actions">
          <a href={`/public/tours/${trip.slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
            <Icons.ExternalLink style={{ width: 13, height: 13 }} />
            View Public Page
          </a>
          <button className="btn btn-secondary btn-sm" onClick={cyclePublish} id="trip-detail-publish-btn">
            {trip.publishStatus === 'Published' ? <Icons.EyeOff style={{ width: 13, height: 13 }} /> : <Icons.Eye style={{ width: 13, height: 13 }} />}
            {trip.publishStatus === 'Published' ? 'Unpublish' : 'Publish'}
          </button>
          <Link to={`/trips/${tripId}/edit`} className="btn btn-secondary btn-sm">
            <Icons.Edit style={{ width: 13, height: 13 }} />
            Edit Trip
          </Link>
          <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(trip)}>
            <Icons.Trash style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-underline">
        {TRIP_TABS.map(tab => (
          <button key={tab} className={`tab-underline-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} id={`trip-detail-tab-${tab.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>
            {tab}
            {tab === 'Departures' && departures.length > 0 && (
              <span className="badge badge-neutral" style={{ marginLeft: 6 }}>{departures.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          <div>
            {/* Hero */}
            {trip.heroImage && (
              <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 'var(--space-5)', aspectRatio: '16/7', border: '1px solid var(--color-border)' }}>
                <img src={trip.heroImage} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {/* Short desc */}
            <div className="card card-padded" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="section-heading">Short Description</div>
              <div style={{ font: '400 14px/1.7 var(--font-family)', color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: trip.shortDescription || '<em>No description set</em>' }} />
            </div>
            {/* Full desc */}
            <div className="card card-padded">
              <div className="section-heading">Full Description</div>
              <div style={{ font: '400 14px/1.7 var(--font-family)', color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: trip.fullDescription || '<em>No description set</em>' }} />
            </div>
          </div>
          <div>
            {/* Details */}
            <div className="card card-padded" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="section-heading">Trip Details</div>
              <div className="detail-grid" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="detail-row">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value"><strong>{trip.duration}</strong> days</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Base Price</span>
                  <span className="detail-value"><strong>${trip.basePrice?.toLocaleString()}</strong></span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Departure City</span>
                  <span className="detail-value">{trip.departureCity}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">End City</span>
                  <span className="detail-value">{trip.endCity}</span>
                </div>
                <div className="detail-row" style={{ gridColumn: '1/-1' }}>
                  <span className="detail-label">Destinations</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                    {trip.destinations.map(d => <span key={d} className="tag">{d}</span>)}
                  </div>
                </div>
                <div className="detail-row" style={{ gridColumn: '1/-1' }}>
                  <span className="detail-label">URL Slug</span>
                  <span className="detail-value td-mono" style={{ fontSize: 12 }}>/{trip.slug}</span>
                </div>
              </div>
            </div>
            {/* Internal Notes */}
            {trip.internalNotes && (
              <div className="card card-padded" style={{ marginBottom: 'var(--space-4)', background: '#fffdf5', borderColor: 'rgba(193,120,0,0.2)' }}>
                <div className="section-heading">Internal Notes</div>
                <p style={{ font: '400 13px/1.6 var(--font-family)', color: 'var(--color-text-secondary)' }}>{trip.internalNotes}</p>
              </div>
            )}
            {/* Tags */}
            {trip.tags?.length > 0 && (
              <div className="card card-padded">
                <div className="section-heading">Tags</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {trip.tags.map(tag => <span key={tag} className="tag tag-primary">{tag}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Itinerary ── */}
      {activeTab === 'Itinerary' && (
        <div style={{ maxWidth: 760 }}>
          {trip.itinerary.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No itinerary stops</div>
              <Link to={`/trips/${tripId}/edit`} className="btn btn-primary" style={{ marginTop: 16 }}>Add Itinerary →</Link>
            </div>
          ) : trip.itinerary.map((stop, idx) => (
            <div className="accordion-item" key={stop.id}>
              <div className="accordion-header">
                <div>
                  <div className="accordion-title">{stop.stopTitle}</div>
                  <div className="accordion-subtitle">{stop.city} · {stop.dayRange}</div>
                </div>
                <Icons.ChevronDown style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }} />
              </div>
              <div className="accordion-body">
                <div style={{ font: '400 13px/1.7 var(--font-family)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }} dangerouslySetInnerHTML={{ __html: stop.description }} />
                {stop.includedActivities.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-3)' }}>
                    <div style={{ font: '600 11px/1 var(--font-family)', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-success)', marginBottom: 6 }}>Included</div>
                    <ul style={{ paddingLeft: 16 }}>
                      {stop.includedActivities.filter(Boolean).map((a, i) => <li key={i} style={{ font: '400 13px/1.6 var(--font-family)', color: 'var(--color-text-secondary)' }}>{a}</li>)}
                    </ul>
                  </div>
                )}
                {stop.optionalActivities.length > 0 && (
                  <div>
                    <div style={{ font: '600 11px/1 var(--font-family)', textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--color-text-muted)', marginBottom: 6 }}>Optional (extra cost)</div>
                    <ul style={{ paddingLeft: 16 }}>
                      {stop.optionalActivities.filter(Boolean).map((a, i) => <li key={i} style={{ font: '400 13px/1.6 var(--font-family)', color: 'var(--color-text-secondary)' }}>{a}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Accommodations ── */}
      {activeTab === 'Accommodations' && (
        <div style={{ maxWidth: 760 }}>
          {trip.accommodations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No accommodations added</div>
              <Link to={`/trips/${tripId}/edit`} className="btn btn-primary" style={{ marginTop: 16 }}>Add Accommodations →</Link>
            </div>
          ) : trip.accommodations.map((acc) => {
            const linkedStop = trip.itinerary.find(s => s.id === acc.linkedStop);
            return (
              <div className="card" key={acc.id} style={{ marginBottom: 'var(--space-4)', display: 'flex', overflow: 'hidden' }}>
                {acc.image && (
                  <div style={{ width: 180, flexShrink: 0 }}>
                    <img src={acc.image} alt={acc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div className="card-body" style={{ flex: 1 }}>
                  <div style={{ font: '600 15px/1.2 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 4 }}>{acc.name}</div>
                  {linkedStop && <div className="badge badge-neutral" style={{ marginBottom: 8 }}>{linkedStop.city}</div>}
                  <div style={{ font: '400 13px/1.6 var(--font-family)', color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: acc.description }} />
                  {acc.disclaimer && <div style={{ font: '400 11px/1.5 var(--font-family)', color: 'var(--color-text-muted)', marginTop: 8, fontStyle: 'italic' }}>{acc.disclaimer}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── What's Included ── */}
      {activeTab === "What's Included" && (
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            <div className="card card-padded">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Icons.CheckCircle style={{ width: 18, height: 18, color: 'var(--color-success)' }} />
                <span style={{ font: '600 14px/1 var(--font-family)', color: 'var(--color-brown-black)' }}>What's Included</span>
              </div>
              <div style={{ font: '400 13px/1.7 var(--font-family)', color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: trip.inclusions || '<em>Not set</em>' }} />
            </div>
            <div className="card card-padded">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Icons.X style={{ width: 18, height: 18, color: 'var(--color-error)' }} />
                <span style={{ font: '600 14px/1 var(--font-family)', color: 'var(--color-brown-black)' }}>Not Included</span>
              </div>
              <div style={{ font: '400 13px/1.7 var(--font-family)', color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: trip.exclusions || '<em>Not set</em>' }} />
            </div>
          </div>
          {trip.additionalSpendingNote && (
            <div className="info-banner" style={{ marginTop: 'var(--space-4)' }}>
              <Icons.DollarSign style={{ width: 16, height: 16, color: 'var(--color-info)' }} />
              <span className="info-banner-text">{trip.additionalSpendingNote}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Trip Notes ── */}
      {activeTab === 'Trip Notes' && (
        <div style={{ maxWidth: 760 }}>
          <div className="card card-padded">
            <div style={{ font: '400 14px/1.8 var(--font-family)', color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: trip.tripNotes || '<em>No trip notes added yet.</em>' }} />
          </div>
        </div>
      )}

      {/* ── Departures ── */}
      {activeTab === 'Departures' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <button className="btn btn-primary" onClick={() => { setSelectedDeparture(null); setShowDepartureForm(true); }} id="add-departure-btn">
              <Icons.Plus style={{ width: 14, height: 14 }} />
              Add Departure
            </button>
          </div>
          {departures.length === 0 ? (
            <div className="empty-state">
              <Icons.Calendar className="empty-state-icon" />
              <div className="empty-state-title">No departures yet</div>
              <div className="empty-state-text">Create departure instances for guests to register for.</div>
              <button className="btn btn-primary" onClick={() => setShowDepartureForm(true)}>Add First Departure</button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Departure Date</th>
                    <th>Return Date</th>
                    <th>Price</th>
                    <th>Deposit</th>
                    <th>Occupancy</th>
                    <th>Status</th>
                    <th>Waitlist</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {departures.map(dep => {
                    const confirmed = getConfirmedCount(dep);
                    const depAtRisk = isAtRisk(dep);
                    return (
                      <tr key={dep.id} style={depAtRisk ? { background: '#fffdf5' } : {}}>
                        <td className="td-bold">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {depAtRisk && <Icons.AlertTriangle style={{ width: 13, height: 13, color: 'var(--color-warning)', flexShrink: 0 }} />}
                            {formatDate(dep.departureDate)}
                          </div>
                        </td>
                        <td className="td-muted">{formatDate(dep.returnDate)}</td>
                        <td>${dep.price?.toLocaleString()}</td>
                        <td>${dep.depositAmount?.toLocaleString()}</td>
                        <td style={{ minWidth: 160 }}>
                          <OccupancyBar confirmed={confirmed} max={dep.maxParticipants} min={dep.minParticipants} />
                          {depAtRisk && (
                            <div style={{ font: '400 11px/1 var(--font-family)', color: 'var(--color-warning)', marginTop: 3 }}>
                              {confirmed}/{dep.minParticipants} minimum needed
                            </div>
                          )}
                        </td>
                        <td><StatusBadge status={dep.status} /></td>
                        <td>
                          {dep.waitlistEnabled ? (
                            <span style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>
                              {dep.waitlist?.length || 0} waiting
                            </span>
                          ) : <span className="td-muted">Off</span>}
                        </td>
                        <td>
                          <Link to={`/trips/${tripId}/departures/${dep.id}`} className="btn btn-secondary btn-sm">
                            Manage
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Audit Log ── */}
      {activeTab === 'Audit Log' && (
        <div style={{ maxWidth: 700 }}>
          <div className="card card-padded">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Icons.FileText style={{ width: 16, height: 16, color: 'var(--color-text-muted)' }} />
              <span style={{ font: '500 13px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>Read-only audit history — cannot be edited or deleted</span>
            </div>
            {auditEntries.length === 0 && <div className="text-muted" style={{ textAlign: 'center', padding: 32 }}>No changes recorded yet.</div>}
            {auditEntries.map(entry => (
              <div className="audit-entry" key={entry.id}>
                <div className="audit-dot" />
                <div className="audit-entry-content">
                  <div className="audit-entry-title">
                    <strong>{entry.entityType}</strong>: <em>{entry.field}</em> changed from <strong>"{entry.oldValue}"</strong> to <strong>"{entry.newValue}"</strong>
                  </div>
                  <div className="audit-entry-meta">
                    {entry.user} · {new Date(entry.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Departure Form Modal */}
      {showDepartureForm && (
        <DepartureForm
          tripId={tripId}
          trip={trip}
          departure={selectedDeparture}
          onClose={() => setShowDepartureForm(false)}
        />
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={deleteTrip}
        title="Delete Trip"
        message={`Are you sure you want to delete "${trip.title}"? This cannot be undone.`}
        confirmLabel="Delete Trip"
      />
    </div>
  );
}
