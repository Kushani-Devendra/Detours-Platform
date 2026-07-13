import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal, StatusBadge } from '../../components/ui/Components';
import { Icons } from '../../components/ui/Icons';

export default function BookingFlow({ trip, initialDepartureId, onClose }) {
  const { state, dispatch, showToast } = useApp();
  const [step, setStep] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', country: '',
    departureId: initialDepartureId || '',
    roomSelection: '', // Single | Double | Twin
    traveler2FirstName: '', traveler2LastName: '', traveler2Email: '',
    agreedToTerms: false
  });

  const [errors, setErrors] = useState({});

  const departures = state.departures
    .filter(d => d.tripId === trip.id && ['Open for Booking', 'Sold Out', 'Waitlist Only'].includes(d.status))
    .sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));

  const selectedDeparture = departures.find(d => d.id === formData.departureId);

  const handleNext = () => {
    const e = {};
    if (step === 1) {
      if (!formData.firstName) e.firstName = 'Required';
      if (!formData.lastName) e.lastName = 'Required';
      if (!formData.email) e.email = 'Required';
      else if (!/^\S+@\S+\.\S+$/.test(formData.email)) e.email = 'Invalid email';
    } else if (step === 2) {
      if (!formData.departureId) e.departureId = 'Please select a departure';
    } else if (step === 3) {
      if (!formData.roomSelection) e.roomSelection = 'Please select a room type';
      if (['Double', 'Twin'].includes(formData.roomSelection)) {
        if (!formData.traveler2FirstName) e.traveler2FirstName = 'Required';
        if (!formData.traveler2LastName) e.traveler2LastName = 'Required';
      }
    }
    
    setErrors(e);
    if (Object.keys(e).length === 0) setStep(s => s + 1);
  };

  const handleComplete = () => {
    if (!formData.agreedToTerms) {
      setErrors({ terms: 'You must agree to the terms and conditions' });
      return;
    }
    
    // Create Booking
    const booking = {
      id: `bkg-${Date.now()}`,
      tripId: trip.id,
      departureId: formData.departureId,
      primaryGuestName: `${formData.firstName} ${formData.lastName}`,
      primaryGuestEmail: formData.email,
      bookingDate: new Date().toISOString(),
      status: 'Confirmed',
      roomSelection: formData.roomSelection,
      totalAmount: selectedDeparture.price * (['Double', 'Twin'].includes(formData.roomSelection) ? 2 : 1),
      amountPaid: selectedDeparture.depositAmount * (['Double', 'Twin'].includes(formData.roomSelection) ? 2 : 1),
      travelers: [
        { name: `${formData.firstName} ${formData.lastName}`, email: formData.email },
        ...(['Double', 'Twin'].includes(formData.roomSelection) ? [{ name: `${formData.traveler2FirstName} ${formData.traveler2LastName}`, email: formData.traveler2Email }] : [])
      ]
    };
    
    dispatch({ type: 'ADD_BOOKING', payload: booking });
    showToast('Booking confirmed! Check your email for details.', 'success');
    onClose();
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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
        {/* Step 1: Contact */}
        {step === 1 && (
          <div className="animation-fade-in">
            <h3 style={{ fontSize: 20, marginBottom: 24, color: 'var(--color-brown-black)' }}>1. Primary Guest Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className={`form-input ${errors.firstName ? 'error' : ''}`} value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                {errors.firstName && <span className="form-error">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className={`form-input ${errors.lastName ? 'error' : ''}`} value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                {errors.lastName && <span className="form-error">{errors.lastName}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address</label>
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

        {/* Step 2: Departure Selection */}
        {step === 2 && (
          <div className="animation-fade-in">
            <h3 style={{ fontSize: 20, marginBottom: 24, color: 'var(--color-brown-black)' }}>2. Select Departure Date</h3>
            {errors.departureId && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{errors.departureId}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {departures.map(dep => {
                const isSelected = formData.departureId === dep.id;
                const isWaitlist = dep.status === 'Waitlist Only' || dep.status === 'Sold Out';
                
                return (
                  <div 
                    key={dep.id} 
                    onClick={() => !isWaitlist && setFormData({ ...formData, departureId: dep.id })}
                    style={{ 
                      padding: 20, 
                      borderRadius: 12, 
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: isSelected ? 'rgba(240, 81, 35, 0.05)' : '#fff',
                      cursor: isWaitlist ? 'not-allowed' : 'pointer',
                      opacity: isWaitlist ? 0.7 : 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 4 }}>
                        {formatDate(dep.departureDate)} – {formatDate(dep.returnDate)}
                      </div>
                      <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
                        Base price: ${dep.price?.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={dep.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Room & Travelers */}
        {step === 3 && (
          <div className="animation-fade-in">
            <h3 style={{ fontSize: 20, marginBottom: 24, color: 'var(--color-brown-black)' }}>3. Room Configuration</h3>
            {errors.roomSelection && <div style={{ color: 'var(--color-error)', marginBottom: 16 }}>{errors.roomSelection}</div>}
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
              {['Single', 'Double', 'Twin'].map(room => {
                const isSelected = formData.roomSelection === room;
                return (
                  <div 
                    key={room}
                    onClick={() => setFormData({ ...formData, roomSelection: room })}
                    style={{ 
                      padding: 20, textAlign: 'center', borderRadius: 12, 
                      border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      background: isSelected ? 'rgba(240, 81, 35, 0.05)' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <Icons.Bed style={{ width: 32, height: 32, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-muted)', marginBottom: 12 }} />
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>{room}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {room === 'Single' ? 'Private room (1 bed)' : room === 'Double' ? 'Shared room (1 large bed)' : 'Shared room (2 beds)'}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {['Double', 'Twin'].includes(formData.roomSelection) && (
              <div className="card card-padded" style={{ background: '#fafafa', border: 'none' }}>
                <h4 style={{ fontSize: 16, marginBottom: 16, color: 'var(--color-brown-black)' }}>Second Traveler Details</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className={`form-input ${errors.traveler2FirstName ? 'error' : ''}`} value={formData.traveler2FirstName} onChange={e => setFormData({ ...formData, traveler2FirstName: e.target.value })} />
                    {errors.traveler2FirstName && <span className="form-error">{errors.traveler2FirstName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
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

        {/* Step 4: Summary & Terms */}
        {step === 4 && (
          <div className="animation-fade-in">
            <h3 style={{ fontSize: 20, marginBottom: 24, color: 'var(--color-brown-black)' }}>4. Review & Confirm</h3>
            
            <div className="card" style={{ marginBottom: 24, border: '1px solid var(--color-border)', borderRadius: 12 }}>
              <div className="card-header" style={{ background: '#fafafa' }}><span className="card-title">Booking Summary</span></div>
              <div className="card-body">
                <div className="detail-grid">
                  <div className="detail-row"><span className="detail-label">Trip</span><span className="detail-value">{trip.title}</span></div>
                  <div className="detail-row"><span className="detail-label">Dates</span><span className="detail-value">{formatDate(selectedDeparture?.departureDate)} – {formatDate(selectedDeparture?.returnDate)}</span></div>
                  <div className="detail-row"><span className="detail-label">Primary Guest</span><span className="detail-value">{formData.firstName} {formData.lastName}</span></div>
                  <div className="detail-row"><span className="detail-label">Room Type</span><span className="detail-value">{formData.roomSelection}</span></div>
                  {['Double', 'Twin'].includes(formData.roomSelection) && (
                    <div className="detail-row"><span className="detail-label">Traveler 2</span><span className="detail-value">{formData.traveler2FirstName} {formData.traveler2LastName}</span></div>
                  )}
                </div>
              </div>
              <div style={{ padding: '20px 24px', background: '#fafafa', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Amount</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-brown-black)' }}>
                    ${(selectedDeparture.price * (['Double', 'Twin'].includes(formData.roomSelection) ? 2 : 1)).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Deposit Due Today</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>
                    ${(selectedDeparture.depositAmount * (['Double', 'Twin'].includes(formData.roomSelection) ? 2 : 1)).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'var(--color-surface)', padding: 16, borderRadius: 8 }}>
              <input type="checkbox" id="terms" checked={formData.agreedToTerms} onChange={e => setFormData({ ...formData, agreedToTerms: e.target.checked })} style={{ marginTop: 4, width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
              <div>
                <label htmlFor="terms" style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-brown-black)', display: 'block', marginBottom: 4, cursor: 'pointer' }}>
                  I agree to the Terms and Conditions and Cancellation Policy
                </label>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                  The deposit is fully refundable within 48 hours of booking. Final payment is due 90 days before departure. Cancellations after final payment are subject to fees.
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
