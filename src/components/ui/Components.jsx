import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Icons from './Icons';

// ─── Toast System ──────────────────────────────────────────────────────────────

export function ToastContainer() {
  const { state } = useApp();

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {state.toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function Toast({ toast }) {
  const icon = {
    success: <Icons.CheckCircle style={{ width: 16, height: 16, color: '#4ade80', flexShrink: 0 }} />,
    error: <Icons.X style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />,
    warning: <Icons.AlertTriangle style={{ width: 16, height: 16, color: '#fbbf24', flexShrink: 0 }} />,
    info: <Icons.Info style={{ width: 16, height: 16, color: '#60a5fa', flexShrink: 0 }} />,
  }[toast.type] || null;

  return (
    <div className={`toast toast-${toast.type}`} role="alert">
      {icon}
      <span>{toast.message}</span>
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

export function Modal({ isOpen, onClose, title, subtitle, children, footer, size = '', id }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size ? `modal-${size}` : ''}`} id={id} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <div className="modal-header">
          <div>
            <div className="modal-title" id={`${id}-title`}>{title}</div>
            {subtitle && <div className="modal-subtitle">{subtitle}</div>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <Icons.X style={{ width: 14, height: 14 }} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', confirmVariant = 'btn-danger' }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      id="confirm-dialog"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${confirmVariant}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
        </>
      }
    >
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const map = {
    'Open for Booking': 'open',
    'Sold Out': 'sold-out',
    'Waitlist Only': 'waitlist',
    'Closed': 'closed',
    'Cancelled': 'cancelled',
    'Completed': 'completed',
    'Draft': 'draft',
    'Published': 'published',
    'Inactive': 'inactive',
    'At Risk': 'at-risk',
  };
  const cls = map[status] || 'neutral';
  return <span className={`badge badge-${cls}`}>{status}</span>;
}

// ─── Dropdown ──────────────────────────────────────────────────────────────────

export function Dropdown({ trigger, items, onSelect, align = 'right' }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="dropdown-wrapper" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className="dropdown-menu" style={align === 'left' ? { right: 'auto', left: 0 } : {}}>
          {items.map((item, i) =>
            item.divider ? <div key={i} className="dropdown-divider" /> :
            <button key={i} className={`dropdown-item ${item.danger ? 'danger' : ''}`}
              onClick={() => { item.onClick?.(); onSelect?.(item); setOpen(false); }}>
              {item.icon && <span style={{ width: 16, height: 16 }}>{item.icon}</span>}
              {item.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tag Input ─────────────────────────────────────────────────────────────────

export function TagInput({ value = [], onChange, placeholder = 'Add tag…', suggestions = [] }) {
  const [input, setInput] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const add = (tag) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setInput('');
    setShowSuggestions(false);
  };

  const remove = (tag) => onChange(value.filter(t => t !== tag));

  const filteredSugs = suggestions.filter(s => !value.includes(s) && s.toLowerCase().includes(input.toLowerCase()));

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', border: '1px solid var(--color-border-strong)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface)', minHeight: 40 }}>
        {value.map(tag => (
          <span key={tag} className="tag tag-primary">
            {tag}
            <span className="tag-remove" onClick={() => remove(tag)}><Icons.X style={{ width: 10, height: 10 }} /></span>
          </span>
        ))}
        <input
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={e => { if (e.key === 'Enter' && input) { e.preventDefault(); add(input); } if (e.key === 'Backspace' && !input && value.length) remove(value[value.length - 1]); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          style={{ border: 'none', outline: 'none', flex: 1, minWidth: 80, fontSize: 13, fontFamily: 'var(--font-family)', background: 'transparent' }}
        />
      </div>
      {showSuggestions && filteredSugs.length > 0 && (
        <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, right: 0, maxHeight: 180, overflowY: 'auto' }}>
          {filteredSugs.map(s => (
            <button key={s} className="dropdown-item" onMouseDown={() => add(s)}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Rich Text Editor (Simple) ─────────────────────────────────────────────────

export function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }) {
  const ref = React.useRef(null);
  const [activeFormats, setActiveFormats] = React.useState([]);

  const exec = (cmd, val) => {
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    updateActive();
  };

  const updateActive = () => {
    const active = ['bold', 'italic', 'underline', 'insertUnorderedList', 'insertOrderedList']
      .filter(cmd => document.queryCommandState(cmd));
    setActiveFormats(active);
  };

  React.useEffect(() => {
    if (ref.current && value && !ref.current.innerHTML) {
      ref.current.innerHTML = value;
    }
  }, []);

  const toolbarItems = [
    { label: 'B', cmd: 'bold', style: { fontWeight: 700 } },
    { label: 'I', cmd: 'italic', style: { fontStyle: 'italic' } },
    { label: 'U', cmd: 'underline', style: { textDecoration: 'underline' } },
    { label: 'H3', cmd: 'formatBlock', val: 'h3' },
    { label: '• List', cmd: 'insertUnorderedList' },
    { label: '1. List', cmd: 'insertOrderedList' },
    { label: 'Link', cmd: 'createLink', val: '_url_' },
  ];

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar" role="toolbar">
        {toolbarItems.map(item => (
          <button
            key={item.cmd}
            type="button"
            className={`rich-editor-btn ${activeFormats.includes(item.cmd) ? 'active' : ''}`}
            style={item.style || {}}
            onMouseDown={(e) => {
              e.preventDefault();
              if (item.val === '_url_') {
                const url = prompt('Enter URL:');
                if (url) exec(item.cmd, url);
              } else {
                exec(item.cmd, item.val);
              }
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div
        ref={ref}
        className="rich-editor-content"
        contentEditable
        suppressContentEditableWarning
        onInput={() => { onChange(ref.current?.innerHTML || ''); updateActive(); }}
        onKeyUp={updateActive}
        onMouseUp={updateActive}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
}

// ─── Image Upload ──────────────────────────────────────────────────────────────

export function ImageUpload({ value, onChange, label = 'Upload Image', aspectRatio = '16/9', id }) {
  const [preview, setPreview] = React.useState(value || '');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(url);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(url);
  };

  return (
    <div>
      <div
        style={{
          border: '2px dashed var(--color-border-strong)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          background: 'var(--color-bg)',
          cursor: 'pointer',
          transition: 'border-color var(--transition-fast)',
          position: 'relative',
          aspectRatio,
          maxHeight: 200,
        }}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById(id || 'img-upload')?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, padding: 16 }}>
            <Icons.Image style={{ width: 32, height: 32, color: 'var(--color-text-placeholder)' }} />
            <span style={{ font: '400 12px/1.4 var(--font-family)', color: 'var(--color-text-muted)', textAlign: 'center' }}>
              {label}<br /><span style={{ color: 'var(--color-text-placeholder)', fontSize: 11 }}>Drop or click to upload</span>
            </span>
          </div>
        )}
        <input type="file" id={id || 'img-upload'} accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
      {preview && (
        <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}
          onClick={() => { setPreview(''); onChange(''); }}>
          Remove image
        </button>
      )}
    </div>
  );
}

// ─── Occupancy Bar ─────────────────────────────────────────────────────────────

export function OccupancyBar({ confirmed, max, min }) {
  const pct = Math.min(100, (confirmed / max) * 100);
  const atMin = min ? confirmed / max >= min / max : false;
  const variant = pct >= 100 ? 'danger' : !atMin ? 'warning' : 'success';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ font: '400 11px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>
          {confirmed} / {max} travelers
        </span>
        {min && (
          <span style={{ font: '400 11px/1 var(--font-family)', color: 'var(--color-text-muted)' }}>
            Min: {min}
          </span>
        )}
      </div>
      <div className="progress-bar-wrapper">
        <div className={`progress-bar-fill ${variant}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Inline Editable ───────────────────────────────────────────────────────────

export function InlineEdit({ value, onSave, tag: Tag = 'span', className = '' }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const inputRef = React.useRef(null);

  React.useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = () => { setEditing(false); if (draft !== value) onSave(draft); };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        style={{ font: 'inherit', border: '1px solid var(--color-primary)', borderRadius: 4, padding: '2px 6px', outline: 'none' }}
        className={className}
      />
    );
  }

  return (
    <Tag className={className} onClick={() => setEditing(true)} title="Click to edit" style={{ cursor: 'text', borderBottom: '1px dashed transparent' }}
      onMouseEnter={e => e.currentTarget.style.borderBottomColor = 'var(--color-border-strong)'}
      onMouseLeave={e => e.currentTarget.style.borderBottomColor = 'transparent'}>
      {value}
    </Tag>
  );
}
