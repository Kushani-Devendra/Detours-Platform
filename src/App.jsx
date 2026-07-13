import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Layout
import Layout from './components/layout/Layout';

// Operator Pages
import Dashboard from './pages/operator/Dashboard';
import TripsList from './pages/operator/trips/TripsList';
import TripDetail from './pages/operator/trips/TripDetail';
import TripForm from './pages/operator/trips/TripForm';
import DepartureDetail from './pages/operator/departures/DepartureDetail';
import CalendarView from './pages/operator/calendar/CalendarView';
import EmailTemplates from './pages/operator/communications/EmailTemplates';
import Settings from './pages/operator/settings/Settings';

// Guest Pages
import GuestPublicCalendar from './pages/guest/GuestPublicCalendar';
import GuestTripPage from './pages/guest/GuestTripPage';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Operator Portal Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            
            <Route path="trips" element={<TripsList />} />
            <Route path="trips/new" element={<TripForm />} />
            <Route path="trips/:tripId" element={<TripDetail />} />
            <Route path="trips/:tripId/edit" element={<TripForm />} />
            <Route path="trips/:tripId/departures/:departureId" element={<DepartureDetail />} />
            
            <Route path="calendar" element={<CalendarView />} />
            <Route path="email-templates" element={<EmailTemplates />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Guest Public Routes */}
          <Route path="/public/calendar" element={<GuestPublicCalendar />} />
          <Route path="/public/tours/:slug" element={<GuestTripPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
