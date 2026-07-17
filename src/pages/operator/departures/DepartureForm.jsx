import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { Modal } from '../../../components/ui/Components';
import { Icons } from '../../../components/ui/Icons';

const DEPARTURE_STATUSES = ['Open for Booking', 'Sold Out', 'Waitlist Only', 'Closed', 'Cancelled', 'Completed'];

const BRAND_DEFAULTS = {
  Detours: { balanceDeadlineDays: 90 },
  Mawari:  { balanceDeadlineDays: 120 },
};

function calcBalanceDeadlineDate(departureDate, days) {
  if (!departureDate || !days) return '';
  const d = new Date(departureDate);
  d.setDate(d.getDate() - Number(days));
  return d.toISOString().split('T')[0];
}

export default function DepartureForm({ tripId, trip, departure, onClose }) {
  const { dispatch, showToast, addAuditEntry } = useApp();
  const isEdit = !!departure;

  // Determine brand from the trip (falls back to Detours if not set)
  const tripBrand = trip.brand || 'Detours';
  const brandDefault = BRAND_DEFAULTS[tripBrand] || BRAND_DEFAULTS.Detours;

  const [form, setForm] = useState(() => {
    if (departure) return { ...departure };
    return {
      departureDate: '',
      returnDate: '',
      departureCity: trip.departureCity || '',
      endCity: trip.endCity || '',
      price: trip.basePrice || '',
      depositAmount: '',
      minParticipants: '',
      maxParticipants: '',
      balancePaymentDeadlineDays: brandDefault.balanceDeadlineDays,
      balanceDeadlineDate: '',
      status: 'Open for Booking',
      waitlistEnabled: false,
      internalNotes: '',
    };
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  // Auto-recalculate balance deadline date when departure date or days change
  useEffect(() => {
    if (form.departureDate && form.balancePaymentDeadlineDays) {
      set('balanceDeadlineDate', calcBalanceDeadlineDate(form.departureDate, form.balancePaymentDeadlineDays));
    }
  }, [form.departureDate, form.balancePaymentDeadlineDays]);

  const validate = () => {
    const e = {};
    if (!form.departureDate) e.departureDate = 'Required';
    if (!form.returnDate) e.returnDate = 'Required';
    if (form.departureDate && form.returnDate && new Date(form.returnDate) <= new Date(form.departureDate)) {
      e.returnDate = 'Must be after departure date';
    }
    if (!form.departureCity) e.departureCity = 'Required';
    if (!form.endCity) e.endCity = 'Required';
    if (!form.price) e.price = 'Required';
    if (!form.depositAmount) e.depositAmount = 'Required';
    if (!form.minParticipants) e.minParticipants = 'Required';
    if (!form.maxParticipants) e.maxParticipants = 'Required';
    if (!form.balancePaymentDeadlineDays) e.balancePaymentDeadlineDays = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      ...form,
      id: isEdit ? departure.id : `dep-${Date.now()}`,
      tripId,
      waitlist: isEdit ? (departure.waitlist || []) : [],
      rooms: isEdit ? (departure.rooms || []) : [],
      postTripCharges: isEdit ? (departure.postTripCharges || []) : [],
      updatedAt: new Date().toISOString(),
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

  const formatDeadlineDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
      {/* ── Brand Context Banner ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 8,
        marginBottom: 20,
        background: tripBrand === 'Mawari' ? 'rgba(91, 68, 156, 0.08)' : 'rgba(240, 81, 35, 0.08)',
        border: `1px solid ${tripBrand === 'Mawari' ? 'rgba(91, 68, 156, 0.25)' : 'rgba(240, 81, 35, 0.25)'}`,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: tripBrand === 'Mawari' ? '#5b449c' : 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icons.Globe style={{ width: 14, height: 14, color: '#fff' }} />
        </div>
        <div>
          <div style={{ font: '600 13px/1 var(--font-family)', color: 'var(--color-brown-black)' }}>
            {tripBrand} Trip
          </div>
          <div style={{ font: '400 11px/1.4 var(--font-family)', color: 'var(--color-text-muted)', marginTop: 3 }}>
            Brand defaults: balance deadline {brandDefault.balanceDeadlineDays} days before departure
          </div>
        </div>
      </div>

      {/* ── Dates ── */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Departure Date <span className="required">*</span></label>
          <input
            type="date"
            className={`form-input ${errors.departureDate ? 'error' : ''}`}
            value={form.departureDate}
            onChange={e => set('departureDate', e.target.value)}
          />
          {errors.departureDate && <span className="form-error">{errors.departureDate}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Return Date <span className="required">*</span></label>
          <input
            type="date"
            className={`form-input ${errors.returnDate ? 'error' : ''}`}
            value={form.returnDate}
            onChange={e => set('returnDate', e.target.value)}
          />
          {errors.returnDate && <span className="form-error">{errors.returnDate}</span>}
        </div>
      </div>

      {/* ── Cities ── */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Departure City <span className="required">*</span></label>
          <input
            className={`form-input ${errors.departureCity ? 'error' : ''}`}
            value={form.departureCity}
            onChange={e => set('departureCity', e.target.value)}
            placeholder={trip.departureCity || 'e.g. Athens'}
          />
          {errors.departureCity && <span className="form-error">{errors.departureCity}</span>}
          <span className="form-hint">Defaults from trip. Overridable per departure.</span>
        </div>
        <div className="form-group">
          <label className="form-label">End City <span className="required">*</span></label>
          <input
            className={`form-input ${errors.endCity ? 'error' : ''}`}
            value={form.endCity}
            onChange={e => set('endCity', e.target.value)}
            placeholder={trip.endCity || 'e.g. Athens'}
          />
          {errors.endCity && <span className="form-error">{errors.endCity}</span>}
          <span className="form-hint">Defaults from trip. Overridable per departure.</span>
        </div>
      </div>

      {/* ── Pricing ── */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Price (USD) <span className="required">*</span></label>
          <input
            type="number"
            className={`form-input ${errors.price ? 'error' : ''}`}
            value={form.price}
            onChange={e => set('price', Number(e.target.value))}
            placeholder="e.g. 3899"
            min={0}
          />
          {errors.price && <span className="form-error">{errors.price}</span>}
          <span className="form-hint">Defaults from trip base price.</span>
        </div>
        <div className="form-group">
          <label className="form-label">Deposit Amount (USD) <span className="required">*</span></label>
          <input
            type="number"
            className={`form-input ${errors.depositAmount ? 'error' : ''}`}
            value={form.depositAmount}
            onChange={e => set('depositAmount', Number(e.target.value))}
            placeholder="e.g. 500"
            min={0}
          />
          {errors.depositAmount && <span className="form-error">{errors.depositAmount}</span>}
        </div>
      </div>

      {/* ── Participants ── */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Min Participants <span className="required">*</span></label>
          <input
            type="number"
            className={`form-input ${errors.minParticipants ? 'error' : ''}`}
            value={form.minParticipants}
            onChange={e => set('minParticipants', Number(e.target.value))}
            min={1}
          />
          {errors.minParticipants && <span className="form-error">{errors.minParticipants}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Max Participants <span className="required">*</span></label>
          <input
            type="number"
            className={`form-input ${errors.maxParticipants ? 'error' : ''}`}
            value={form.maxParticipants}
            onChange={e => set('maxParticipants', Number(e.target.value))}
            min={1}
          />
          {errors.maxParticipants && <span className="form-error">{errors.maxParticipants}</span>}
        </div>
      </div>

      {/* ── Balance Payment Deadline ── */}
      <div className="form-row" style={{ alignItems: 'flex-end' }}>
        <div className="form-group">
          <label className="form-label">Balance Payment Deadline <span className="required">*</span></label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              className={`form-input ${errors.balancePaymentDeadlineDays ? 'error' : ''}`}
              value={form.balancePaymentDeadlineDays}
              onChange={e => set('balancePaymentDeadlineDays', Number(e.target.value))}
              min={1}
              style={{ maxWidth: 100 }}
            />
            <span style={{ font: '400 13px/1 var(--font-family)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
              days before departure
            </span>
          </div>
          {errors.balancePaymentDeadlineDays && <span className="form-error">{errors.balancePaymentDeadlineDays}</span>}
          <span className="form-hint">Detours default: 90 days · Mawari default: 120 days</span>
        </div>
        {form.balanceDeadlineDate && (
          <div className="form-group">
            <label className="form-label">Calculated Deadline Date</label>
            <div style={{
              padding: '9px 12px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              font: '500 13px/1 var(--font-family)',
              color: 'var(--color-brown-black)',
            }}>
              {formatDeadlineDate(form.balanceDeadlineDate)}
            </div>
          </div>
        )}
      </div>

      {/* ── Status ── */}
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          {DEPARTURE_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Waitlist Toggle ── */}
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'var(--space-2)' }}>
        <input
          type="checkbox"
          id="waitlistEnabled"
          checked={form.waitlistEnabled}
          onChange={e => set('waitlistEnabled', e.target.checked)}
          style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
        />
        <label htmlFor="waitlistEnabled" className="form-label" style={{ marginBottom: 0 }}>
          Enable Waitlist <span style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>(when sold out, guests can join a waitlist)</span>
        </label>
      </div>

      {/* ── Internal Notes ── */}
      <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
        <label className="form-label">Internal Notes</label>
        <textarea
          className="form-textarea"
          value={form.internalNotes}
          onChange={e => set('internalNotes', e.target.value)}
          rows={3}
          placeholder="Add any private notes about this departure — never visible to guests…"
        />
      </div>
    </Modal>
  );
}
