import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Icons } from '../../components/ui/Icons';
import { StatusBadge } from '../../components/ui/Components';

export default function GuestPublicCalendar() {
  const { state } = useApp();
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('All');
  const [monthFilter, setMonthFilter] = useState('All');

  const publishedTrips = state.trips.filter(t => t.publishStatus === 'Published');
  const openDepartures = state.departures.filter(d => ['Open for Booking', 'Sold Out', 'Waitlist Only'].includes(d.status));

  // Generate unique months for filter
  const months = useMemo(() => {
    const unique = new Set();
    openDepartures.forEach(d => {
      const date = new Date(d.departureDate);
      if (!isNaN(date)) unique.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(unique).sort().map(val => {
      const [y, m] = val.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1, 1);
      return { value: val, label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
    });
  }, [openDepartures]);

  // Filter departures
  const filteredDepartures = useMemo(() => {
    return openDepartures.filter(dep => {
      const trip = publishedTrips.find(t => t.id === dep.tripId);
      if (!trip) return false;

      const matchSearch = trip.title.toLowerCase().includes(search.toLowerCase()) || 
                          trip.destinations.some(dest => dest.toLowerCase().includes(search.toLowerCase()));
      const matchRegion = regionFilter === 'All' || trip.region === regionFilter;
      
      let matchMonth = true;
      if (monthFilter !== 'All') {
        const date = new Date(dep.departureDate);
        const depMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        matchMonth = depMonth === monthFilter;
      }

      return matchSearch && matchRegion && matchMonth;
    }).sort((a, b) => new Date(a.departureDate) - new Date(b.departureDate));
  }, [openDepartures, publishedTrips, search, regionFilter, monthFilter]);

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Public Header */}
      <header style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, background: 'var(--color-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div style={{ font: '600 18px/1 var(--font-family)', letterSpacing: '-0.5px' }}>Kapuli Travel</div>
          </div>
          <nav style={{ display: 'flex', gap: 24 }}>
            <Link to="/public/calendar" style={{ font: '500 14px/1 var(--font-family)', color: 'var(--color-primary)', textDecoration: 'none' }}>Destinations</Link>
            <a href="#" style={{ font: '500 14px/1 var(--font-family)', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>About Us</a>
            <a href="#" style={{ font: '500 14px/1 var(--font-family)', color: 'var(--color-text-secondary)', textDecoration: 'none' }}>Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div style={{ padding: '60px 24px', textAlign: 'center', background: '#fff' }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, letterSpacing: '-1px', color: 'var(--color-brown-black)', marginBottom: 16 }}>Find Your Next Adventure</h1>
        <p style={{ fontSize: 18, color: 'var(--color-text-secondary)', maxWidth: 600, margin: '0 auto 40px' }}>
          Explore our curated small-group departures. Filter by region, destination, or time of year to discover the perfect trip.
        </p>

        {/* Filter Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', maxWidth: 800, margin: '0 auto' }}>
          <div className="search-input-wrapper" style={{ flex: '1 1 250px', maxWidth: 400 }}>
            <Icons.Search style={{ width: 16, height: 16 }} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search destinations (e.g. Greece, Kyoto)..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              style={{ fontSize: 15, padding: '12px 12px 12px 40px', borderRadius: 12 }}
            />
          </div>
          <select className="form-select" style={{ width: 'auto', borderRadius: 12, padding: '12px 32px 12px 16px', fontSize: 15 }} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="All">All Regions</option>
            <option>Europe</option>
            <option>Asia-Pacific</option>
            <option>Africa</option>
            <option>Latin America</option>
            <option>Other</option>
          </select>
          <select className="form-select" style={{ width: 'auto', borderRadius: 12, padding: '12px 32px 12px 16px', fontSize: 15 }} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            <option value="All">Any Month</option>
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px 80px' }}>
        {filteredDepartures.length === 0 ? (
          <div className="empty-state" style={{ background: '#fff' }}>
            <Icons.Map className="empty-state-icon" style={{ width: 48, height: 48, opacity: 0.2 }} />
            <div className="empty-state-title">No departures found</div>
            <div className="empty-state-text">Try adjusting your filters to see more results.</div>
            <button className="btn btn-secondary" onClick={() => { setSearch(''); setRegionFilter('All'); setMonthFilter('All'); }}>Clear Filters</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 32 }}>
            {filteredDepartures.map(dep => {
              const trip = publishedTrips.find(t => t.id === dep.tripId);
              return (
                <div key={dep.id} className="card" style={{ display: 'flex', flexDirection: 'column', transition: 'transform 0.2s, box-shadow 0.2s', ':hover': { transform: 'translateY(-4px)', boxShadow: 'var(--shadow-lg)' } }}>
                  {trip.heroImage ? (
                    <div style={{ aspectRatio: '16/10', overflow: 'hidden' }}>
                      <img src={trip.heroImage} alt={trip.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ aspectRatio: '16/10', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icons.Map style={{ width: 40, height: 40, color: 'var(--color-text-placeholder)' }} />
                    </div>
                  )}
                  
                  <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span className="badge badge-neutral">{trip.region}</span>
                      <StatusBadge status={dep.status} />
                    </div>
                    
                    <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--color-brown-black)', marginBottom: 8, lineHeight: 1.3 }}>{trip.title}</h3>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 16 }}>
                      <Icons.Calendar style={{ width: 14, height: 14 }} />
                      {formatDate(dep.departureDate)} – {formatDate(dep.returnDate)}
                    </div>
                    
                    <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24, flex: 1 }} dangerouslySetInnerHTML={{ __html: trip.shortDescription }} />
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--color-divider)' }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>From</div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-primary)' }}>${dep.price?.toLocaleString()}</div>
                      </div>
                      <Link to={`/public/tours/${trip.slug}?departure=${dep.id}`} className={dep.status === 'Open for Booking' ? "btn btn-primary" : "btn btn-secondary"}>
                        {(dep.status === 'Waitlist Only' || (dep.status === 'Sold Out' && dep.waitlistEnabled)) ? 'Join Waitlist' : 'View Trip'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
