/**
 * LETTERHEAD (site header)
 * Security: navigation only reflects the signed-in role; every screen behind it is
 * still authorized by the server, never by this menu.
 */

import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Mark, Microprint } from './Stationery';

const ROLE_NAV = {
  patient: [
    { to: '/app', label: 'My visits', end: true },
    { to: '/app/book', label: 'Book a visit' },
    { to: '/app/records', label: 'Records' },
    { to: '/app/profile', label: 'Profile' }
  ],
  doctor: [
    { to: '/app', label: 'Appointments', end: true },
    { to: '/app/hours', label: 'Clinic hours' }
  ],
  admin: [
    { to: '/app', label: 'Accounts', end: true },
    { to: '/app/audit', label: 'Audit log' }
  ]
};

const ROLE_TITLE = { patient: 'Patient', doctor: 'Doctor', admin: 'Administrator' };

export default function Letterhead() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const nav = user ? ROLE_NAV[user.role] || [] : [];

  return (
    <header className="letterhead">
      <div className="wrap letterhead-row">
        <Link to={user ? '/app' : '/'} className="brand" aria-label="Secure Clinic home">
          <Mark size={38} />
          <span className="brand-text">
            <span className="brand-name">Secure Clinic</span>
            <span className="brand-sub">Outpatient appointments</span>
          </span>
        </Link>

        {user ? (
          <>
            <nav className="role-nav" aria-label={`${ROLE_TITLE[user.role]} navigation`}>
              {nav.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className="role-tab">
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="who">
              <span className="who-text">
                <span className="caption">{ROLE_TITLE[user.role]}</span>
                <span className="who-email">{user.email}</span>
              </span>
              <button type="button" className="btn btn-line btn-sm" onClick={handleLogout}>
                <LogOut aria-hidden="true" /> Sign out
              </button>
            </div>
          </>
        ) : (
          <nav className="public-nav" aria-label="Account">
            <Link to="/login" className="public-link">Sign in</Link>
            <Link to="/register" className="btn btn-line btn-sm">Create account</Link>
          </nav>
        )}
      </div>
      <Microprint />
    </header>
  );
}
