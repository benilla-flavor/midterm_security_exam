/**
 * DOCTOR: WRITE A MEDICAL RECORD
 * One record per appointment. Diagnosis and treatment plan are encrypted by the
 * server (AES-256) before they are stored; the server also checks the appointment
 * belongs to this doctor.
 */

import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock } from 'lucide-react';
import DOMPurify from 'dompurify';
import api from '../../services/api';
import { Microprint, Notice, Loading, FieldError, Stamp } from '../../components/Stationery';
import PageHead from '../../components/PageHead';
import { RecordSheet } from '../patient/PatientRecords';
import { apiError, formatDate, formatTime, serialFor, toISODate } from '../../lib/format';

export default function DoctorRecord() {
  const { appointmentId } = useParams();
  const [appt, setAppt] = useState(null);
  const [records, setRecords] = useState(null);
  const [form, setForm] = useState({ diagnosis: '', treatmentPlan: '', prescription: '', followUpRequired: false, followUpDate: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/appointments');
        const found = res.data.appointments.find((a) => a.appointment_id === appointmentId);
        if (!found) {
          setError('This appointment is not in your book.');
          return;
        }
        setAppt(found);
        // Earlier records this doctor wrote for the patient (a logged PHI access).
        const recs = await api.get(`/medical-records/patient/${found.patient_id}`);
        setRecords(recs.data.records);
      } catch (err) {
        setError(apiError(err, 'Could not load this appointment.'));
      }
    };
    load();
  }, [appointmentId]);

  const existing = records?.find((r) => r.appointment_id === appointmentId);
  const earlier = records?.filter((r) => r.appointment_id !== appointmentId) || [];

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (form.diagnosis.trim().length < 5) next.diagnosis = 'Write at least 5 characters.';
    if (form.diagnosis.length > 2000) next.diagnosis = 'Keep the diagnosis under 2,000 characters.';
    if (form.treatmentPlan.length > 2000) next.treatmentPlan = 'Keep the plan under 2,000 characters.';
    if (form.prescription.length > 1000) next.prescription = 'Keep the prescription under 1,000 characters.';
    if (form.followUpRequired && !form.followUpDate) next.followUpDate = 'Choose a follow-up date.';
    setErrors(next);
    if (Object.keys(next).length) return;

    const clean = (v) => DOMPurify.sanitize(v.trim());
    const payload = { appointmentId, diagnosis: clean(form.diagnosis), followUpRequired: form.followUpRequired };
    if (form.treatmentPlan.trim()) payload.treatmentPlan = clean(form.treatmentPlan);
    if (form.prescription.trim()) payload.prescription = clean(form.prescription);
    if (form.followUpRequired) payload.followUpDate = form.followUpDate;

    setSaving(true);
    setError('');
    try {
      const res = await api.post('/medical-records', payload);
      setSaved(res.data.record);
    } catch (err) {
      setError(apiError(err, 'The record could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  const patientName = appt ? `${appt.patient_first_name} ${appt.patient_last_name}` : '';

  return (
    <div className="page">
      <Link to="/app" className="back-link"><ArrowLeft aria-hidden="true" /> Appointments</Link>
      <PageHead
        title={appt ? `Record for ${patientName}` : 'Medical record'}
        lede={appt && `${formatDate(appt.appointment_date)} at ${formatTime(appt.appointment_time)} · ${serialFor(appt.appointment_id)}`}
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!error && (!appt || !records) && <Loading label="Opening the patient file" />}

      {appt && records && (
        <div className="record-layout">
          <div className="record-main">
            {(saved || existing) ? (
              <>
                {saved && <Notice tone="ok">Record saved. The diagnosis was encrypted before it was stored.</Notice>}
                <RecordSheet record={saved || existing} visit={appt} />
              </>
            ) : (
              <form className="sheet pins-inline" onSubmit={submit} noValidate>
                <Microprint />
                <div className="sheet-body stack-lg">
                  <div className="reason-quote">
                    <p className="caption">Patient's reason for visit</p>
                    <p>{appt.reason_for_visit}</p>
                  </div>

                  <div className="pinned" style={{ '--pin-top': '28px' }}>
                    <div className="field" data-invalid={errors.diagnosis ? 'true' : undefined}>
                      <label htmlFor="diagnosis">Diagnosis</label>
                      <textarea id="diagnosis" name="diagnosis" rows={3} value={form.diagnosis} onChange={onChange} />
                      <FieldError>{errors.diagnosis}</FieldError>
                    </div>
                    <p className="pin">
                      <strong>Encrypted before it's saved</strong>
                      The server encrypts this field with AES-256. The database never holds it as readable text.
                    </p>
                  </div>

                  <div className="field" data-invalid={errors.treatmentPlan ? 'true' : undefined}>
                    <label htmlFor="treatmentPlan">Treatment plan (encrypted)</label>
                    <textarea id="treatmentPlan" name="treatmentPlan" rows={3} value={form.treatmentPlan} onChange={onChange} />
                    <FieldError>{errors.treatmentPlan}</FieldError>
                  </div>

                  <div className="field" data-invalid={errors.prescription ? 'true' : undefined}>
                    <label htmlFor="prescription">Prescription</label>
                    <textarea id="prescription" name="prescription" rows={2} value={form.prescription} onChange={onChange} />
                    <FieldError>{errors.prescription}</FieldError>
                  </div>

                  <div className="follow-up">
                    <label className="check">
                      <input type="checkbox" name="followUpRequired" checked={form.followUpRequired} onChange={onChange} />
                      Ask the patient to come back
                    </label>
                    {form.followUpRequired && (
                      <div className="field" data-invalid={errors.followUpDate ? 'true' : undefined}>
                        <label htmlFor="followUpDate">Follow-up by</label>
                        <input id="followUpDate" name="followUpDate" type="date" min={toISODate(new Date())} value={form.followUpDate} onChange={onChange} />
                        <FieldError>{errors.followUpDate}</FieldError>
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn" disabled={saving}>
                    <Lock aria-hidden="true" /> {saving ? 'Encrypting and saving…' : 'Save record'}
                  </button>
                </div>
              </form>
            )}
          </div>

          <aside className="record-side">
            <h2 className="heading">Earlier records you wrote</h2>
            {earlier.length ? (
              <ul className="mini-records">
                {earlier.map((r) => (
                  <li key={r.record_id}>
                    <span className="caption">{formatDate(r.created_at)}</span>
                    <span>{r.diagnosis}</span>
                    {r.follow_up_required && <Stamp status="confirmed" label="Follow-up" />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">None. You only see records you wrote for this patient.</p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
