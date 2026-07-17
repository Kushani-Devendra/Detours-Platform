import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { StatusBadge, Modal, OccupancyBar } from '../../../components/ui/Components';
import { Icons } from '../../../components/ui/Icons';
import DepartureForm from './DepartureForm';

const TABS = ['Overview', 'Bookings', 'Rooming', 'Financials', 'Waitlist'];

const WAITLIST_STATUS_LABELS = {
  Waiting:  { label: 'Waiting',   color: 'var(--color-text-muted)',   bg: 'var(--color-surface)' },
  Notified: { label: 'Notified',  color: '#1a6b3c',                   bg: '#e8f5ed' },
  Expired:  { label: 'Expired',   color: 'var(--color-error)',        bg: '#fef2f2' },
  Converted:{ label: 'Converted', color: 'var(--color-primary)',      bg: 'rgba(240,81,35,0.08)' },
};

export default function DepartureDetail() {
  const { tripId, departureId } = useParams();
  const { state, dispatch, showToast, addAuditEntry, getConfirmedCount, isAtRisk } = useApp();

  const trip = state.trips.find(t => t.id === tripId);
  const departure = state.departures.find(d => d.id === departureId);

  const [activeTab, setActiveTab] = useState('Overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: '', type: 'Double', capacity: 2, price: 0, description: '' });
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeForm, setChargeForm] = useState({ description: '', amount: '', guestIds: [] });

  if (!trip || !departure) return <div className="empty-state">Departure not found</div>;

  // ── Traveler-level confirmed count (per spec 4.3: count Traveler on Trip records, not bookings)
  const confirmedTravelers = getConfirmedCount(departure);
  const availableSpaces   = Math.max(0, departure.maxParticipants - confirmedTravelers);
  const atRisk            = isAtRisk(departure);

  const bookings          = state.bookings.filter(b => b.departureId === departureId);
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');

  // Financials
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid    = confirmedBookings.reduce((sum, b) => sum + (b.amountPaid  || 0), 0);
  const balanceDue   = totalRevenue - totalPaid;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ── Waitlist actions ──
  const EXPIRY_HOURS = 48;

  const handleInviteToBook = (entry) => {
    const now = new Date();
    const expiryAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000).toISOString();
    const updated = { ...entry, status: 'Notified', notifiedAt: now.toISOString(), expiryAt };
    dispatch({ type: 'UPDATE_WAITLIST_ENTRY', payload: { departureId, entry: updated } });
    addAuditEntry('Departure', departureId, 'waitlist_notified', entry.status, 'Notified');
    showToast(`Booking link sent to ${entry.guestName || entry.name}. Expires in 48 hours.`, 'success');
  };

  const handleMarkExpired = (entry) => {
    const updated = { ...entry, status: 'Expired' };
    dispatch({ type: 'UPDATE_WAITLIST_ENTRY', payload: { departureId, entry: updated } });
    showToast('Waitlist entry marked as expired. Next guest in queue will be notified.', 'info');
  };

  const getExpiryDisplay = (entry) => {
    if (!entry.expiryAt) return null;
    const ms = new Date(entry.expiryAt) - new Date();
    if (ms <= 0) return { label: 'Expired', color: 'var(--color-error)' };
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return { label: `Expires in ${hrs}h ${mins}m`, color: 'var(--color-warning)' };
  };

  const handleExportRoster = () => {
    const travelers = [];
    bookings.filter(b => b.status === 'Confirmed').forEach(b => {
      const ts = b.travelers || [{
        id: b.id, firstName: b.primaryGuest?.firstName, lastName: b.primaryGuest?.lastName, preferredName: b.primaryGuestName,
        roomingPreference: b.roomSelection, bedTypePreference: b.bedTypePreference, dietaryRequirements: '', roomAssignment: b.roomAssignment
      }];
      ts.forEach(t => travelers.push({ ...t, bookingRef: b.ref || b.id }));
    });

    const headers = ['First Name', 'Last Name', 'Preferred Name', 'Rooming Preference', 'Bed Type Preference', 'Dietary Requirements', 'Room Assignment', 'Booking Reference'];
    const rows = travelers.map(t => [
      t.firstName || '', t.lastName || '', t.preferredName || '',
      t.roomingPreference || '', t.bedTypePreference || '', t.dietaryRequirements || '',
      t.roomAssignment || '', t.bookingRef || ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `roster_${departure.departureDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Roster exported successfully', 'success');
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Link to={`/trips/${tripId}`} className="text-muted" style={{ textDecoration: 'none', font: '500 13px/1 var(--font-family)' }}>
              {trip.title}
            </Link>
            <Icons.ChevronRight style={{ width: 14, height: 14, color: 'var(--color-text-muted)' }} />
            <h1 className="page-title" style={{ fontSize: 20 }}>{formatDate(departure.departureDate)}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBadge status={departure.status} />
            {trip.brand && (
              <span className="badge badge-neutral" style={{
                background: trip.brand === 'Mawari' ? 'rgba(91,68,156,0.1)' : 'rgba(240,81,35,0.1)',
                color: trip.brand === 'Mawari' ? '#5b449c' : 'var(--color-primary)',
                border: 'none',
              }}>{trip.brand}</span>
            )}
            <span className="badge badge-neutral">{departure.departureDate} to {departure.returnDate}</span>
            {atRisk && (
              <span className="badge badge-at-risk" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icons.AlertTriangle style={{ width: 11, height: 11 }} /> At Risk
              </span>
            )}
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>
            <Icons.Edit style={{ width: 14, height: 14 }} /> Edit Departure
          </button>
        </div>
      </div>

      {/* At-Risk Alert Banner */}
      {atRisk && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 16px', borderRadius: 10, marginBottom: 'var(--space-4)',
          background: '#fffdf5', border: '1px solid rgba(193,120,0,0.3)',
        }}>
          <Icons.AlertTriangle style={{ width: 18, height: 18, color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ font: '600 13px/1 var(--font-family)', color: '#c17800', marginBottom: 4 }}>
              At-Risk Departure
            </div>
            <div style={{ font: '400 12px/1.5 var(--font-family)', color: 'var(--color-text-secondary)' }}>
              This departure has <strong>{confirmedTravelers}</strong> confirmed traveler{confirmedTravelers !== 1 ? 's' : ''} against a minimum of <strong>{departure.minParticipants}</strong>.
              {' '}The departure date is within 90 days. Consider promoting or cancelling.
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-underline">
        {TABS.map(tab => (
          <button key={tab} className={`tab-underline-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
            {tab === 'Waitlist' && departure.waitlist?.length > 0 && (
              <span className="badge badge-waitlist" style={{ marginLeft: 6 }}>{departure.waitlist.length}</span>
            )}
            {tab === 'Bookings' && (
              <span className="badge badge-neutral" style={{ marginLeft: 6 }}>{confirmedBookings.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)' }}>
          <div>
            {/* Occupancy */}
            <div className="card card-padded" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="section-heading">Occupancy & Registration</div>
              <div style={{ marginBottom: 24 }}>
                <OccupancyBar confirmed={confirmedTravelers} max={departure.maxParticipants} min={departure.minParticipants} />
              </div>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Confirmed Travelers</span>
                  <span className="detail-value"><strong>{confirmedTravelers}</strong></span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Minimum Required</span>
                  <span className="detail-value" style={{ color: confirmedTravelers < departure.minParticipants ? 'var(--color-warning)' : 'inherit' }}>
                    {departure.minParticipants}
                    {confirmedTravelers < departure.minParticipants && (
                      <span style={{ marginLeft: 6, font: '400 11px/1 var(--font-family)', color: 'var(--color-warning)' }}>
                        ({departure.minParticipants - confirmedTravelers} more needed)
                      </span>
                    )}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Maximum Capacity</span>
                  <span className="detail-value">{departure.maxParticipants}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Available Spaces</span>
                  <span className="detail-value" style={{ color: availableSpaces === 0 ? 'var(--color-error)' : availableSpaces <= 3 ? 'var(--color-warning)' : 'inherit' }}>
                    {availableSpaces}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Waitlist</span>
                  <span className="detail-value">{departure.waitlistEnabled ? `${departure.waitlist?.length || 0} waiting` : 'Disabled'}</span>
                </div>
              </div>
            </div>

            {/* Pricing & Dates */}
            <div className="card card-padded">
              <div className="section-heading">Pricing & Dates</div>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Base Price</span>
                  <span className="detail-value">${departure.price?.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Deposit Amount</span>
                  <span className="detail-value">${departure.depositAmount?.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Departure Date</span>
                  <span className="detail-value">{formatDate(departure.departureDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Return Date</span>
                  <span className="detail-value">{formatDate(departure.returnDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Departure City</span>
                  <span className="detail-value">{departure.departureCity || trip.departureCity || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">End City</span>
                  <span className="detail-value">{departure.endCity || trip.endCity || '—'}</span>
                </div>
                <div className="detail-row" style={{ borderTop: '1px solid var(--color-divider)', paddingTop: 8, marginTop: 4 }}>
                  <span className="detail-label">Balance Deadline</span>
                  <span className="detail-value">
                    <strong>{formatDate(departure.balanceDeadlineDate)}</strong>
                    {departure.balancePaymentDeadlineDays && (
                      <span style={{ marginLeft: 6, font: '400 11px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>
                        ({departure.balancePaymentDeadlineDays} days before departure)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            {/* Internal Notes */}
            {departure.internalNotes && (
              <div className="card card-padded" style={{ background: '#fffdf5', borderColor: 'rgba(193,120,0,0.2)', marginBottom: 'var(--space-4)' }}>
                <div className="section-heading">Internal Notes</div>
                <p style={{ font: '400 13px/1.6 var(--font-family)', color: 'var(--color-text-secondary)' }}>{departure.internalNotes}</p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="card card-padded">
              <div className="section-heading">Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => showToast('Feature coming soon: Manual Booking', 'info')}>
                  <Icons.Plus style={{ width: 14, height: 14 }} /> Add Manual Booking
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => showToast('Feature coming soon: Email Guests', 'info')}>
                  <Icons.Mail style={{ width: 14, height: 14 }} /> Email All Guests
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={handleExportRoster}>
                  <Icons.Download style={{ width: 14, height: 14 }} /> Export Guest Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bookings ── */}
      {activeTab === 'Bookings' && (
        <div>
          {bookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No bookings yet</div>
              <div className="empty-state-text">Once guests book, they will appear here.</div>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Guest Name</th>
                    <th>Email</th>
                    <th>Travelers</th>
                    <th>Status</th>
                    <th>Booking Date</th>
                    <th>Room Type</th>
                    <th>Total</th>
                    <th>Paid</th>
                    <th>Balance</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const balance = (b.totalAmount || 0) - (b.amountPaid || 0);
                    const tCount  = b.travelers?.length || 1;
                    return (
                      <tr key={b.id}>
                        <td className="td-bold">{b.primaryGuestName || `${b.primaryGuest?.firstName} ${b.primaryGuest?.lastName}`}</td>
                        <td className="td-muted">{b.primaryGuestEmail || b.primaryGuest?.email}</td>
                        <td><span className="badge badge-neutral">{tCount}</span></td>
                        <td><StatusBadge status={b.status} /></td>
                        <td>{formatDate(b.bookingDate || b.bookedAt)}</td>
                        <td>{b.roomSelection || '—'}</td>
                        <td>${b.totalAmount?.toLocaleString()}</td>
                        <td style={{ color: b.amountPaid > 0 ? 'var(--color-success)' : 'inherit' }}>${(b.amountPaid || 0).toLocaleString()}</td>
                        <td style={{ color: balance > 0 ? 'var(--color-error)' : 'inherit' }}>${balance.toLocaleString()}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => showToast(`Manage booking ${b.id}`, 'info')}>Manage</button>
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

      {/* ── Rooming ── */}
      {activeTab === 'Rooming' && (
        <div style={{ maxWidth: 860 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Room Inventory</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowRoomModal(true)}>+ Add Room</button>
          </div>
          
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Room Name</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(!departure.rooms || departure.rooms.length === 0) ? (
                    <tr><td colSpan="5" className="td-muted" style={{ textAlign: 'center', padding: 24 }}>No room inventory configured. Using preference-only flow.</td></tr>
                  ) : (
                    departure.rooms.map(r => (
                      <tr key={r.id}>
                        <td className="td-bold">{r.name}</td>
                        <td>{r.type}</td>
                        <td>{r.capacity} guests</td>
                        <td>${r.price?.toLocaleString()}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => {
                            const updatedRooms = departure.rooms.filter(room => room.id !== r.id);
                            dispatch({ type: 'UPDATE_DEPARTURE', payload: { ...departure, rooms: updatedRooms } });
                          }}>Remove</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <h3 style={{ margin: '0 0 16px 0' }}>Guest Room Assignments</h3>
          <div className="card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Booking Ref</th>
                    <th>Room Preference</th>
                    <th>Bed Type</th>
                    <th>Room Assignment</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.filter(b => b.status === 'Confirmed').flatMap(b => {
                    const ts = b.travelers || [{ id: b.id, firstName: b.primaryGuest?.firstName, lastName: b.primaryGuest?.lastName, preferredName: b.primaryGuestName }];
                    return ts.map(t => (
                      <tr key={t.id}>
                        <td className="td-bold">{t.firstName || t.preferredName} {t.lastName}</td>
                        <td className="td-muted">{b.ref || b.id?.substring(0, 8)}</td>
                        <td>{b.roomSelection || t.roomingPreference || '—'}</td>
                        <td>{b.bedTypePreference || t.bedTypePreference || '—'}</td>
                        <td>
                          <select 
                            className="form-select" 
                            style={{ padding: '4px 8px', fontSize: 13, height: 'auto' }}
                            value={t.roomAssignment || ''}
                            onChange={(e) => {
                              const newAssignment = e.target.value;
                              const updatedTravelers = ts.map(tr => tr.id === t.id ? { ...tr, roomAssignment: newAssignment } : tr);
                              dispatch({ type: 'UPDATE_BOOKING', payload: { ...b, travelers: updatedTravelers } });
                            }}
                          >
                            <option value="">Unassigned</option>
                            <optgroup label="Inventory Rooms">
                              {(departure.rooms || []).map(r => <option key={r.id} value={r.name}>{r.name} ({r.type})</option>)}
                            </optgroup>
                            <optgroup label="Manual Groups">
                              <option value="Solo Room">Solo Room</option>
                              <option value="Double Room">Double Room</option>
                              <option value="Twin Room">Twin Room</option>
                            </optgroup>
                          </select>
                        </td>
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Financials ── */}
      {activeTab === 'Financials' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            {departure.status === 'Completed' && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowChargeModal(true)}>+ Raise Post-Trip Charge</button>
            )}
          </div>
          <div className="stats-grid" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="stat-card">
              <div className="stat-icon"><Icons.DollarSign style={{ width: 28, height: 28 }} /></div>
              <div className="stat-label">Total Expected Revenue</div>
              <div className="stat-value">${totalRevenue.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Icons.CheckCircle style={{ width: 28, height: 28, color: 'var(--color-success)' }} /></div>
              <div className="stat-label">Total Collected</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>${totalPaid.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Icons.AlertTriangle style={{ width: 28, height: 28, color: 'var(--color-error)' }} /></div>
              <div className="stat-label">Balance Due</div>
              <div className="stat-value" style={{ color: balanceDue > 0 ? 'var(--color-error)' : 'inherit' }}>${balanceDue.toLocaleString()}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Payment Schedule</span></div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Deposit Paid</th>
                    <th>Final Payment Status</th>
                    <th>Total Received</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedBookings.map(b => (
                    <tr key={b.id}>
                      <td className="td-bold">{b.primaryGuestName || `${b.primaryGuest?.firstName} ${b.primaryGuest?.lastName}`}</td>
                      <td>
                        {(b.amountPaid || 0) >= (departure.depositAmount || 0)
                          ? <span className="badge badge-success">Paid</span>
                          : <span className="badge badge-warning">Pending</span>}
                      </td>
                      <td>
                        {(b.amountPaid || 0) >= (b.totalAmount || 0)
                          ? <span className="badge badge-success">Paid in Full</span>
                          : <span className="badge badge-warning">${((b.totalAmount || 0) - (b.amountPaid || 0)).toLocaleString()} Due</span>}
                      </td>
                      <td>${(b.amountPaid || 0).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => showToast('Payment reminder sent', 'success')}>Remind</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {departure.postTripCharges && departure.postTripCharges.length > 0 && (
            <div className="card" style={{ marginTop: 'var(--space-6)' }}>
              <div className="card-header"><span className="card-title">Post-Trip Charges</span></div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Guests Applied</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departure.postTripCharges.map(ptc => (
                      <tr key={ptc.id}>
                        <td>{formatDate(ptc.createdAt)}</td>
                        <td>{ptc.description}</td>
                        <td>
                          {ptc.guestIds.map(gid => {
                            const b = confirmedBookings.find(bk => bk.id === gid);
                            return b ? b.primaryGuestName || b.primaryGuest?.firstName : gid;
                          }).join(', ')}
                        </td>
                        <td style={{ color: 'var(--color-error)' }}>+${ptc.amount?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Waitlist ── */}
      {activeTab === 'Waitlist' && (
        <div style={{ maxWidth: 860 }}>
          {!departure.waitlistEnabled ? (
            <div className="empty-state">
              <div className="empty-state-title">Waitlist is disabled</div>
              <div className="empty-state-text">Enable the waitlist in the departure settings to allow guests to join when the departure is sold out.</div>
              <button className="btn btn-primary" onClick={() => setShowEdit(true)}>Enable Waitlist</button>
            </div>
          ) : departure.waitlist?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">Waitlist is empty</div>
              <div className="empty-state-text">No guests are currently on the waitlist.</div>
            </div>
          ) : (
            <>
              <div className="info-banner" style={{ marginBottom: 'var(--space-4)' }}>
                <Icons.Info style={{ width: 16, height: 16, color: 'var(--color-info)' }} />
                <span className="info-banner-text">
                  Waitlist entries are ordered by submission date. When a space becomes available, click <strong>Invite to Book</strong> to send a time-limited booking link (expires in {EXPIRY_HOURS} hours).
                </span>
              </div>
              <div className="card">
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Guest Name</th>
                        <th>Email</th>
                        <th>Travelers</th>
                        <th>Message</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(departure.waitlist)].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)).map((w, i) => {
                        const statusDef = WAITLIST_STATUS_LABELS[w.status] || WAITLIST_STATUS_LABELS.Waiting;
                        const expiry   = w.status === 'Notified' ? getExpiryDisplay(w) : null;
                        return (
                          <tr key={w.id}>
                            <td><span className="badge badge-neutral">#{i + 1}</span></td>
                            <td className="td-bold">{w.guestName || w.name}</td>
                            <td className="td-muted">{w.email}</td>
                            <td>{w.travelers || 1}</td>
                            <td style={{ maxWidth: 180, whiteSpace: 'normal', fontSize: 12, color: 'var(--color-text-muted)' }}>{w.message || '—'}</td>
                            <td>{formatDate(w.submittedAt)}</td>
                            <td>
                              <div>
                                <span style={{
                                  display: 'inline-block', padding: '3px 8px', borderRadius: 20,
                                  font: '500 11px/1.4 var(--font-family)',
                                  color: statusDef.color, background: statusDef.bg,
                                }}>
                                  {statusDef.label}
                                </span>
                                {expiry && (
                                  <div style={{ font: '400 11px/1 var(--font-family)', color: expiry.color, marginTop: 3 }}>
                                    {expiry.label}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {w.status === 'Waiting' && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleInviteToBook(w)}
                                  >
                                    Invite to Book
                                  </button>
                                )}
                                {w.status === 'Notified' && (
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ color: 'var(--color-error)' }}
                                    onClick={() => handleMarkExpired(w)}
                                  >
                                    Mark Expired
                                  </button>
                                )}
                                {w.status === 'Expired' && (
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleInviteToBook(w)}
                                  >
                                    Re-invite
                                  </button>
                                )}
                                {w.status === 'Converted' && (
                                  <span style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-success)' }}>✓ Booked</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {showEdit && (
        <DepartureForm tripId={tripId} trip={trip} departure={departure} onClose={() => setShowEdit(false)} />
      )}

      {/* Room Inventory Modal */}
      {showRoomModal && (
        <Modal isOpen={true} onClose={() => setShowRoomModal(false)} title="Add Room Inventory" size="md" footer={
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-ghost" onClick={() => setShowRoomModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => {
              if (!roomForm.name || !roomForm.capacity || !roomForm.price) return showToast('Please fill all required fields', 'error');
              const newRoom = { id: `rm-${Date.now()}`, ...roomForm };
              const updatedRooms = [...(departure.rooms || []), newRoom];
              dispatch({ type: 'UPDATE_DEPARTURE', payload: { ...departure, rooms: updatedRooms } });
              setShowRoomModal(false);
              setRoomForm({ name: '', type: 'Double', capacity: 2, price: 0, description: '' });
              showToast('Room added successfully', 'success');
            }}>Save Room</button>
          </div>
        }>
          <div className="form-group">
            <label className="form-label">Room Name / Number <span className="required">*</span></label>
            <input className="form-input" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} placeholder="e.g. Garden Suite, Cabin 4" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Room Type <span className="required">*</span></label>
              <select className="form-select" value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})}>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Twin">Twin</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Capacity <span className="required">*</span></label>
              <input type="number" className="form-input" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: Number(e.target.value)})} min="1" max="4" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Price (USD) <span className="required">*</span></label>
            <input type="number" className="form-input" value={roomForm.price} onChange={e => setRoomForm({...roomForm, price: Number(e.target.value)})} />
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>Per-room price. Overrides base trip price when selected.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" rows="2" value={roomForm.description} onChange={e => setRoomForm({...roomForm, description: e.target.value})} placeholder="e.g. Sea view, en-suite bathroom"></textarea>
          </div>
        </Modal>
      )}

      {/* Post-Trip Charge Modal */}
      {showChargeModal && (
        <Modal isOpen={true} onClose={() => setShowChargeModal(false)} title="Raise Post-Trip Charge" size="md" footer={
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-ghost" onClick={() => setShowChargeModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={() => {
              if (!chargeForm.description || !chargeForm.amount || chargeForm.guestIds.length === 0) return showToast('Please fill all fields and select guests', 'error');
              const newCharge = {
                id: `ptc-${Date.now()}`,
                createdAt: new Date().toISOString(),
                description: chargeForm.description,
                amount: Number(chargeForm.amount),
                guestIds: chargeForm.guestIds
              };
              const updatedCharges = [...(departure.postTripCharges || []), newCharge];
              dispatch({ type: 'UPDATE_DEPARTURE', payload: { ...departure, postTripCharges: updatedCharges } });
              
              // Apply to individual bookings
              chargeForm.guestIds.forEach(gid => {
                const b = confirmedBookings.find(bk => bk.id === gid);
                if (b) {
                  const updatedTotal = (b.totalAmount || 0) + Number(chargeForm.amount);
                  dispatch({ type: 'UPDATE_BOOKING', payload: { ...b, totalAmount: updatedTotal } });
                }
              });

              setShowChargeModal(false);
              setChargeForm({ description: '', amount: '', guestIds: [] });
              showToast('Post-trip charge raised successfully. Guests will be notified.', 'success');
            }}>Raise Charge</button>
          </div>
        }>
          <div className="info-banner" style={{ marginBottom: 16 }}>
            <Icons.Info style={{ width: 16, height: 16, color: 'var(--color-info)' }} />
            <span className="info-banner-text">Post-trip charges are added to the guest's booking total and an email will be sent with a payment link.</span>
          </div>
          <div className="form-group">
            <label className="form-label">Description <span className="required">*</span></label>
            <input className="form-input" value={chargeForm.description} onChange={e => setChargeForm({...chargeForm, description: e.target.value})} placeholder="e.g. Minibar, Extra Excursion" />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (USD) <span className="required">*</span></label>
            <input type="number" className="form-input" value={chargeForm.amount} onChange={e => setChargeForm({...chargeForm, amount: Number(e.target.value)})} placeholder="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Apply to Guests <span className="required">*</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, padding: 8 }}>
              {confirmedBookings.map(b => (
                <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={chargeForm.guestIds.includes(b.id)} 
                    onChange={e => {
                      if (e.target.checked) setChargeForm({...chargeForm, guestIds: [...chargeForm.guestIds, b.id]});
                      else setChargeForm({...chargeForm, guestIds: chargeForm.guestIds.filter(id => id !== b.id)});
                    }}
                  />
                  <span style={{ fontSize: 14 }}>{b.primaryGuestName || `${b.primaryGuest?.firstName} ${b.primaryGuest?.lastName}`} (Ref: {b.ref || b.id?.substring(0,8)})</span>
                </label>
              ))}
              {confirmedBookings.length === 0 && <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>No confirmed guests on this departure.</span>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
