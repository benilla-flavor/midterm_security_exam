/**
 * REGISTRATION PAGE
 * Security Features:
 * - Strong password requirements (mirrors the server's Zod password schema)
 * - Input validation, re-checked by the server
 * - XSS prevention via DOMPurify
 * - Empty optional fields are omitted rather than sent as blank strings
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Check, Circle, UserPlus } from 'lucide-react';
import DOMPurify from 'dompurify';
import { useAuth } from '../contexts/AuthContext';
import { Microprint, Notice, FieldError } from '../components/Stationery';

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'An uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'A lowercase letter' },
  { test: (p) => /[0-9]/.test(p), label: 'A number' },
  { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'A symbol such as ! @ # ?' }
];

const EMPTY = {
  email: '',
  password: '',
  confirmPassword: '',
  role: 'patient',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  specialization: '',
  licenseNumber: ''
};

function Register() {
  const [formData, setFormData] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const next = {};
    if (!formData.email.trim()) next.email = 'Enter an email address.';
    if (!PASSWORD_RULES.every((rule) => rule.test(formData.password))) next.password = 'The password does not meet every rule yet.';
    if (formData.password !== formData.confirmPassword) next.confirmPassword = 'The two passwords do not match.';
    if (!formData.firstName.trim()) next.firstName = 'Enter a first name.';
    if (!formData.lastName.trim()) next.lastName = 'Enter a last name.';
    if (!formData.dateOfBirth) next.dateOfBirth = 'Enter a date of birth.';
    if (formData.phone.trim() && !/^[\d\s\-+()]{10,20}$/.test(formData.phone.trim())) {
      next.phone = 'Use 10 to 20 digits, spaces, dashes, + or brackets.';
    }
    if (formData.role === 'doctor') {
      if (!formData.specialization.trim()) next.specialization = 'Enter a specialization.';
      if (!formData.licenseNumber.trim()) next.licenseNumber = 'Enter a license number.';
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);

    const clean = (value) => DOMPurify.sanitize(value.trim());
    const payload = {
      email: clean(formData.email),
      password: formData.password,
      role: formData.role,
      firstName: clean(formData.firstName),
      lastName: clean(formData.lastName),
      dateOfBirth: formData.dateOfBirth
    };
    if (formData.gender) payload.gender = formData.gender;
    if (formData.phone.trim()) payload.phone = formData.phone.trim();
    if (formData.role === 'doctor') {
      payload.specialization = clean(formData.specialization);
      payload.licenseNumber = clean(formData.licenseNumber);
    }

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      navigate('/login', { state: { registered: payload.email } });
      return;
    }
    if (result.details) {
      const fieldErrors = {};
      result.details.forEach((detail) => { fieldErrors[detail.field] = detail.message; });
      setErrors(fieldErrors);
    } else {
      setErrors({ general: result.error });
    }
  };

  const field = (name, label, props = {}) => (
    <div className={`field${props.span ? ' span-2' : ''}`} data-invalid={errors[name] ? 'true' : undefined}>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        aria-invalid={errors[name] ? 'true' : undefined}
        {...props.input}
      />
      <FieldError>{errors[name]}</FieldError>
    </div>
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="auth wrap">
      <section className="auth-sheet auth-sheet--wide sheet" aria-labelledby="register-title">
        <Microprint />
        <div className="sheet-body">
          <h1 id="register-title" className="title">Create an account</h1>

          {errors.general && <Notice tone="error">{errors.general}</Notice>}

          <form onSubmit={handleSubmit} className="auth-form pins-inline" noValidate>
            <fieldset className="role-pick">
              <legend className="legend">Account type</legend>
              {[
                { value: 'patient', label: 'Patient', hint: 'Book visits and read your own records' },
                { value: 'doctor', label: 'Doctor', hint: 'Needs a specialization and license number' }
              ].map((option) => (
                <label key={option.value} className="choice-row">
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={formData.role === option.value}
                    onChange={handleChange}
                  />
                  <span className="tick" aria-hidden="true" />
                  <span className="doctor-name">{option.label}</span>
                  <span className="doctor-spec">{option.hint}</span>
                </label>
              ))}
            </fieldset>

            <div className="form-grid">
              {field('firstName', 'First name', { input: { autoComplete: 'given-name' } })}
              {field('lastName', 'Last name', { input: { autoComplete: 'family-name' } })}
              {field('dateOfBirth', 'Date of birth', { input: { type: 'date', max: today, autoComplete: 'bday' } })}
              <div className="field">
                <label htmlFor="gender">Gender (optional)</label>
                <select id="gender" name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Not stated</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              {field('phone', 'Phone (optional)', { input: { type: 'tel', autoComplete: 'tel', placeholder: '+63 917 123 4567' } })}
              {field('email', 'Email', { input: { type: 'email', autoComplete: 'email' } })}

              {formData.role === 'doctor' && (
                <>
                  {field('specialization', 'Specialization', { input: { placeholder: 'e.g. Pediatrics' } })}
                  {field('licenseNumber', 'PRC license number', { input: { placeholder: 'e.g. LIC-PD-22871' } })}
                </>
              )}

              {field('password', 'Password', { input: { type: 'password', autoComplete: 'new-password', 'aria-describedby': 'password-rules' } })}
              {field('confirmPassword', 'Repeat password', { input: { type: 'password', autoComplete: 'new-password' } })}
            </div>

            <ul className="rules" id="password-rules" aria-label="Password rules">
              {PASSWORD_RULES.map((rule) => {
                const met = rule.test(formData.password);
                return (
                  <li key={rule.label} className={met ? 'is-met' : undefined}>
                    {met ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
                    {rule.label}
                    <span className="sr-only">{met ? ' (met)' : ' (not met)'}</span>
                  </li>
                );
              })}
            </ul>

            <div className="pinned" style={{ '--pin-top': '8px' }}>
              <button type="submit" className="btn" disabled={loading}>
                <UserPlus aria-hidden="true" />
                {loading ? 'Creating account…' : 'Create account'}
              </button>
              <p className="pin">
                <strong>Never stored as typed</strong>
                The server hashes the password with bcrypt (cost 12) and keeps only the hash.
              </p>
            </div>
          </form>

          <p className="auth-alt">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;
