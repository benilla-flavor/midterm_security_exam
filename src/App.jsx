/**
 * MAIN APP COMPONENT
 * Security Features:
 * - React Router for client-side routing
 * - Auth context for authentication state
 * - Protected routes (convenience only: the API authorizes every request itself)
 * - XSS protection via React's auto-escaping
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Letterhead from './components/Letterhead';
import { Loading } from './components/Stationery';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientVisits from './pages/patient/PatientVisits';
import PatientBook from './pages/patient/PatientBook';
import PatientRecords from './pages/patient/PatientRecords';
import PatientProfile from './pages/patient/PatientProfile';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorRecord from './pages/doctor/DoctorRecord';
import DoctorHours from './pages/doctor/DoctorHours';
import AdminAccounts from './pages/admin/AdminAccounts';
import AdminAudit from './pages/admin/AdminAudit';

// Protected route wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="wrap page"><Loading label="Checking your session" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <NotAllowed />;
  }

  return children;
}

function NotAllowed() {
  return (
    <div className="wrap page">
      <div className="empty">
        <p className="heading">This page isn't part of your account</p>
        <p>Your role doesn't include it. <Link to="/app">Back to your start page</Link></p>
      </div>
    </div>
  );
}

function PublicOnly({ children }) {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (user.role === 'doctor') return <DoctorAppointments />;
  if (user.role === 'admin') return <AdminAccounts />;
  return <PatientVisits />;
}

const role = (roles, element) => <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>;

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <a className="skip-link" href="#content">Skip to content</a>
          <Letterhead />
          <div id="content">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
              <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

              <Route path="/app" element={<ProtectedRoute><div className="wrap"><Home /></div></ProtectedRoute>} />
              <Route path="/app/book" element={role(['patient'], <div className="wrap"><PatientBook /></div>)} />
              <Route path="/app/records" element={role(['patient'], <div className="wrap"><PatientRecords /></div>)} />
              <Route path="/app/profile" element={role(['patient'], <div className="wrap"><PatientProfile /></div>)} />
              <Route path="/app/appointments/:appointmentId/record" element={role(['doctor'], <div className="wrap"><DoctorRecord /></div>)} />
              <Route path="/app/hours" element={role(['doctor'], <div className="wrap"><DoctorHours /></div>)} />
              <Route path="/app/audit" element={role(['admin'], <div className="wrap"><AdminAudit /></div>)} />

              {/* Old route kept so existing links still work */}
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<div className="wrap page"><div className="empty"><p className="heading">No page here</p><p><Link to="/">Go to the start page</Link></p></div></div>} />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
