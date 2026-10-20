/**
 * LOGIN PAGE
 * Security Features:
 * - Input validation
 * - Rate limiting and account lockout (server-side); lockout warnings are surfaced
 * - Generic error message from the server prevents account enumeration
 * - No password visible in dev tools
 */

import React, { useRef, useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuth } from '../contexts/AuthContext';
import { Microprint, Notice, FieldError } from '../components/Stationery';

const DEMO_ACCOUNTS = [
  { role: 'Patient', email: 'patient@clinic.com', password: 'Patient123!', note: 'Jane Doe' },
  { role: 'Doctor', email: 'doctor@clinic.com', password: 'Doctor123!', note: 'Dr. John Smith, GP' },
  { role: 'Admin', email: 'admin@clinic.com', password: 'Admin123!', note: 'Accounts and audit log' }
];

function Login() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.registered || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { user, loading: sessionLoading, login, pendingBooking } = useAuth();
  const navigate = useNavigate();
  // Set before signing in, so the already-signed-in redirect below never races
  // the post-login navigation (which may need to go to the held booking slip).
  const signingIn = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setWarning('');

    const errors = {};
    if (!email.trim()) errors.email = 'Enter your email address.';
    if (!password) errors.password = 'Enter your password.';
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    signingIn.current = true;
    // Sanitize input (XSS prevention)
    const sanitizedEmail = DOMPurify.sanitize(email.trim());
    const result = await login(sanitizedEmail, password);
    setLoading(false);

    if (result.success) {
      if (pendingBooking && result.user.role === 'patient') {
        navigate('/app/book');
      } else {
        navigate(location.state?.next && result.user.role === 'patient' ? location.state.next : '/app');
      }
      return;
    }

    signingIn.current = false;
    setError(result.error);
    if (result.warning) setWarning(result.warning);
  };

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setFieldErrors({});
    setError('');
  };

  if (!sessionLoading && user && !signingIn.current) return <Navigate to="/app" replace />;

  return (
    <main className="auth wrap">
      <section className="auth-sheet sheet" aria-labelledby="login-title">
        <Microprint />
        <div className="sheet-body">
          <h1 id="login-title" className="title">Sign in to Secure Clinic</h1>

          {location.state?.registered && (
            <Notice tone="ok">Account created. Sign in with the password you just chose.</Notice>
          )}
          {pendingBooking && (
            <Notice tone="info">Your appointment slip is held. Sign in as a patient to book it.</Notice>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="field" data-invalid={fieldErrors.email ? 'true' : undefined}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <FieldError>{fieldErrors.email}</FieldError>
            </div>

            <div className="field" data-invalid={fieldErrors.password ? 'true' : undefined}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <FieldError>{fieldErrors.password}</FieldError>
            </div>

            {error && (
              <Notice tone="error">
                {error}
                {warning && <><br /><strong>{warning}.</strong></>}
              </Notice>
            )}

            <button type="submit" className="btn btn-block" disabled={loading}>
              <LogIn aria-hidden="true" />
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-alt">
            No account yet? <Link to="/register">Create a patient account</Link>
          </p>
        </div>
      </section>

      <aside className="demo-desk" aria-labelledby="demo-title">
        <h2 id="demo-title" className="heading">Demo accounts</h2>
        <p className="muted">Seeded test users for the course demo. Choosing one fills the form; you still press Sign in.</p>
        <ul className="demo-list">
          {DEMO_ACCOUNTS.map((account) => (
            <li key={account.email} className="demo-row">
              <div>
                <p className="caption">{account.role}</p>
                <p className="demo-email">{account.email}</p>
                <p className="field-hint">{account.note}</p>
              </div>
              <button type="button" className="btn btn-line btn-sm" onClick={() => fillDemo(account)}>
                Use
              </button>
            </li>
          ))}
        </ul>
        <p className="pin pin--static">
          <strong>Lockout after 5 tries</strong>
          Five wrong passwords lock an account for 15 minutes, and sign-in is rate-limited per address.
        </p>
      </aside>
    </main>
  );
}

export default Login;
