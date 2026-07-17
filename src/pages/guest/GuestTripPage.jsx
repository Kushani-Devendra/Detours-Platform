import React, { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Icons } from '../../components/ui/Icons';
import BookingFlow from './BookingFlow';

const TABS = ['Overview', 'Itinerary', 'Accommodations', "What's Included", 'Trip Notes'];

export default function GuestTripPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const initialDepartureId = searchParams.get('departure');
  
  const { state } = useApp();
  const trip = state.trips.find(t => t.slug === `gay-tours/${slug}` || t.slug === slug);
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  
  if (!trip || trip.publishStatus === 'Draft' || trip.publishStatus === 'Inactive') {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', fontFamily: 'var(--font-family)' }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Trip Not Found</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>This trip is currently unavailable.</p>
        <Link to="/public/calendar" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>← Back to Calendar</Link>
      </div>
    );
  }
  
  const openDepartures = state.departures.filter(d => d.tripId === trip.id && ['Open for Booking', 'Waitlist Only', 'Sold Out'].includes(d.status));
  const hasAvailableDepartures = openDepartures.some(d => d.status === 'Open for Booking');

  return (
    <div style={{ fontFamily: 'var(--font-family)', background: 'var(--color-bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: 'var(--color-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div style={{ font: '600 18px/1 var(--font-family)', letterSpacing: '-0.5px' }}>Kapuli Travel</div>
          </div>
          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link to="/public/calendar" style={{ font: '500 14px/1 var(--font-family)', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>All Destinations</Link>
            <button className="btn btn-primary btn-sm" onClick={() => setShowBookingFlow(true)}>Book Now</button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      {trip.heroImage && (
        <div style={{ width: '100%', height: '55vh', minHeight: 400, position: 'relative' }}>
          <img src={trip.heroImage} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 60, left: 'max(24px, calc(50% - 600px))', color: '#fff', maxWidth: 800 }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <span className="badge badge-neutral" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', backdropFilter: 'blur(4px)' }}>{trip.region}</span>
              <span className="badge badge-neutral" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', backdropFilter: 'blur(4px)' }}>{trip.duration} Days</span>
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 700, margin: '0 0 16px', letterSpacing: '-1px', lineHeight: 1.1 }}>{trip.title}</h1>
            <div style={{ fontSize: 20, fontWeight: 400, opacity: 0.9 }}>{trip.departureCity} to {trip.endCity}</div>
          </div>
        </div>
      )}
      
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 60 }}>
          
          {/* Main Content */}
          <div>
            {/* Tabs */}
            <div className="tabs-underline" style={{ marginBottom: 40, borderBottom: '2px solid var(--color-border)' }}>
              {TABS.map(tab => (
                <button key={tab} className={`tab-underline-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} style={{ fontSize: 16, padding: '0 0 16px' }}>
                  {tab}
                </button>
              ))}
            </div>
            
            {/* ── Overview ── */}
            {activeTab === 'Overview' && (
              <div className="animation-fade-in">
                <div style={{ fontSize: 20, lineHeight: 1.6, color: 'var(--color-brown-black)', marginBottom: 40, fontWeight: 500 }} dangerouslySetInnerHTML={{ __html: trip.shortDescription }} />
                
                <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 24, letterSpacing: '-0.5px' }}>The Experience</h2>
                <div className="rich-text-content" style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: trip.fullDescription }} />
                
                {trip.mapImage && (
                  <div style={{ marginTop: 40 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 24, letterSpacing: '-0.5px' }}>Route Map</h2>
                    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                      <img src={trip.mapImage} alt="Route Map" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    </div>
                  </div>
                )}
                
                {trip.carouselImages?.length > 0 && (
                  <div style={{ marginTop: 40 }}>
                    <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 24, letterSpacing: '-0.5px' }}>Gallery</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                      {trip.carouselImages.map((img, i) => (
                        <div key={i} style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3' }}>
                          <img src={img} alt={`Gallery ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', ':hover': { transform: 'scale(1.05)' } }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* ── Itinerary ── */}
            {activeTab === 'Itinerary' && (
              <div className="animation-fade-in">
                <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 32, letterSpacing: '-0.5px' }}>Day by Day Itinerary</h2>
                {trip.itinerary.map((stop, idx) => (
                  <div key={stop.id} style={{ display: 'flex', gap: 24, marginBottom: 40 }}>
                    <div style={{ width: 60, flexShrink: 0, textAlign: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--color-surface)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 18, fontWeight: 600, color: 'var(--color-primary)' }}>
                        {idx + 1}
                      </div>
                      <div style={{ width: 2, background: 'var(--color-border)', margin: '8px auto 0', height: 'calc(100% - 16px)', display: idx === trip.itinerary.length - 1 ? 'none' : 'block' }} />
                    </div>
                    <div style={{ paddingBottom: 24 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-text-muted)', marginBottom: 4 }}>{stop.dayRange}</div>
                      <h3 style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 16 }}>{stop.stopTitle}</h3>
                      <div style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--color-text-secondary)', marginBottom: 24 }} dangerouslySetInnerHTML={{ __html: stop.description }} />
                      
                      {stop.includedActivities?.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 8 }}>Included Activities:</div>
                          <ul style={{ paddingLeft: 20, color: 'var(--color-text-secondary)', margin: 0 }}>
                            {stop.includedActivities.map((act, i) => <li key={i} style={{ marginBottom: 4 }}>{act}</li>)}
                          </ul>
                        </div>
                      )}
                      
                      {stop.optionalActivities?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 8 }}>Optional Activities:</div>
                          <ul style={{ paddingLeft: 20, color: 'var(--color-text-secondary)', margin: 0 }}>
                            {stop.optionalActivities.map((act, i) => <li key={i} style={{ marginBottom: 4 }}>{act}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* ── Accommodations ── */}
            {activeTab === 'Accommodations' && (
              <div className="animation-fade-in">
                <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 32, letterSpacing: '-0.5px' }}>Where You'll Stay</h2>
                {trip.accommodations.map(acc => {
                  const linkedStop = trip.itinerary.find(s => s.id === acc.linkedStop);
                  return (
                    <div key={acc.id} style={{ display: 'flex', gap: 32, marginBottom: 40, background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                      {acc.image && (
                        <div style={{ width: 300, flexShrink: 0 }}>
                          <img src={acc.image} alt={acc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ padding: 32, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--color-primary)', marginBottom: 8 }}>
                          {linkedStop ? linkedStop.city : 'Accommodation'}
                        </div>
                        <h3 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 16 }}>{acc.name}</h3>
                        <div style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--color-text-secondary)', marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: acc.description }} />
                        {acc.disclaimer && (
                          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '12px 16px', background: 'var(--color-surface)', borderRadius: 8 }}>
                            {acc.disclaimer}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* ── What's Included ── */}
            {activeTab === "What's Included" && (
              <div className="animation-fade-in">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Icons.CheckCircle style={{ width: 28, height: 28, color: 'var(--color-success)' }} />
                      What's Included
                    </h2>
                    <div className="rich-text-content" style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: trip.inclusions }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Icons.X style={{ width: 28, height: 28, color: 'var(--color-error)' }} />
                      Not Included
                    </h2>
                    <div className="rich-text-content" style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--color-text-secondary)' }} dangerouslySetInnerHTML={{ __html: trip.exclusions }} />
                  </div>
                </div>
                {trip.additionalSpendingNote && (
                  <div style={{ marginTop: 40, padding: 24, background: '#fffdf5', border: '1px solid rgba(193,120,0,0.2)', borderRadius: 12, display: 'flex', gap: 16 }}>
                    <Icons.DollarSign style={{ width: 24, height: 24, color: '#c17800', flexShrink: 0 }} />
                    <div style={{ fontSize: 16, lineHeight: 1.6, color: 'var(--color-brown-black)' }}>{trip.additionalSpendingNote}</div>
                  </div>
                )}
              </div>
            )}
            
            {/* ── Trip Notes ── */}
            {activeTab === 'Trip Notes' && (
              <div className="animation-fade-in">
                <h2 style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 32, letterSpacing: '-0.5px' }}>Good to Know</h2>
                <div className="rich-text-content" style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--color-text-secondary)', background: '#fff', padding: 40, borderRadius: 16, border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} dangerouslySetInnerHTML={{ __html: trip.tripNotes }} />
              </div>
            )}
            
          </div>
          
          {/* Sidebar / Booking Card */}
          <div>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)', position: 'sticky', top: 100 }}>
              <div style={{ fontSize: 14, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>Trip Price From</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: 'var(--color-brown-black)', marginBottom: 8 }}>
                ${trip.basePrice?.toLocaleString()} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-text-secondary)' }}>USD</span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 32 }}>Per person, based on double occupancy.</div>
              
              {openDepartures.length > 0 ? (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 12 }}>Upcoming Departures:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {openDepartures.slice(0, 3).map(dep => {
                        const date = new Date(dep.departureDate);
                        return (
                          <div key={dep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--color-surface)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                            <div>
                              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-brown-black)' }}>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{dep.status}</div>
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>${dep.price?.toLocaleString()}</div>
                          </div>
                        );
                      })}
                      {openDepartures.length > 3 && (
                        <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'center' }} onClick={() => setShowBookingFlow(true)}>View all {openDepartures.length} dates</button>
                      )}
                    </div>
                  </div>
                  <button 
                    style={{ width: '100%', padding: '16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', ':hover': { background: '#d64319' } }}
                    onClick={() => setShowBookingFlow(true)}
                  >
                    {hasAvailableDepartures ? 'Book Now' : 'Join Waitlist'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 24, background: 'var(--color-surface)', borderRadius: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-brown-black)', marginBottom: 8 }}>No departures currently available</div>
                  <div style={{ fontSize: 14, color: 'var(--color-text-muted)' }}>Check back later for new dates.</div>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, color: 'var(--color-text-muted)', fontSize: 13 }}>
                <Icons.Info style={{ width: 14, height: 14 }} />
                Deposit fully refundable for 48 hours
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showBookingFlow && (
        <BookingFlow trip={trip} initialDepartureId={initialDepartureId} onClose={() => setShowBookingFlow(false)} />
      )}
    </div>
  );
}
