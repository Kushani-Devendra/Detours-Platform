import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Modal } from '../../../components/ui/Components';

const DEPARTURE_STATUSES = ['Draft', 'Open for Booking', 'Sold Out', 'Waitlist Only', 'Closed', 'Cancelled', 'Completed'];

const EMPTY_DEPARTURE = {
  departureDate: '',
  returnDate: '',
  price: '',
  depositAmount: '',
  minParticipants: '',
  maxParticipants: '',
  status: 'Draft',
  waitlistEnabled: false,
  internalNotes: ''
};

export default function DepartureForm({ tripId, trip, departure, onClose }) {
  const { dispatch, showToast, addAuditEntry } = useApp();
  const isEdit = !!departure;
  const [form, setForm] = useState(departure || { ...EMPTY_DEPARTURE, tripId, price: trip.basePrice });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.departureDate) e.departureDate = 'Required';
    if (!form.returnDate) e.returnDate = 'Required';
    if (!form.price) e.price = 'Required';
    if (!form.depositAmount) e.depositAmount = 'Required';
    if (!form.minParticipants) e.minParticipants = 'Required';
    if (!form.maxParticipants) e.maxParticipants = 'Required';
    if (form.departureDate && form.returnDate && new Date(form.returnDate) <= new Date(form.departureDate)) {
      e.returnDate = 'Must be after departure';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      ...form,
      id: isEdit ? departure.id : `dep-${Date.now()}`,
      updatedAt: new Date().toISOString()
    };

    if (isEdit) {
      if (departure.status !== payload.status) {
        addAuditEntry('Departure', departure.id, 'status', departure.status, payload.status);
      }
      dispatch({ type: 'UPDATE_DEPARTURE', payload });
      showToast('Departure updated successfully', 'success');
    } else {
      dispatch({ type: 'ADD_DEPARTURE', payload });
      showToast('Departure created successfully', 'success');
    }

    setSaving(false);
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={isEdit ? 'Edit Departure' : 'Add Departure'}
      subtitle={`For ${trip.title}`}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : null}
            {isEdit ? 'Save Changes' : 'Create Departure'}
          </button>
        </>
      }
    >
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Departure Date <span className="required">*</span></label>
          <input type="date" className={`form-input ${errors.departureDate ? 'error' : ''}`} value={form.departureDate} onChange={e => set('departureDate', e.target.value)} />
          {errors.departureDate && <span className="form-error">{errors.departureDate}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Return Date <span className="required">*</span></label>
          <input type="date" className={`form-input ${errors.returnDate ? 'error' : ''}`} value={form.returnDate} onChange={e => set('returnDate', e.target.value)} />
          {errors.returnDate && <span className="form-error">{errors.returnDate}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Price (USD) <span className="required">*</span></label>
          <input type="number" className={`form-input ${errors.price ? 'error' : ''}`} value={form.price} onChange={e => set('price', Number(e.target.value))} />
          {errors.price && <span className="form-error">{errors.price}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Deposit Amount (USD) <span className="required">*</span></label>
          <input type="number" className={`form-input ${errors.depositAmount ? 'error' : ''}`} value={form.depositAmount} onChange={e => set('depositAmount', Number(e.target.value))} />
          {errors.depositAmount && <span className="form-error">{errors.depositAmount}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Min Participants <span className="required">*</span></label>
          <input type="number" className={`form-input ${errors.minParticipants ? 'error' : ''}`} value={form.minParticipants} onChange={e => set('minParticipants', Number(e.target.value))} />
          {errors.minParticipants && <span className="form-error">{errors.minParticipants}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Max Participants <span className="required">*</span></label>
          <input type="number" className={`form-input ${errors.maxParticipants ? 'error' : ''}`} value={form.maxParticipants} onChange={e => set('maxParticipants', Number(e.target.value))} />
          {errors.maxParticipants && <span className="form-error">{errors.maxParticipants}</span>}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          {DEPARTURE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'var(--space-4)' }}>
        <input type="checkbox" id="waitlistEnabled" checked={form.waitlistEnabled} onChange={e => set('waitlistEnabled', e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }} />
        <label htmlFor="waitlistEnabled" className="form-label" style={{ marginBottom: 0 }}>Enable Waitlist (if sold out)</label>
      </div>

      <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
        <label className="form-label">Internal Notes</label>
        <textarea className="form-textarea" value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} rows={3} placeholder="Add any private notes about this departure..." />
      </div>
    </Modal>
  );
}
