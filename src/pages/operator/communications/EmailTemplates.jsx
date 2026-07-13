import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { Icons } from '../../../components/ui/Icons';
import { RichTextEditor, Modal } from '../../../components/ui/Components';

const VARIABLES = [
  '{GuestFirstName}', '{GuestLastName}', '{TripName}', '{DepartureDate}', 
  '{ReturnDate}', '{TotalAmount}', '{AmountPaid}', '{BalanceDue}'
];

export default function EmailTemplates() {
  const { state, dispatch, showToast } = useApp();
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form, setForm] = useState(null);

  const templates = state.emailTemplates;

  const handleEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setForm({ ...tmpl });
  };

  const handleSave = () => {
    if (!form.subject || !form.body) {
      showToast('Subject and body are required', 'error');
      return;
    }
    dispatch({ type: 'UPDATE_EMAIL_TEMPLATE', payload: form });
    showToast('Template updated successfully', 'success');
    setEditingTemplate(null);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Email Templates</h1>
          <p className="page-subtitle">Manage automated and manual email communications</p>
        </div>
      </div>

      <div className="info-banner" style={{ marginBottom: 'var(--space-6)' }}>
        <Icons.Info style={{ width: 16, height: 16, color: 'var(--color-info)' }} />
        <span className="info-banner-text">
          These templates are automatically sent to guests based on specific triggers (e.g., booking confirmation, payment reminders).
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 'var(--space-4)' }}>
        {templates.map(tmpl => (
          <div key={tmpl.id} className="card">
            <div className="card-header" style={{ paddingBottom: 12 }}>
              <div>
                <div style={{ font: '600 15px/1 var(--font-family)', color: 'var(--color-brown-black)', marginBottom: 4 }}>{tmpl.name}</div>
                <div style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>Trigger: {tmpl.trigger}</div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => handleEdit(tmpl)}>
                <Icons.Edit style={{ width: 14, height: 14 }} />
              </button>
            </div>
            <div className="card-body" style={{ paddingTop: 0 }}>
              <div style={{ padding: '12px', background: 'var(--color-surface)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Subject:</div>
                <div style={{ fontSize: 14, color: 'var(--color-brown-black)', marginBottom: 12 }}>{tmpl.subject}</div>
                
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Body Preview:</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} 
                     dangerouslySetInnerHTML={{ __html: tmpl.body }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingTemplate && form && (
        <Modal
          isOpen={true}
          onClose={() => setEditingTemplate(null)}
          title={`Edit Template: ${form.name}`}
          size="lg"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditingTemplate(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>Save Template</button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Email Subject</label>
            <input 
              className="form-input" 
              value={form.subject} 
              onChange={e => setForm({ ...form, subject: e.target.value })} 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Available Variables</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {VARIABLES.map(v => (
                <span 
                  key={v} 
                  className="badge badge-neutral" 
                  style={{ cursor: 'pointer', userSelect: 'all' }}
                  onClick={() => {
                    navigator.clipboard.writeText(v);
                    showToast('Variable copied to clipboard', 'info');
                  }}
                  title="Click to copy"
                >
                  {v}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6 }}>Click a variable to copy it, then paste it into the subject or body.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Body</label>
            <RichTextEditor 
              value={form.body} 
              onChange={v => setForm({ ...form, body: v })} 
              minHeight={250} 
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
