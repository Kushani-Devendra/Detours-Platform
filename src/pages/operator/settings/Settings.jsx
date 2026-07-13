import React from 'react';
import { useApp } from '../../../context/AppContext';
import { Icons } from '../../../components/ui/Icons';

export default function Settings() {
  const { showToast } = useApp();

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Platform configuration and global preferences</p>
        </div>
      </div>

      <div className="card card-padded" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="section-heading">Brand Configuration</div>
        <div className="form-group">
          <label className="form-label">Brand Name</label>
          <input className="form-input" defaultValue="Kapuli Travel" />
        </div>
        <div className="form-group">
          <label className="form-label">Support Email</label>
          <input className="form-input" defaultValue="support@kapuli.com" />
        </div>
        <button className="btn btn-primary" onClick={() => showToast('Settings saved', 'success')}>Save Brand Settings</button>
      </div>

      <div className="card card-padded" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="section-heading">Booking Policies</div>
        <div className="form-group">
          <label className="form-label">Standard Deposit Amount (USD)</label>
          <input className="form-input" type="number" defaultValue="500" />
        </div>
        <div className="form-group">
          <label className="form-label">Final Payment Due (Days before departure)</label>
          <input className="form-input" type="number" defaultValue="90" />
        </div>
        <div className="form-group">
          <label className="form-label">At-Risk Warning Threshold (Days)</label>
          <input className="form-input" type="number" defaultValue="90" />
          <span className="form-hint">Departures will show an "At-Risk" warning if they have not met minimum occupancy by this threshold.</span>
        </div>
        <button className="btn btn-primary" onClick={() => showToast('Policies saved', 'success')}>Save Policies</button>
      </div>

      <div className="card card-padded">
        <div className="section-heading" style={{ color: 'var(--color-error)' }}>Danger Zone</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ font: '500 15px/1 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 4 }}>Reset Application Data</div>
            <div style={{ font: '400 13px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>This will clear all localStorage data and restore the initial mock data.</div>
          </div>
          <button 
            className="btn btn-danger" 
            onClick={() => {
              if (window.confirm('Are you sure you want to reset all data? This will reload the page.')) {
                localStorage.removeItem('kapuli_state');
                window.location.reload();
              }
            }}
          >
            Reset Data
          </button>
        </div>
      </div>
    </div>
  );
}
