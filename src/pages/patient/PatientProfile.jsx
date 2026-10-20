/**
 * PATIENT: PROFILE
 * Contact details the clinic keeps on file. Identity fields set at registration
 * (email, date of birth) are shown but not editable here.
 */

import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import DOMPurify from 'dompurify';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Notice, Loading, FieldError, Microprint } from '../../components/Stationery';
import PageHead from '../../components/PageHead';
import { apiError, formatDate } from '../../lib/format';

const EDITABLE = [
  { name: 'firstName', column: 'first_name', label: 'First name', autoComplete: 'given-name' },
  { name: 'lastName', column: 'last_name', label: 'Last name', autoComplete: 'family-name' },
  { name: 'phone', column: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel' },
  { name: 'address', column: 'address', label: 'Address', autoComplete: 'street-address', span: true },
  { name: 'emergencyContactName', column: 'emergency_contact_name', label: 'Emergency contact' },
  { name: 'emergencyContactPhone', column: 'emergency_contact_phone', label: 'Emergency contact phone', type: 'tel' }
];

const PHONE = /^[\d\s\-+()]{10,20}$/;

export default function PatientProfile() {
  const { logoutAll } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const fill = (p) => {
    setProfile(p);
    setForm(Object.fromEntries(EDITABLE.map((f) => [f.name, p[f.column] || ''])));
  };

  useEffect(() => {
    api.get('/patients/profile')
      .then((res) => fill(res.data.profile))
      .catch((err) => setError(apiError(err, 'Could not load your profile.')));
  }, []);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setNotice('');
  };

  const save = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name cannot be empty.';
    if (!form.lastName.trim()) next.lastName = 'Last name cannot be empty.';
    ['phone', 'emergencyContactPhone'].forEach((key) => {
      if (form[key].trim() && !PHONE.test(form[key].trim())) next[key] = 'Use 10 to 20 digits, spaces, dashes, + or brackets.';
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(EDITABLE.map((f) => [f.name, DOMPurify.sanitize(form[f.name].trim())]));
      const res = await api.put('/patients/profile', payload);
      fill({ ...profile, ...res.data.profile });
      setNotice('Profile saved.');
    } catch (err) {
      setError(apiError(err, 'Your profile could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <PageHead title="Profile" lede="The contact details the clinic keeps on file for you." />
      {error && <Notice tone="error">{error}</Notice>}
      {!profile && !error && <Loading label="Loading your profile" />}

      {profile && (
        <div className="profile-grid">
          <form className="sheet" onSubmit={save} noValidate>
            <Microprint />
            <div className="sheet-body">
              <dl className="fixed-fields">
                <div><dt className="caption">Email</dt><dd>{profile.email}</dd></div>
                <div><dt className="caption">Date of birth</dt><dd>{formatDate(profile.date_of_birth, { day: 'numeric', month: 'long', year: 'numeric' })}</dd></div>
              </dl>
              <div className="form-grid">
                {EDITABLE.map((f) => (
                  <div key={f.name} className={`field${f.span ? ' span-2' : ''}`} data-invalid={errors[f.name] ? 'true' : undefined}>
                    <label htmlFor={f.name}>{f.label}</label>
                    <input
                      id={f.name}
                      name={f.name}
                      type={f.type || 'text'}
                      value={form[f.name]}
                      onChange={onChange}
                      autoComplete={f.autoComplete}
                    />
                    <FieldError>{errors[f.name]}</FieldError>
                  </div>
                ))}
              </div>
              {notice && <Notice tone="ok">{notice}</Notice>}
              <button type="submit" className="btn" disabled={saving}>
                <Save aria-hidden="true" /> {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>

          <aside className="side-note">
            <h2 className="heading">Signed in somewhere else?</h2>
            <p className="muted">
              Signing out everywhere revokes every refresh token issued to your account, on every device.
            </p>
            <button type="button" className="btn btn-stamp btn-sm" onClick={logoutAll}>
              Sign out on all devices
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
