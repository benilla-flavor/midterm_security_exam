/**
 * BOOKING SLIP
 * The clinic's appointment form: pick a doctor, a day, an open time and a reason.
 * The stub under the perforation mirrors the choices; booking tears it off.
 *
 * Security notes:
 * - Booking requires a patient session; the server re-checks role and slot (RBAC + 409 on clashes)
 * - Reason text is validated server-side by a Zod schema and stored via a parameterized query
 * - A signed-out visitor's draft is kept in memory only (never localStorage/sessionStorage)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck } from 'lucide-react';
import DOMPurify from 'dompurify';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Microprint, Perforation, Stamp, Notice, FieldError, Loading } from './Stationery';
import {
  apiError, doctorName, formatDate, formatFee, formatTime, openDays, serialFor
} from '../lib/format';

const REASON_MIN = 10;
const REASON_MAX = 500;

export default function BookingSlip({ initialDraft = null, onBooked, showPins = true }) {
  const { user, setPendingBooking } = useAuth();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState(null);
  const [doctorsError, setDoctorsError] = useState('');
  const [doctorId, setDoctorId] = useState(initialDraft?.doctorId || '');
  const [schedule, setSchedule] = useState(null);
  const [dayIso, setDayIso] = useState(initialDraft?.dayIso || '');
  const [time, setTime] = useState(initialDraft?.time || '');
  const [reason, setReason] = useState(initialDraft?.reason || '');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState(null);

  useEffect(() => {
    api.get('/doctors')
      .then((res) => {
        setDoctors(res.data.doctors);
        if (!doctorId && res.data.doctors.length) setDoctorId(res.data.doctors[0].doctor_id);
      })
      .catch((error) => setDoctorsError(apiError(error, 'Could not load the doctors list.')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    let cancelled = false;
    setSchedule(null);
    api.get(`/doctors/${doctorId}/schedule`)
      .then((res) => { if (!cancelled) setSchedule(res.data.schedule); })
      .catch(() => { if (!cancelled) setSchedule([]); });
    return () => { cancelled = true; };
  }, [doctorId]);

  const days = useMemo(() => (schedule ? openDays(schedule) : []), [schedule]);
  const doctor = doctors?.find((d) => d.doctor_id === doctorId);
  const day = days.find((d) => d.iso === dayIso);

  // Keep the chosen day valid for the chosen doctor.
  useEffect(() => {
    if (!schedule) return;
    if (!days.some((d) => d.iso === dayIso)) {
      setDayIso(days[0]?.iso || '');
      setTime('');
    }
  }, [days, dayIso, schedule]);

  const chooseDoctor = (id) => {
    setDoctorId(id);
    setTime('');
    setSubmitError('');
  };

  const validate = () => {
    const next = {};
    if (!doctorId) next.doctor = 'Choose a doctor.';
    if (!dayIso) next.day = 'Choose a day.';
    if (!time) next.time = 'Choose an open time.';
    const trimmed = reason.trim();
    if (trimmed.length < REASON_MIN) next.reason = `Describe the visit in at least ${REASON_MIN} characters so the doctor can prepare.`;
    if (trimmed.length > REASON_MAX) next.reason = `Keep it under ${REASON_MAX} characters.`;
    return next;
  };

  const isPatient = user?.role === 'patient';
  const signedInOtherRole = user && !isPatient;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError('');
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    if (!user) {
      // Hold the slip in memory and continue after sign-in.
      setPendingBooking({ doctorId, dayIso, time, reason });
      navigate('/login', { state: { next: '/app/book' } });
      return;
    }
    if (!isPatient) return;

    setSubmitting(true);
    try {
      const res = await api.post('/appointments', {
        doctorId,
        appointmentDate: dayIso,
        appointmentTime: time,
        reasonForVisit: DOMPurify.sanitize(reason.trim())
      });
      setPendingBooking(null);
      setBooked(res.data.appointment);
      onBooked?.(res.data.appointment);
    } catch (error) {
      if (error.response?.status === 409) {
        setSubmitError('Someone just took that time. Pick another open time on the same day.');
        setTime('');
      } else {
        setSubmitError(apiError(error, 'The visit could not be booked. Try again.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetSlip = () => {
    setBooked(null);
    setTime('');
    setReason('');
    setErrors({});
  };

  const actionLabel = !user ? 'Sign in to book' : 'Book this visit';
  const reasonLength = reason.trim().length;

  return (
    <section className={`slip sheet${booked ? ' is-issued' : ''}`} aria-labelledby="slip-title">
      <Microprint />
      <header className="slip-head">
        <h2 id="slip-title" className="slip-title">Appointment slip</h2>
        <p className="slip-serial">
          <span className="caption">Form SC-01 · No.</span>
          <span className="serial">{serialFor(booked?.appointment_id)}</span>
        </p>
      </header>

      <form className="slip-form" onSubmit={handleSubmit} noValidate>
        <fieldset className="slip-part" disabled={!!booked}>
          <legend className="legend"><span className="slip-step">1</span> Doctor</legend>
          {doctorsError && <Notice tone="error">{doctorsError}</Notice>}
          {!doctors && !doctorsError && <Loading label="Loading doctors" />}
          {doctors && (
            <div className="doctor-list" role="radiogroup" aria-label="Doctor">
              {doctors.map((d) => (
                <label key={d.doctor_id} className="choice-row">
                  <input
                    type="radio"
                    name="doctor"
                    value={d.doctor_id}
                    checked={doctorId === d.doctor_id}
                    onChange={() => chooseDoctor(d.doctor_id)}
                  />
                  <span className="tick" aria-hidden="true" />
                  <span className="doctor-name">{doctorName(d)}</span>
                  <span className="doctor-spec">{d.specialization}</span>
                  <span className="doctor-fee serial">{formatFee(d.consultation_fee)}</span>
                </label>
              ))}
            </div>
          )}
          <FieldError>{errors.doctor}</FieldError>
        </fieldset>

        <fieldset className="slip-part" disabled={!!booked || !doctorId}>
          <legend className="legend"><span className="slip-step">2</span> Day</legend>
          {doctorId && !schedule && <Loading label="Reading the doctor's hours" />}
          {schedule && days.length === 0 && (
            <p className="muted">No open days in the next two weeks. Try another doctor.</p>
          )}
          {days.length > 0 && (
            <div className="day-strip" role="radiogroup" aria-label="Day">
              {days.map((d) => (
                <label key={d.iso} className="day-chip">
                  <input
                    type="radio"
                    name="day"
                    value={d.iso}
                    checked={dayIso === d.iso}
                    onChange={() => { setDayIso(d.iso); setTime(''); }}
                  />
                  <span className="day-dow">{d.date.toLocaleDateString('en-PH', { weekday: 'short' })}</span>
                  <span className="day-num">{d.date.getDate()}</span>
                  <span className="day-mon">{d.date.toLocaleDateString('en-PH', { month: 'short' })}</span>
                </label>
              ))}
            </div>
          )}
          <FieldError>{errors.day}</FieldError>
        </fieldset>

        <fieldset className="slip-part" disabled={!!booked || !day}>
          <legend className="legend"><span className="slip-step">3</span> Time</legend>
          {day ? (
            <div className="slot-grid" role="radiogroup" aria-label="Time">
              {day.slots.map((slot) => (
                <label key={slot} className="slot-chip">
                  <input
                    type="radio"
                    name="time"
                    value={slot}
                    checked={time === slot}
                    onChange={() => setTime(slot)}
                  />
                  <span>{formatTime(slot)}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="muted">Pick a day to see open times.</p>
          )}
          <FieldError>{errors.time}</FieldError>
        </fieldset>

        <div className="slip-part pinned" style={{ '--pin-top': '30px' }}>
          <div className="field" data-invalid={errors.reason ? 'true' : undefined}>
            <label htmlFor="reason"><span className="slip-step">4</span> Reason for visit</label>
            <textarea
              id="reason"
              rows={2}
              value={reason}
              maxLength={REASON_MAX + 50}
              disabled={!!booked}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Recurring headaches for two weeks"
              aria-describedby="reason-count"
            />
            <p className="field-hint" id="reason-count">
              {reasonLength < REASON_MIN
                ? `${REASON_MIN - reasonLength} more characters needed`
                : `${reasonLength} / ${REASON_MAX}`}
            </p>
            <FieldError>{errors.reason}</FieldError>
          </div>
          {showPins && (
            <p className="pin">
              <strong>Checked on the server</strong>
              A Zod schema rejects malformed input, and the text is stored through a parameterized query, so it can never run as SQL.
            </p>
          )}
        </div>

        {submitError && <Notice tone="error">{submitError}</Notice>}
        {signedInOtherRole && (
          <Notice tone="info">
            You're signed in as a {user.role}. Only patient accounts can book visits; the server enforces this too.
          </Notice>
        )}

        {!booked && (
          <div className="slip-foot pinned" style={{ '--pin-top': '12px' }}>
            <button
              type="submit"
              className="btn"
              disabled={submitting || signedInOtherRole || !doctors}
            >
              {submitting ? 'Booking…' : actionLabel}
              <ArrowRight aria-hidden="true" />
            </button>
            {!user && (
              <p className="field-hint">
                New here? <Link to="/register">Create a patient account</Link>
              </p>
            )}
            {showPins && (
              <p className="pin">
                <strong>Session kept in memory</strong>
                Signing in issues a 15-minute access token held only in page memory, never in browser storage. Logins are rate-limited.
              </p>
            )}
          </div>
        )}
      </form>

      <Perforation />

      <div className={`slip-stub${booked ? ' is-torn' : ''}`} aria-live="polite">
        <div className="stub-row">
          <p className="caption">Patient stub · keep this</p>
          {booked ? <Stamp status="scheduled" press /> : <span className="caption muted">Not yet booked</span>}
        </div>
        <dl className="stub-grid">
          <div>
            <dt className="caption">Doctor</dt>
            <dd>{doctor ? doctorName(doctor) : '—'}</dd>
          </div>
          <div>
            <dt className="caption">Date</dt>
            <dd>{day ? formatDate(day.date) : '—'}</dd>
          </div>
          <div>
            <dt className="caption">Time</dt>
            <dd className="serial">{time ? formatTime(time) : '—'}</dd>
          </div>
          <div>
            <dt className="caption">Serial</dt>
            <dd className="serial">{serialFor(booked?.appointment_id)}</dd>
          </div>
        </dl>
        {booked && (
          <div className="stub-actions">
            <Link to="/app" className="btn btn-sm">
              <CalendarCheck aria-hidden="true" /> See my visits
            </Link>
            <button type="button" className="btn btn-line btn-sm" onClick={resetSlip}>
              Book another visit
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
