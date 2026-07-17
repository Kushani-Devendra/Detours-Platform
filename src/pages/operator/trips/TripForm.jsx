import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { RichTextEditor, ImageUpload, TagInput, Modal } from '../../../components/ui/Components';
import { Icons } from '../../../components/ui/Icons';

const REGIONS = ['Europe', 'Asia-Pacific', 'Africa', 'Latin America', 'Other'];
const TRIP_TYPES = ['Standard Trip', 'One-Time Trip', 'Trip Extension'];
const BRANDS = ['Detours', 'Mawari'];
const DESTINATION_SUGGESTIONS = ['Greece', 'Thailand', 'Cambodia', 'Japan', 'France', 'Germany', 'Italy', 'Spain', 'New Zealand', 'Australia', 'Kenya', 'Morocco', 'Peru', 'Colombia', 'Iceland'];

const EMPTY_TRIP = {
  title: '', slug: '', shortDescription: '', fullDescription: '',
  brand: 'Detours', tripType: 'Standard Trip', duration: '', destinations: [], region: 'Europe',
  departureCity: '', endCity: '', heroImage: '', mapImage: '', carouselImages: [],
  basePrice: '', navigationLabel: '', tripCategoryTags: [],
  seoTitle: '', seoDescription: '', seoKeywords: '',
  publishStatus: 'Draft', internalNotes: '', tags: [],
  itinerary: [], accommodations: [],
  inclusions: '', exclusions: '', additionalSpendingNote: '', tripNotes: '',
};

const EMPTY_STOP = { id: '', stopTitle: '', dayRange: '', city: '', description: '', includedActivities: [], optionalActivities: [] };
const EMPTY_ACCOM = { id: '', name: '', linkedStop: '', description: '', image: '', disclaimer: '' };

const TABS = ['Details', 'Itinerary', 'Accommodations', "What's Included", 'Trip Notes', 'SEO & Settings'];

export default function TripForm() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, showToast, addAuditEntry, requirementsLibrary } = useApp();

  const isEdit = !!tripId && tripId !== 'new';
  const existing = isEdit ? state.trips.find(t => t.id === tripId) : null;

  const [activeTab, setActiveTab] = useState('Details');
  const [form, setForm] = useState(existing || EMPTY_TRIP);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(isEdit);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugTouched && form.title) {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setForm(f => ({ ...f, slug: `gay-tours/${slug}` }));
    }
  }, [form.title, slugTouched]);

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validate = (publishCheck = false) => {
    const e = {};
    if (!form.title) e.title = 'Trip title is required';
    if (!form.slug) e.slug = 'URL slug is required';
    if (publishCheck) {
      if (!form.shortDescription) e.shortDescription = 'Short description is required';
      if (!form.fullDescription) e.fullDescription = 'Full description is required';
      if (!form.tripType) e.tripType = 'Trip type is required';
      if (!form.duration) e.duration = 'Duration is required';
      if (form.destinations.length === 0) e.destinations = 'At least one destination required';
      if (!form.region) e.region = 'Region is required';
      if (!form.departureCity) e.departureCity = 'Departure city is required';
      if (!form.endCity) e.endCity = 'End city is required';
      if (!form.heroImage) e.heroImage = 'Hero image is required';
      if (!form.mapImage) e.mapImage = 'Map image is required';
      if (!form.basePrice) e.basePrice = 'Base price is required';
    }
    // Slug uniqueness check
    const slugConflict = state.trips.find(t => t.slug === form.slug && t.id !== tripId);
    if (slugConflict) e.slug = 'This URL slug is already in use';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = (publishStatus) => {
    if (!validate(publishStatus === 'Published')) return;
    setSaving(true);

    const payload = {
      ...form,
      id: isEdit ? tripId : `trip-${Date.now()}`,
      publishStatus: publishStatus || form.publishStatus,
      createdAt: existing?.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    if (isEdit) {
      if (existing.publishStatus !== payload.publishStatus) {
        addAuditEntry('Trip', tripId, 'publishStatus', existing.publishStatus, payload.publishStatus);
      }
      dispatch({ type: 'UPDATE_TRIP', payload });
      showToast('Trip saved successfully', 'success');
    } else {
      dispatch({ type: 'ADD_TRIP', payload });
      showToast('Trip created successfully', 'success');
    }

    setSaving(false);
    navigate(`/trips/${payload.id}`);
  };

  // ── Itinerary Helpers ──
  const addStop = () => {
    const stop = { ...EMPTY_STOP, id: `it-${Date.now()}` };
    set('itinerary', [...form.itinerary, stop]);
  };

  const updateStop = (idx, field, value) => {
    const updated = form.itinerary.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    set('itinerary', updated);
  };

  const removeStop = (idx) => {
    set('itinerary', form.itinerary.filter((_, i) => i !== idx));
  };

  const moveStop = (idx, dir) => {
    const arr = [...form.itinerary];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    set('itinerary', arr);
  };

  const addActivity = (stopIdx, type) => {
    const stops = [...form.itinerary];
    stops[stopIdx] = { ...stops[stopIdx], [type]: [...stops[stopIdx][type], ''] };
    set('itinerary', stops);
  };

  const updateActivity = (stopIdx, type, actIdx, value) => {
    const stops = [...form.itinerary];
    const activities = [...stops[stopIdx][type]];
    activities[actIdx] = value;
    stops[stopIdx] = { ...stops[stopIdx], [type]: activities };
    set('itinerary', stops);
  };

  const removeActivity = (stopIdx, type, actIdx) => {
    const stops = [...form.itinerary];
    stops[stopIdx] = { ...stops[stopIdx], [type]: stops[stopIdx][type].filter((_, i) => i !== actIdx) };
    set('itinerary', stops);
  };

  // ── Accommodation Helpers ──
  const addAccom = () => {
    const acc = { ...EMPTY_ACCOM, id: `acc-${Date.now()}` };
    set('accommodations', [...form.accommodations, acc]);
  };

  const updateAccom = (idx, field, value) => {
    set('accommodations', form.accommodations.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const removeAccom = (idx) => {
    set('accommodations', form.accommodations.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isEdit ? 'Edit Trip' : 'New Trip'}</h1>
          <p className="page-subtitle">{isEdit ? `Editing: ${form.title}` : 'Create a new trip with all details'}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn btn-secondary" onClick={() => save('Draft')} disabled={saving}>
            {saving ? <span className="spinner" /> : null}
            Save as Draft
          </button>
          <button className="btn btn-primary" onClick={() => save('Published')} disabled={saving} id="trip-form-publish-btn">
            {saving ? <span className="spinner" /> : null}
            <Icons.Globe style={{ width: 14, height: 14 }} />
            Publish
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-underline">
        {TABS.map(tab => (
          <button key={tab} className={`tab-underline-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} id={`trip-tab-${tab.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Details Tab ── */}
      {activeTab === 'Details' && (
        <div style={{ maxWidth: 860 }}>
          <div className="card card-padded">
            <div className="section-heading">Core Information</div>

            <div className="form-group">
              <label className="form-label">Trip Title <span className="required">*</span></label>
              <input id="trip-title" className={`form-input ${errors.title ? 'error' : ''}`} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. 11 Days in Greece" />
              {errors.title && <span className="form-error">{errors.title}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Trip URL Slug <span className="required">*</span></label>
                <input id="trip-slug" className={`form-input ${errors.slug ? 'error' : ''}`} value={form.slug}
                  onChange={e => { setSlugTouched(true); set('slug', e.target.value); }}
                  placeholder="gay-tours/greece" />
                {errors.slug && <span className="form-error">{errors.slug}</span>}
                <span className="form-hint">Must be unique. Platform will warn if slug conflicts.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Navigation Menu Label</label>
                <input className="form-input" value={form.navigationLabel} onChange={e => set('navigationLabel', e.target.value)} placeholder="e.g. Greece" />
                <span className="form-hint">May differ from full trip title.</span>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Brand <span className="required">*</span></label>
                <select id="trip-brand" className="form-select" value={form.brand || 'Detours'} onChange={e => set('brand', e.target.value)}>
                  {BRANDS.map(b => <option key={b}>{b}</option>)}
                </select>
                <span className="form-hint">Determines which website the trip appears on and payment / email defaults for departures.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Trip Type <span className="required">*</span></label>
                <select id="trip-type" className={`form-select ${errors.tripType ? 'error' : ''}`} value={form.tripType} onChange={e => set('tripType', e.target.value)}>
                  {TRIP_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration (days) <span className="required">*</span></label>
                <input type="number" id="trip-duration" className={`form-input ${errors.duration ? 'error' : ''}`} value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="e.g. 11" min={1} />
                {errors.duration && <span className="form-error">{errors.duration}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Region <span className="required">*</span></label>
                <select id="trip-region" className={`form-select ${errors.region ? 'error' : ''}`} value={form.region} onChange={e => set('region', e.target.value)}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Base Price (USD) <span className="required">*</span></label>
                <input type="number" id="trip-price" className={`form-input ${errors.basePrice ? 'error' : ''}`} value={form.basePrice} onChange={e => set('basePrice', Number(e.target.value))} placeholder="e.g. 3899" min={0} />
                {errors.basePrice && <span className="form-error">{errors.basePrice}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Departure City <span className="required">*</span></label>
                <input className={`form-input ${errors.departureCity ? 'error' : ''}`} value={form.departureCity} onChange={e => set('departureCity', e.target.value)} placeholder="e.g. Athens" />
                {errors.departureCity && <span className="form-error">{errors.departureCity}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">End City <span className="required">*</span></label>
                <input className={`form-input ${errors.endCity ? 'error' : ''}`} value={form.endCity} onChange={e => set('endCity', e.target.value)} placeholder="e.g. Athens" />
                {errors.endCity && <span className="form-error">{errors.endCity}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Destinations <span className="required">*</span></label>
              <TagInput value={form.destinations} onChange={v => set('destinations', v)} suggestions={DESTINATION_SUGGESTIONS} placeholder="Add destination…" />
              {errors.destinations && <span className="form-error">{errors.destinations}</span>}
              <span className="form-hint">Used for navigation categorisation and search filters.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Trip Category Tags</label>
              <TagInput value={form.tripCategoryTags} onChange={v => set('tripCategoryTags', v)} suggestions={['One Time Trips', 'Featured', 'New']} placeholder="Add category…" />
            </div>
          </div>

          <div className="card card-padded" style={{ marginTop: 'var(--space-5)' }}>
            <div className="section-heading">Descriptions</div>
            <div className="form-group">
              <label className="form-label">Short Description <span className="required">*</span></label>
              <RichTextEditor value={form.shortDescription} onChange={v => set('shortDescription', v)} placeholder="Introductory paragraph shown on trip cards…" minHeight={80} />
              {errors.shortDescription && <span className="form-error">{errors.shortDescription}</span>}
              <span className="form-hint">Shown on trip cards and at the top of the trip page.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Full Description <span className="required">*</span></label>
              <RichTextEditor value={form.fullDescription} onChange={v => set('fullDescription', v)} placeholder="Full trip narrative…" minHeight={160} />
              {errors.fullDescription && <span className="form-error">{errors.fullDescription}</span>}
              <span className="form-hint">Full narrative on the trip page. Supports text formatting and images.</span>
            </div>
          </div>

          <div className="card card-padded" style={{ marginTop: 'var(--space-5)' }}>
            <div className="section-heading">Media</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Hero Image <span className="required">*</span></label>
                <ImageUpload value={form.heroImage} onChange={v => set('heroImage', v)} label="Upload hero image" id="hero-img" aspectRatio="16/9" />
                {errors.heroImage && <span className="form-error">{errors.heroImage}</span>}
                <span className="form-hint">Main image — trip page, cards, booking summary, calendar.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Map Image <span className="required">*</span></label>
                <ImageUpload value={form.mapImage} onChange={v => set('mapImage', v)} label="Upload map image" id="map-img" aspectRatio="16/9" />
                {errors.mapImage && <span className="form-error">{errors.mapImage}</span>}
                <span className="form-hint">Route map shown on the trip page.</span>
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
              <label className="form-label">Carousel Gallery Images</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
                {(form.carouselImages || []).map((img, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={img} alt={`Gallery ${i+1}`} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 8 }} />
                    <button type="button" onClick={() => set('carouselImages', form.carouselImages.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
                      <Icons.X style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => {
                    const url = prompt('Enter image URL for carousel:');
                    if (url) set('carouselImages', [...(form.carouselImages || []), url]);
                  }}
                  style={{ border: '2px dashed var(--color-border-strong)', borderRadius: 8, aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 6, color: 'var(--color-text-muted)' }}>
                  <Icons.Plus style={{ width: 20, height: 20 }} />
                  <span style={{ fontSize: 11 }}>Add image</span>
                </div>
              </div>
              <span className="form-hint">Photo carousel shown on the trip page below the map.</span>
            </div>
          </div>

          <div className="card card-padded" style={{ marginTop: 'var(--space-5)' }}>
            <div className="section-heading">Internal</div>
            <div className="form-group">
              <label className="form-label">Internal Notes</label>
              <textarea className="form-textarea" value={form.internalNotes} onChange={e => set('internalNotes', e.target.value)} placeholder="Staff notes — never visible to guests…" rows={3} />
            </div>
            <div className="form-group">
              <label className="form-label">Internal Tags</label>
              <TagInput value={form.tags || []} onChange={v => set('tags', v)} suggestions={['Popular', 'Island', 'Culture', 'Adventure', 'Cruise', 'One-Time', 'Peak Season']} placeholder="Add internal tag…" />
            </div>
          </div>
        </div>
      )}

      {/* ── Itinerary Tab ── */}
      {activeTab === 'Itinerary' && (
        <div style={{ maxWidth: 860 }}>
          <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ font: '500 14px/1 var(--font-family)', color: 'var(--color-brown-black)' }}>Itinerary Stops</div>
              <div style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-muted)', marginTop: 3 }}>Build a day-by-day itinerary. Stops are displayed in order on the trip page.</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addStop} id="add-itinerary-stop-btn">
              <Icons.Plus style={{ width: 13, height: 13 }} /> Add Stop
            </button>
          </div>

          {form.itinerary.length === 0 && (
            <div className="card card-padded" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Icons.Map style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ font: '500 14px/1 var(--font-family)', marginBottom: 4 }}>No itinerary stops yet</div>
              <div style={{ font: '400 12px/1 var(--font-family)', marginBottom: 16 }}>Add stops to build your day-by-day itinerary.</div>
              <button className="btn btn-primary btn-sm" onClick={addStop}>Add first stop</button>
            </div>
          )}

          {form.itinerary.map((stop, idx) => (
            <div className="accordion-item" key={stop.id}>
              <div className="accordion-header" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div className="drag-handle">
                    <Icons.GripVertical style={{ width: 16, height: 16 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-ghost btn-xs" onClick={() => moveStop(idx, -1)} disabled={idx === 0}>↑</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => moveStop(idx, 1)} disabled={idx === form.itinerary.length - 1}>↓</button>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="accordion-title">{stop.stopTitle || `Stop ${idx + 1}`}</div>
                    <div className="accordion-subtitle">{stop.city || 'No city set'} · {stop.dayRange || 'No days set'}</div>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => removeStop(idx)}>
                  <Icons.Trash style={{ width: 13, height: 13 }} />
                </button>
              </div>
              <div className="accordion-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Stop Title <span className="required">*</span></label>
                    <input className="form-input" value={stop.stopTitle} onChange={e => updateStop(idx, 'stopTitle', e.target.value)} placeholder="e.g. Days 1 and 2 – ATHENS" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Day Range <span className="required">*</span></label>
                    <input className="form-input" value={stop.dayRange} onChange={e => updateStop(idx, 'dayRange', e.target.value)} placeholder="e.g. Days 1 and 2" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Destination / City <span className="required">*</span></label>
                  <input className="form-input" value={stop.city} onChange={e => updateStop(idx, 'city', e.target.value)} placeholder="e.g. Athens" />
                </div>
                <div className="form-group">
                  <label className="form-label">Stop Description <span className="required">*</span></label>
                  <RichTextEditor value={stop.description} onChange={v => updateStop(idx, 'description', v)} placeholder="Narrative for this stop…" minHeight={100} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Included Activities</label>
                    {stop.includedActivities.map((act, ai) => (
                      <div key={ai} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input className="form-input" value={act} onChange={e => updateActivity(idx, 'includedActivities', ai, e.target.value)} placeholder="Activity name" />
                        <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeActivity(idx, 'includedActivities', ai)}>
                          <Icons.X style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => addActivity(idx, 'includedActivities')}>
                      <Icons.Plus style={{ width: 12, height: 12 }} /> Add Activity
                    </button>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Optional Activities</label>
                    {stop.optionalActivities.map((act, ai) => (
                      <div key={ai} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input className="form-input" value={act} onChange={e => updateActivity(idx, 'optionalActivities', ai, e.target.value)} placeholder="Activity name" />
                        <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeActivity(idx, 'optionalActivities', ai)}>
                          <Icons.X style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    ))}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => addActivity(idx, 'optionalActivities')}>
                      <Icons.Plus style={{ width: 12, height: 12 }} /> Add Activity
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Accommodations Tab ── */}
      {activeTab === 'Accommodations' && (
        <div style={{ maxWidth: 860 }}>
          <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ font: '500 14px/1 var(--font-family)', color: 'var(--color-brown-black)' }}>Accommodation Properties</div>
              <div style={{ font: '400 12px/1 var(--font-family)', color: 'var(--color-text-muted)', marginTop: 3 }}>Add properties for each destination. They appear in the Accommodations tab on the public trip page.</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addAccom} id="add-accommodation-btn">
              <Icons.Plus style={{ width: 13, height: 13 }} /> Add Accommodation
            </button>
          </div>

          {form.accommodations.length === 0 && (
            <div className="card card-padded" style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Icons.Bed style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.3 }} />
              <div style={{ font: '500 14px/1 var(--font-family)', marginBottom: 4 }}>No accommodations yet</div>
              <div style={{ font: '400 12px/1 var(--font-family)', marginBottom: 16 }}>Add properties for each stop on your itinerary.</div>
              <button className="btn btn-primary btn-sm" onClick={addAccom}>Add first accommodation</button>
            </div>
          )}

          {form.accommodations.map((acc, idx) => (
            <div className="accordion-item" key={acc.id}>
              <div className="accordion-header" style={{ cursor: 'default' }}>
                <div>
                  <div className="accordion-title">{acc.name || `Accommodation ${idx + 1}`}</div>
                  <div className="accordion-subtitle">
                    {acc.linkedStop ? (form.itinerary.find(s => s.id === acc.linkedStop)?.city || 'Linked stop') : 'No stop linked'}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => removeAccom(idx)}>
                  <Icons.Trash style={{ width: 13, height: 13 }} />
                </button>
              </div>
              <div className="accordion-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Accommodation Name <span className="required">*</span></label>
                    <input className="form-input" value={acc.name} onChange={e => updateAccom(idx, 'name', e.target.value)} placeholder="e.g. 360 Degrees Pop Art Hotel" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Linked Itinerary Stop <span className="required">*</span></label>
                    <select className="form-select" value={acc.linkedStop} onChange={e => updateAccom(idx, 'linkedStop', e.target.value)}>
                      <option value="">Select stop…</option>
                      {form.itinerary.map(s => <option key={s.id} value={s.id}>{s.stopTitle || s.city}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description <span className="required">*</span></label>
                  <RichTextEditor value={acc.description} onChange={v => updateAccom(idx, 'description', v)} placeholder="Description of the property and its amenities…" minHeight={80} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Property Image</label>
                    <ImageUpload value={acc.image} onChange={v => updateAccom(idx, 'image', v)} label="Upload property photo" id={`acc-img-${idx}`} aspectRatio="4/3" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Disclaimer Note</label>
                    <textarea className="form-textarea" value={acc.disclaimer} onChange={e => updateAccom(idx, 'disclaimer', e.target.value)} placeholder="e.g. Properties listed represent where we have stayed in the past…" rows={3} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── What's Included Tab ── */}
      {activeTab === "What's Included" && (
        <div style={{ maxWidth: 860 }}>
          <div className="card card-padded">
            <div className="section-heading">Inclusions & Exclusions</div>
            <div className="form-group">
              <label className="form-label">Inclusions <span className="required">*</span></label>
              <RichTextEditor value={form.inclusions} onChange={v => set('inclusions', v)} placeholder="Items covered in the trip price…" minHeight={160} />
              <span className="form-hint">Examples: All taxes, all group transportation, all accommodation, welcome dinner, Detours leader.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Exclusions <span className="required">*</span></label>
              <RichTextEditor value={form.exclusions} onChange={v => set('exclusions', v)} placeholder="Items not covered in the trip price…" minHeight={160} />
              <span className="form-hint">Examples: International airfare, airport transfers, meals not listed, travel insurance, gratuities.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Additional Spending Note</label>
              <input className="form-input" value={form.additionalSpendingNote} onChange={e => set('additionalSpendingNote', e.target.value)}
                placeholder="e.g. We recommend budgeting an additional $800–$1,200 USD for optional activities…" />
              <span className="form-hint">Optional guidance on recommended additional budget.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Trip Notes Tab ── */}
      {activeTab === 'Trip Notes' && (
        <div style={{ maxWidth: 860 }}>
          <div className="card card-padded">
            <div className="section-heading">Trip Notes</div>
            <div className="info-banner">
              <Icons.Info style={{ width: 16, height: 16 }} className="info-banner-icon" />
              <span className="info-banner-text">
                Trip Notes is a rich text field. Structure content freely using headings, paragraphs, and bullet points.
                Content types to cover: <strong>Weather & Climate, Activity Level, Group Size, Itinerary Notes, Arrival & Logistics, Additional Guidance.</strong>
              </span>
            </div>
            <div className="form-group">
              <RichTextEditor value={form.tripNotes} onChange={v => set('tripNotes', v)}
                placeholder="Add trip notes for guests — weather, activity level, group size, arrival logistics, etc."
                minHeight={280} />
            </div>
          </div>
        </div>
      )}

      {/* ── SEO & Settings Tab ── */}
      {activeTab === 'SEO & Settings' && (
        <div style={{ maxWidth: 860 }}>
          <div className="card card-padded">
            <div className="section-heading">SEO Settings</div>
            <div className="form-group">
              <label className="form-label">SEO Title</label>
              <input className="form-input" value={form.seoTitle} onChange={e => set('seoTitle', e.target.value)} placeholder="e.g. 11 Days in Greece | Gay Tours | Detours Travel" maxLength={70} />
              <span className="form-hint">{form.seoTitle?.length || 0}/70 characters. Applied to the trip page's HTML title tag.</span>
            </div>
            <div className="form-group">
              <label className="form-label">SEO Description</label>
              <textarea className="form-textarea" value={form.seoDescription} onChange={e => set('seoDescription', e.target.value)} placeholder="Compelling meta description for search engines…" rows={3} maxLength={160} />
              <span className="form-hint">{form.seoDescription?.length || 0}/160 characters.</span>
            </div>
            <div className="form-group">
              <label className="form-label">SEO Keywords</label>
              <input className="form-input" value={form.seoKeywords} onChange={e => set('seoKeywords', e.target.value)} placeholder="e.g. greece gay tour, athens santorini mykonos" />
              <span className="form-hint">Comma-separated keywords for search engine indexing.</span>
            </div>
          </div>

          <div className="card card-padded" style={{ marginTop: 'var(--space-5)' }}>
            <div className="section-heading">Publishing</div>
            <div className="form-group">
              <label className="form-label">Publish Status</label>
              <select className="form-select" style={{ maxWidth: 200 }} value={form.publishStatus} onChange={e => set('publishStatus', e.target.value)} id="trip-publish-status">
                <option>Draft</option>
                <option>Published</option>
                <option>Inactive</option>
              </select>
              <span className="form-hint">Draft and Inactive trips are not visible on the website. Status changes take effect immediately on save.</span>
            </div>
          </div>
        </div>
      )}

      {/* Fixed footer save */}
      <div style={{ position: 'sticky', bottom: 0, background: 'rgba(247,245,243,0.95)', backdropFilter: 'blur(8px)', borderTop: '1px solid var(--color-border)', padding: 'var(--space-4) 0', marginTop: 'var(--space-8)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
        <button className="btn btn-secondary" onClick={() => save('Draft')} disabled={saving}>Save Draft</button>
        <button className="btn btn-primary" onClick={() => save('Published')} disabled={saving}>
          <Icons.Globe style={{ width: 14, height: 14 }} />
          Publish Trip
        </button>
      </div>
    </div>
  );
}
