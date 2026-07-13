import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { StatusBadge, Modal, OccupancyBar, Dropdown } from '../../../components/ui/Components';
import { Icons } from '../../../components/ui/Icons';
import DepartureForm from './DepartureForm';

const TABS = ['Overview', 'Bookings', 'Rooming', 'Financials', 'Waitlist'];

export default function DepartureDetail() {
  const { tripId, departureId } = useParams();
  const { state, showToast } = useApp();

  const trip = state.trips.find(t => t.id === tripId);
  const departure = state.departures.find(d => d.id === departureId);

  const [activeTab, setActiveTab] = useState('Overview');
  const [showEdit, setShowEdit] = useState(false);

  if (!trip || !departure) return <div className="empty-state">Departure not found</div>;

  const bookings = state.bookings.filter(b => b.departureId === departureId);
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed');
  
  // Calculate totals
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalPaid = confirmedBookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
  const balanceDue = totalRevenue - totalPaid;

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
            <span className="badge badge-neutral">{departure.departureDate} to {departure.returnDate}</span>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => setShowEdit(true)}>
            <Icons.Edit style={{ width: 14, height: 14 }} /> Edit Departure
          </button>
        </div>
      </div>

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
            <div className="card card-padded" style={{ marginBottom: 'var(--space-4)' }}>
              <div className="section-heading">Occupancy & Registration</div>
              <div style={{ marginBottom: 24 }}>
                <OccupancyBar confirmed={confirmedBookings.length} max={departure.maxParticipants} min={departure.minParticipants} />
              </div>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="detail-label">Confirmed Travelers</span>
                  <span className="detail-value"><strong>{confirmedBookings.length}</strong></span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Available Spaces</span>
                  <span className="detail-value">{Math.max(0, departure.maxParticipants - confirmedBookings.length)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Waitlist</span>
                  <span className="detail-value">{departure.waitlistEnabled ? `${departure.waitlist?.length || 0} waiting` : 'Disabled'}</span>
                </div>
              </div>
            </div>

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
                  <span className="detail-label">Departure</span>
                  <span className="detail-value">{formatDate(departure.departureDate)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Return</span>
                  <span className="detail-value">{formatDate(departure.returnDate)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            {departure.internalNotes && (
              <div className="card card-padded" style={{ background: '#fffdf5', borderColor: 'rgba(193,120,0,0.2)', marginBottom: 'var(--space-4)' }}>
                <div className="section-heading">Internal Notes</div>
                <p style={{ font: '400 13px/1.6 var(--font-family)', color: 'var(--color-text-secondary)' }}>{departure.internalNotes}</p>
              </div>
            )}
            
            <div className="card card-padded">
              <div className="section-heading">Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => showToast('Feature coming soon: Manual Booking', 'info')}>
                  <Icons.Plus style={{ width: 14, height: 14 }} /> Add Manual Booking
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => showToast('Feature coming soon: Email Guests', 'info')}>
                  <Icons.Mail style={{ width: 14, height: 14 }} /> Email All Guests
                </button>
                <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => showToast('Feature coming soon: Export Roster', 'info')}>
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
                    const balance = b.totalAmount - (b.amountPaid || 0);
                    return (
                      <tr key={b.id}>
                        <td className="td-bold">{b.primaryGuestName}</td>
                        <td className="td-muted">{b.primaryGuestEmail}</td>
                        <td><StatusBadge status={b.status} /></td>
                        <td>{formatDate(b.bookingDate)}</td>
                        <td>{b.roomSelection}</td>
                        <td>${b.totalAmount?.toLocaleString()}</td>
                        <td style={{ color: b.amountPaid > 0 ? 'var(--color-success)' : 'inherit' }}>${b.amountPaid?.toLocaleString()}</td>
                        <td style={{ color: balance > 0 ? 'var(--color-error)' : 'inherit' }}>${balance.toLocaleString()}</td>
                        <td>
                          <button className="btn btn-ghost btn-sm" onClick={() => showToast(`View booking ${b.id} details`, 'info')}>
                            Manage
                          </button>
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
        <div style={{ maxWidth: 800 }}>
          <div className="info-banner" style={{ marginBottom: 'var(--space-4)' }}>
            <Icons.Info style={{ width: 16, height: 16, color: 'var(--color-info)' }} />
            <span className="info-banner-text">Room assignments are automatically generated based on guest selections. Drag and drop to manually adjust (coming soon).</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="card">
              <div className="card-header"><span className="card-title">Shared Rooms (Double Occupancy)</span></div>
              <div className="card-body">
                {bookings.filter(b => b.roomSelection === 'Double' || b.roomSelection === 'Twin').map((b, i) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--color-divider)' }}>
                    <div style={{ width: 40, color: 'var(--color-text-muted)' }}>{i+1}</div>
                    <div style={{ flex: 1, display: 'flex', gap: 16 }}>
                      <div style={{ flex: 1, padding: 8, background: 'var(--color-surface)', borderRadius: 6, border: '1px solid var(--color-border)' }}>
                        <div style={{ font: '500 13px/1 var(--font-family)' }}>{b.primaryGuestName}</div>
                      </div>
                      <div style={{ flex: 1, padding: 8, background: 'var(--color-surface)', borderRadius: 6, border: '1px dashed var(--color-border)' }}>
                        <div style={{ font: '400 13px/1 var(--font-family)', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Unassigned roommate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><span className="card-title">Private Rooms (Single Occupancy)</span></div>
              <div className="card-body">
                {bookings.filter(b => b.roomSelection === 'Single').map((b, i) => (
                  <div key={b.id} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid var(--color-divider)' }}>
                    <div style={{ width: 40, color: 'var(--color-text-muted)' }}>{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ padding: 8, background: 'var(--color-surface)', borderRadius: 6, border: '1px solid var(--color-border)', display: 'inline-block', minWidth: 200 }}>
                        <div style={{ font: '500 13px/1 var(--font-family)' }}>{b.primaryGuestName}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Financials ── */}
      {activeTab === 'Financials' && (
        <div>
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
                      <td className="td-bold">{b.primaryGuestName}</td>
                      <td>
                        {b.amountPaid >= (departure.depositAmount || 0) 
                          ? <span className="badge badge-success">Paid</span> 
                          : <span className="badge badge-warning">Pending</span>}
                      </td>
                      <td>
                        {b.amountPaid >= b.totalAmount 
                          ? <span className="badge badge-success">Paid in Full</span> 
                          : <span className="badge badge-warning">${(b.totalAmount - (b.amountPaid || 0)).toLocaleString()} Due</span>}
                      </td>
                      <td>${(b.amountPaid || 0).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => showToast('Send payment reminder', 'success')}>Remind</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Waitlist ── */}
      {activeTab === 'Waitlist' && (
        <div style={{ maxWidth: 800 }}>
          {!departure.waitlistEnabled ? (
            <div className="empty-state">
              <div className="empty-state-title">Waitlist is disabled</div>
              <div className="empty-state-text">Enable the waitlist in the departure settings to allow guests to join.</div>
              <button className="btn btn-primary" onClick={() => setShowEdit(true)}>Enable Waitlist</button>
            </div>
          ) : departure.waitlist?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">Waitlist is empty</div>
              <div className="empty-state-text">No guests are currently on the waitlist.</div>
            </div>
          ) : (
            <div className="card">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Position</th>
                      <th>Guest Name</th>
                      <th>Email</th>
                      <th>Date Added</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departure.waitlist.map((w, i) => (
                      <tr key={w.id}>
                        <td><span className="badge badge-neutral">#{i + 1}</span></td>
                        <td className="td-bold">{w.name}</td>
                        <td className="td-muted">{w.email}</td>
                        <td>{formatDate(w.dateAdded)}</td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => showToast('Feature coming soon: Promote to booking', 'info')}>
                            Invite to Book
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {showEdit && (
        <DepartureForm tripId={tripId} trip={trip} departure={departure} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}
