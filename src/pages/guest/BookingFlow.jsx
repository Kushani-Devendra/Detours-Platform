import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal, StatusBadge } from '../../components/ui/Components';
import { Icons } from '../../components/ui/Icons';

const NEAR_DEPARTURE_THRESHOLD_DAYS = 90;

// Room option definitions matching spec terminology
const ROOM_OPTIONS = [
  { key: 'solo',    label: 'One bed — solo',                    desc: 'Private single room',          travelers: 1 },
  { key: 'partner', label: 'One bed — with a partner',          desc: 'Double room, shared with partner', travelers: 2 },
  { key: 'friend',  label: 'Two beds — with a friend',          desc: 'Twin room, shared with friend',    travelers: 2 },
  { key: 'pair',    label: 'Two beds — pair me with another solo traveler', desc: 'Twin/double pairing', travelers: 1 },
];

export default function BookingFlow({ trip, initialDepartureId, onClose }) {
  const { state, dispatch, showToast, getAvailableSpaces } = useApp();

  const [step, setStep] = useState(1);
  const [isWaitlistMode, setIsWaitlistMode] = useState(false);

  // Booking form state
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: '',
    departureId: initialDepartureId || '',
    roomingPreference: '',
    bedTypePreference: '',
    selectedRoomId: '',
    traveler2FirstName: '', traveler2LastName: '', traveler2Email: '',
    agreedToTerms: false,
  });

  // Waitlist form state
  const [waitlistForm, setWaitlistForm] = useState({
    name: '', email: '', travelers: 1, message: '',
  });
  const [waitlistDepartureId, setWaitlistDepartureId] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const [errors, setErrors] = useState({});

  const departures = state.departures
    .filter(d => d.tripId === trip.id && ['Open for Booking', 'Sold Out', 'Waitlist Only'].includes(d.status))
    .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

  const selectedDeparture = departures.find(d => d.id === formData.departureId);

  // Check if departure is within near-departure threshold
  const isNearDeparture = (dep) => {
    if (!dep) return false;
    const days = Math.floor((new Date(dep.departureDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days <= NEAR_DEPARTURE_THRESHOLD_DAYS;
  };

  const nearDepartureWarning = selectedDeparture && isNearDeparture(selectedDeparture);

  // Determine traveler count from rooming preference or selected room
  const getTravelerCount = (pref, roomId) => {
    if (roomId && selectedDeparture && selectedDeparture.rooms) {
      const room = selectedDeparture.rooms.find(r => r.id === roomId);
      return room ? room.capacity : 1;
    }
    const opt = ROOM_OPTIONS.find(r => r.key === pref);
    return opt ? opt.travelers : 1;
  };

  const travelerCount = getTravelerCount(formData.roomingPreference, formData.selectedRoomId);

  const getTotalPrice = () => {
    if (formData.selectedRoomId && selectedDeparture && selectedDeparture.rooms) {
      const room = selectedDeparture.rooms.find(r => r.id === formData.selectedRoomId);
      if (room) return room.price;
    }
    return (selectedDeparture?.price || 0) * travelerCount;
  };

  const getDepositPrice = () => {
    return (selectedDeparture?.depositAmount || 0) * travelerCount;
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ── Near-Departure Warning Banner ──
  const NearDepartureWarning = () => nearDepartureWarning ? (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px', borderRadius: 8, marginBottom: 20,
      background: '#fffdf5', border: '1px solid rgba(193,120,0,0.35)',
    }}>
      <Icons.AlertTriangle style={{ width: 16, height: 16, color: 'var(--color-warning)', flexShrink: 0, marginTop: 1 }} />
      <div style={{ font: '400 13px/1.5 var(--font-family)', color: '#7a4a00' }}>
        <strong>Limited availability notice:</strong> This departure departs within 90 days. Please contact us if you have urgent availability questions.
      </div>
    </div>
  ) : null;

  // ── Step Navigation ──
  const handleNext = () => {
    const e = {};

    if (step === 1) {
      if (!formData.firstName) e.firstName = 'Required';
      if (!formData.lastName)  e.lastName  = 'Required';
      if (!formData.email)     e.email     = 'Required';
      else if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = 'Invalid email';
    } else if (step === 2) {
      if (!formData.departureId) {
        e.departureId = 'Please select a departure';
      } else {
        // 4.3: check available spaces vs group size
        const dep = departures.find(d => d.id === formData.departureId);
        if (dep && dep.status !== 'Waitlist Only' && dep.status !== 'Sold Out') {
          const available = getAvailableSpaces(dep);
          // We don't know room choice yet at step 2, so we check >=1 space
          if (available <= 0) {
            e.departureId = 'This departure is fully booked. Please select a different date or join the waitlist.';
          }
        }
      }
    } else if (step === 3) {
      const hasRooms = selectedDeparture && selectedDeparture.rooms && selectedDeparture.rooms.length > 0;
      
      if (hasRooms) {
        if (!formData.selectedRoomId) e.roomingPreference = 'Please select a room';
      } else {
        if (!formData.roomingPreference) e.roomingPreference = 'Please select a rooming preference';
        else if (['partner', 'friend', 'solo'].includes(formData.roomingPreference) && !formData.bedTypePreference) {
          e.bedTypePreference = 'Please select a bed type preference';
        }
      }

      if (!hasRooms && selectedDeparture && formData.roomingPreference) {
        const available = getAvailableSpaces(selectedDeparture);
        const needed = getTravelerCount(formData.roomingPreference);
        if (needed > available) {
          e.capacityBlock = `This departure only has ${available} space${available !== 1 ? 's' : ''} remaining. Your group of ${needed} cannot be accommodated. Please contact Detours directly to arrange your booking.`;
        }
      }

      // Require second traveler details for shared rooms or rooms with capacity > 1
      const isShared = hasRooms 
        ? (selectedDeparture.rooms.find(r => r.id === formData.selectedRoomId)?.capacity > 1) 
        : ['partner', 'friend'].includes(formData.roomingPreference);
        
      if (isShared) {
        if (!formData.traveler2FirstName) e.traveler2FirstName = 'Required';
        if (!formData.traveler2LastName)  e.traveler2LastName  = 'Required';
      }
    }

    setErrors(e);
    if (Object.keys(e).length === 0) setStep(s => s + 1);
  };

  // ── Final booking submission ──
  const handleComplete = () => {
    if (!formData.agreedToTerms) {
      setErrors({ terms: 'You must agree to the terms and conditions' });
      return;
    }

    const hasRooms = selectedDeparture && selectedDeparture.rooms && selectedDeparture.rooms.length > 0;
    const roomOpt = ROOM_OPTIONS.find(r => r.key === formData.roomingPreference);
    
    let isShared = false;
    let roomLabel = '';
    
    if (hasRooms) {
      const room = selectedDeparture.rooms.find(r => r.id === formData.selectedRoomId);
      isShared = room && room.capacity > 1;
      roomLabel = room ? `${room.name} (${room.type})` : '';
    } else {
      isShared = ['partner', 'friend'].includes(formData.roomingPreference);
      roomLabel = roomOpt?.label || formData.roomingPreference;
    }

    const tCount  = getTravelerCount(formData.roomingPreference, formData.selectedRoomId);
    const totalPrice = getTotalPrice();
    const depositPrice = getDepositPrice();

    const travelers = [
      {
        id: `tot-${Date.now()}-1`,
        firstName: formData.firstName, lastName: formData.lastName,
        preferredName: formData.firstName,
        roomingPreference: roomLabel,
        bedTypePreference: formData.bedTypePreference,
        dietaryRequirements: '', roomAssignment: null,
      },
      ...(isShared ? [{
        id: `tot-${Date.now()}-2`,
        firstName: formData.traveler2FirstName, lastName: formData.traveler2LastName,
        preferredName: formData.traveler2FirstName,
        roomingPreference: roomLabel,
        bedTypePreference: formData.bedTypePreference,
        dietaryRequirements: '', roomAssignment: null,
      }] : []),
    ];

    const booking = {
      id:         `bkg-${Date.now()}`,
      ref:        `DT-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      tripId:     trip.id,
      departureId: formData.departureId,
      primaryGuest: { firstName: formData.firstName, lastName: formData.lastName, email: formData.email, phone: formData.phone },
      primaryGuestName:  `${formData.firstName} ${formData.lastName}`,
      primaryGuestEmail: formData.email,
      travelers,
      status:      'Confirmed',
      depositPaid: true, balancePaid: false,
      totalAmount:  totalPrice,
      depositAmount: depositPrice,
      amountPaid:   depositPrice,
      balanceAmount: totalPrice - depositPrice,
      roomSelection: roomLabel,
      bedTypePreference: formData.bedTypePreference,
      bookedAt:    new Date().toISOString(),
      referralCode: null,
      creditIssued: 0,
    };

    dispatch({ type: 'ADD_BOOKING', payload: booking });
    showToast('Booking confirmed! Check your email for details.', 'success');
    onClose();
  };

  // ── Waitlist submission ──
  const handleWaitlistSubmit = () => {
    const e = {};
    if (!waitlistForm.name)  e.wlName  = 'Required';
    if (!waitlistForm.email) e.wlEmail = 'Required';
    else if (!/^\S+@\S+\.\S+$/.test(waitlistForm.email)) e.wlEmail = 'Invalid email';
    if (!waitlistDepartureId) e.wlDep = 'Please select a departure';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const entry = {
      id:          `wl-${Date.now()}`,
      guestName:   waitlistForm.name,
      email:       waitlistForm.email,
      travelers:   Number(waitlistForm.travelers) || 1,
      message:     waitlistForm.message,
      submittedAt: new Date().toISOString(),
      status:      'Waiting',
    };

    dispatch({ type: 'ADD_WAITLIST_ENTRY', payload: { departureId: waitlistDepartureId, entry } });
    showToast('You have been added to the waitlist. We will contact you if a spot opens up.', 'success');
    setWaitlistSubmitted(true);
  };

  // ── Waitlist-only mode ──
  if (isWaitlistMode) {
    const waitlistDepartures = state.departures
      .filter(d => d.tripId === trip.id && (d.status === 'Waitlist Only' || d.status === 'Sold Out') && d.waitlistEnabled)
      .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

    return (
      <Modal
        isOpen={true}
        onClose={onClose}
        title={`Join Waitlist — ${trip.title}`}
        size="md"
        footer={
          waitlistSubmitted ? (
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <button className="btn btn-ghost" onClick={() => setIsWaitlistMode(false)}>← Back</button>
              <button className="btn btn-primary" onClick={handleWaitlistSubmit}>Join Waitlist</button>
            </div>
          )
        }
      >
        {waitlistSubmitted ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e8f5ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icons.CheckCircle style={{ width: 28, height: 28, color: '#1a6b3c' }} />
            </div>
            <div style={{ font: '600 18px/1.3 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 8 }}>You're on the waitlist!</div>
            <div style={{ font: '400 14px/1.6 var(--font-family)', color: 'var(--color-text-secondary)' }}>
              We'll contact you immediately if a spot becomes available. A confirmation has been sent to <strong>{waitlistForm.email}</strong>.
            </div>
          </div>
        ) : (
          <div className="animation-fade-in">
            <p style={{ font: '400 14px/1.6 var(--font-family)', color: 'var(--color-text-secondary)', marginBottom: 20 }}>
              This departure is currently sold out. Join the waitlist and we'll notify you with a time-limited booking link if a space opens up.
            </p>

            <div className="form-group">
              <label className="form-label">Select Departure <span className="required">*</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {waitlistDepartures.map(dep => (
                  <div
                    key={dep.id}
                    onClick={() => { setWaitlistDepartureId(dep.id); setErrors(e => ({ ...e, wlDep: undefined })); }}
                    style={{
                      padding: '12px 16px', borderRadius: 10,
                      border: `2px solid ${waitlistDepartureId === dep.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: waitlistDepartureId === dep.id ? 'rgba(240,81,35,0.05)' : '#fff',
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ font: '600 14px/1 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 4 }}>
                        {formatDate(dep.departureDate)} – {formatDate(dep.returnDate)}
                      </div>
                      <div style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>
                        ${dep.price?.toLocaleString()} · {dep.waitlist?.length || 0} on waitlist
                      </div>
                    </div>
                    <StatusBadge status={dep.status} />
                  </div>
                ))}
                {waitlistDepartures.length === 0 && (
                  <div style={{ padding: 16, color: 'var(--color-text-muted)', fontSize: 13 }}>No waitlist-enabled sold-out departures available.</div>
                )}
              </div>
              {errors.wlDep && <span className="form-error">{errors.wlDep}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Full Name <span className="required">*</span></label>
              <input
                className={`form-input ${errors.wlName ? 'error' : ''}`}
                value={waitlistForm.name}
                onChange={e => setWaitlistForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Your full name"
              />
              {errors.wlName && <span className="form-error">{errors.wlName}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address <span className="required">*</span></label>
              <input
                type="email"
                className={`form-input ${errors.wlEmail ? 'error' : ''}`}
                value={waitlistForm.email}
                onChange={e => setWaitlistForm(f => ({ ...f, email: e.target.value }))}
                placeholder="your@email.com"
              />
              {errors.wlEmail && <span className="form-error">{errors.wlEmail}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Number of Travelers <span className="required">*</span></label>
              <select
                className="form-select"
                value={waitlistForm.travelers}
                onChange={e => setWaitlistForm(f => ({ ...f, travelers: Number(e.target.value) }))}
                style={{ maxWidth: 120 }}
              >
                {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message (Optional)</label>
              <textarea
                className="form-textarea"
                value={waitlistForm.message}
                onChange={e => setWaitlistForm(f => ({ ...f, message: e.target.value }))}
                rows={3}
                placeholder="Any additional information you'd like us to know…"
              />
            </div>
          </div>
        )}
      </Modal>
    );
  }

  // ── Standard booking flow ──
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Book ${trip.title}`}
      size="lg"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button className="btn btn-ghost" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}>
            {step > 1 ? '← Back' : 'Cancel'}
          </button>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4, marginRight: 16 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: step >= i ? 'var(--color-primary)' : 'var(--color-border)' }} />
              ))}
            </div>
            {step < 4 ? (
              <button className="btn btn-primary" onClick={handleNext}>Next Step →</button>
            ) : (
              <button className="btn btn-primary" onClick={handleComplete}>Confirm Booking & Pay Deposit</button>
            )}
          </div>
        </div>
      }
    >
      <div style={{ minHeight: 400 }}>

        {/* ── Step 1: Contact Details ── */}
        {step === 1 && (
          <div className="animation-fade-in">
            <h3 style={{ fontSize: 20, marginBottom: 24, color: 'var(--color-brown-black)' }}>1. Primary Guest Details</h3>
            {nearDepartureWarning && <NearDepartureWarning />}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name <span className="required">*</span></label>
                <input className={`form-input ${errors.firstName ? 'error' : ''}`} value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span className="required">*</span></label>
                <input className={`form-input ${errors.lastName ? 'error' : ''}`} value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address <span className="required">*</span></label>
                <input type="email" className={`form-input ${errors.email ? 'error' : ''}`} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Country of Residence</label>
              <select className="form-select" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })}>
                <option value="">Select country...</option>
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Australia</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        )}

        {/* ── Step 2: Departure Selection ── */}
        {step === 2 && (
          <div className="animation-fade-in">
            <h3 style={{ fontSize: 20, marginBottom: 24, color: 'var(--color-brown-black)' }}>2. Select Departure Date</h3>
            {errors.departureId && <div style={{ color: 'var(--color-error)', marginBottom: 16, font: '400 13px/1.4 var(--font-family)' }}>{errors.departureId}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {departures.map(dep => {
                const isSelected   = formData.departureId === dep.id;
                const isSoldOut    = dep.status === 'Sold Out';
                const isWaitlist   = dep.status === 'Waitlist Only';
                const available    = getAvailableSpaces(dep);
                const isSelectable = !isSoldOut && !isWaitlist;
                const near         = isNearDeparture(dep);

                return (
                  <div
                    key={dep.id}
                    onClick={() => {
                      if (isWaitlist || isSoldOut) {
                        // Redirect to waitlist mode
                        setWaitlistDepartureId(dep.id);
                        setIsWaitlistMode(true);
                        return;
                      }
                      setFormData({ ...formData, departureId: dep.id });
                      setErrors({});
                    }}
                    style={{
                      padding: 20, borderRadius: 12,
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: isSelected ? 'rgba(240, 81, 35, 0.05)' : isSoldOut || isWaitlist ? 'var(--color-surface)' : '#fff',
                      cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.2s',
                      opacity: isSoldOut && !dep.waitlistEnabled ? 0.5 : 1,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 4 }}>
                        {formatDate(dep.departureDate)} – {formatDate(dep.returnDate)}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: near ? 4 : 0 }}>
                        ${dep.price?.toLocaleString()} per person
                        {isSelectable && (
                          <span style={{ marginLeft: 12, color: available <= 3 ? 'var(--color-warning)' : 'var(--color-success)', fontWeight: 500 }}>
                            · {available} space{available !== 1 ? 's' : ''} remaining
                          </span>
                        )}
                      </div>
                      {near && isSelectable && (
                        <div style={{ font: '400 12px/1 var(--font-family)', color: '#c17800', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icons.AlertTriangle style={{ width: 11, height: 11 }} /> Departs within 90 days
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                      <StatusBadge status={dep.status} />
                      {(isWaitlist || (isSoldOut && dep.waitlistEnabled)) && (
                        <span style={{ font: '500 12px/1 var(--font-family)', color: 'var(--color-primary)', textDecoration: 'underline' }}>
                          Join Waitlist →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Rooming Preference ── */}
        {step === 3 && (
          <div className="animation-fade-in">
            <h3 style={{ fontSize: 20, marginBottom: 8, color: 'var(--color-brown-black)' }}>3. Rooming Preference</h3>
            <p style={{ font: '400 13px/1.5 var(--font-family)', color: 'var(--color-text-secondary)', marginBottom: 24 }}>
              Select how you'd like to be roomed. This is used to assign or match your accommodation on the departure.
            </p>
            <NearDepartureWarning />

            {errors.roomingPreference && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{errors.roomingPreference}</div>}
            {errors.capacityBlock && (
              <div style={{
                display: 'flex', gap: 12, padding: '14px 16px', borderRadius: 8, marginBottom: 16,
                background: '#fef2f2', border: '1px solid rgba(220,38,38,0.3)',
              }}>
                <Icons.AlertTriangle style={{ width: 18, height: 18, color: 'var(--color-error)', flexShrink: 0 }} />
                <div>
                  <div style={{ font: '600 13px/1 var(--font-family)', color: 'var(--color-error)', marginBottom: 4 }}>Registration Blocked</div>
                  <div style={{ font: '400 12px/1.5 var(--font-family)', color: '#7f1d1d' }}>{errors.capacityBlock}</div>
                </div>
              </div>
            )}

            {(!selectedDeparture?.rooms || selectedDeparture.rooms.length === 0) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {ROOM_OPTIONS.map(opt => {
                  const isSelected = formData.roomingPreference === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => { setFormData({ ...formData, roomingPreference: opt.key }); setErrors(e => ({ ...e, roomingPreference: undefined, capacityBlock: undefined })); }}
                      style={{
                        padding: '14px 16px', borderRadius: 10,
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'rgba(240,81,35,0.05)' : '#fff',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'var(--color-primary)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div>
                        <div style={{ font: '600 14px/1 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 3 }}>{opt.label}</div>
                        <div style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>{opt.desc}</div>
                      </div>
                      {opt.travelers === 2 && (
                        <span style={{ marginLeft: 'auto', font: '400 11px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>2 travelers</span>
                      )}
                    </div>
                  );
                })}

                {formData.roomingPreference && ['solo', 'partner', 'friend'].includes(formData.roomingPreference) && (
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">Bed Type Preference <span className="required">*</span></label>
                    <select className={`form-select ${errors.bedTypePreference ? 'error' : ''}`} value={formData.bedTypePreference} onChange={e => { setFormData({...formData, bedTypePreference: e.target.value}); setErrors(e => ({...e, bedTypePreference: undefined})); }}>
                      <option value="">Select preference...</option>
                      <option value="One Bed">One Bed</option>
                      <option value="Two Beds">Two Beds (Twin)</option>
                    </select>
                    {errors.bedTypePreference && <span className="form-error">{errors.bedTypePreference}</span>}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                <div className="info-banner" style={{ marginBottom: 'var(--space-2)' }}>
                  <Icons.Info style={{ width: 16, height: 16, color: 'var(--color-info)' }} />
                  <span className="info-banner-text">Selecting a room places a soft 15-minute hold to guarantee your spot while you complete booking.</span>
                </div>
                {selectedDeparture.rooms.map(room => {
                  const isSelected = formData.selectedRoomId === room.id;
                  const isAvailable = room.status === 'Available';
                  return (
                    <div
                      key={room.id}
                      onClick={() => {
                        if (!isAvailable) return;
                        setFormData({ ...formData, selectedRoomId: room.id });
                        setErrors(e => ({ ...e, roomingPreference: undefined, capacityBlock: undefined }));
                        showToast(`Placed 15-minute hold on ${room.name}`, 'info');
                      }}
                      style={{
                        padding: '14px 16px', borderRadius: 10,
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'rgba(240,81,35,0.05)' : isAvailable ? '#fff' : 'var(--color-surface)',
                        cursor: isAvailable ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
                        opacity: isAvailable ? 1 : 0.6
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: isSelected ? 'var(--color-primary)' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ font: '600 14px/1 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 3 }}>{room.name} <span className="badge badge-neutral" style={{ marginLeft: 6 }}>{room.type}</span></div>
                        <div style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>{room.description || `Capacity: ${room.capacity} guest(s)`}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {isAvailable ? (
                          <div style={{ font: '600 14px/1 var(--font-family)', color: 'var(--color-brown-black)' }}>${room.price?.toLocaleString()}</div>
                        ) : (
                          <div style={{ font: '500 12px/1 var(--font-family)', color: 'var(--color-error)' }}>Reserved</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Second traveler details for shared rooms */}
            {((!selectedDeparture?.rooms?.length && ['partner', 'friend'].includes(formData.roomingPreference)) || 
              (selectedDeparture?.rooms?.find(r => r.id === formData.selectedRoomId)?.capacity > 1)) && (
              <div className="card card-padded" style={{ background: '#fafafa', border: 'none' }}>
                <h4 style={{ fontSize: 15, marginBottom: 16, color: 'var(--color-brown-black)' }}>Second Traveler Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name <span className="required">*</span></label>
                    <input className={`form-input ${errors.traveler2FirstName ? 'error' : ''}`} value={formData.traveler2FirstName} onChange={e => setFormData({ ...formData, traveler2FirstName: e.target.value })} />
                    {errors.traveler2FirstName && <span className="form-error">{errors.traveler2FirstName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name <span className="required">*</span></label>
                    <input className={`form-input ${errors.traveler2LastName ? 'error' : ''}`} value={formData.traveler2LastName} onChange={e => setFormData({ ...formData, traveler2LastName: e.target.value })} />
                    {errors.traveler2LastName && <span className="form-error">{errors.traveler2LastName}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input type="email" className="form-input" value={formData.traveler2Email} onChange={e => setFormData({ ...formData, traveler2Email: e.target.value })} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Review & Confirm ── */}
        {step === 4 && (
          <div className="animation-fade-in">
            <h3 style={{ fontSize: 20, marginBottom: 24, color: 'var(--color-brown-black)' }}>4. Review & Confirm</h3>
            <NearDepartureWarning />

            <div className="card" style={{ marginBottom: 24, border: '1px solid var(--color-border)', borderRadius: 12 }}>
              <div className="card-header" style={{ background: '#fafafa' }}><span className="card-title">Booking Summary</span></div>
              <div className="card-body">
                <div className="detail-grid">
                  <div className="detail-row"><span className="detail-label">Trip</span><span className="detail-value">{trip.title}</span></div>
                  <div className="detail-row"><span className="detail-label">Dates</span><span className="detail-value">{formatDate(selectedDeparture?.departureDate)} – {formatDate(selectedDeparture?.returnDate)}</span></div>
                  <div className="detail-row"><span className="detail-label">Departure City</span><span className="detail-value">{selectedDeparture?.departureCity || trip.departureCity}</span></div>
                  <div className="detail-row"><span className="detail-label">Primary Guest</span><span className="detail-value">{formData.firstName} {formData.lastName}</span></div>
                  <div className="detail-row"><span className="detail-label">Rooming</span><span className="detail-value">
                    {selectedDeparture?.rooms?.length 
                      ? selectedDeparture.rooms.find(r => r.id === formData.selectedRoomId)?.name
                      : (ROOM_OPTIONS.find(r => r.key === formData.roomingPreference)?.label || formData.roomingPreference)}
                  </span></div>
                  {((!selectedDeparture?.rooms?.length && ['partner', 'friend'].includes(formData.roomingPreference)) || 
                    (selectedDeparture?.rooms?.find(r => r.id === formData.selectedRoomId)?.capacity > 1)) && (
                    <div className="detail-row"><span className="detail-label">Traveler 2</span><span className="detail-value">{formData.traveler2FirstName} {formData.traveler2LastName}</span></div>
                  )}
                  <div className="detail-row"><span className="detail-label">Total Travelers</span><span className="detail-value">{travelerCount}</span></div>
                </div>
              </div>
              <div style={{ padding: '20px 24px', background: '#fafafa', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Amount</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-brown-black)' }}>
                    ${getTotalPrice().toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Deposit Due Today</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>
                    ${getDepositPrice().toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--color-surface)', padding: 16, borderRadius: 8 }}>
              <input
                type="checkbox" id="terms"
                checked={formData.agreedToTerms}
                onChange={e => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                style={{ marginTop: 4, width: 18, height: 18, accentColor: 'var(--color-primary)' }}
              />
              <div>
                <label htmlFor="terms" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-brown-black)', display: 'block', marginBottom: 4, cursor: 'pointer' }}>
                  I agree to the Terms and Conditions and Cancellation Policy
                </label>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  The deposit secures your space. Balance payment is due {selectedDeparture?.balancePaymentDeadlineDays || 90} days before departure. Cancellations are subject to the Detours cancellation policy.
                </div>
                {errors.terms && <div style={{ color: 'var(--color-error)', fontSize: 13, marginTop: 8 }}>{errors.terms}</div>}
              </div>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
}
