/**
 * PATIENT: MEDICAL RECORDS
 * Records stay sealed until the patient explicitly opens them. Opening them is a
 * PHI access, so the server decrypts the diagnosis and writes an audit-log entry.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import api from '../../services/api';
import { Microprint, Notice, Loading, Empty, Stamp } from '../../components/Stationery';
import PageHead from '../../components/PageHead';
import { apiError, doctorName, formatDate, formatDateTime } from '../../lib/format';

export function RecordSheet({ record, doctor, visit }) {
  return (
    <article className="rx sheet">
      <Microprint />
      <div className="sheet-body">
        <header className="rx-head">
          <div>
            <p className="heading">{doctor ? doctorName(doctor) : 'Attending doctor'}</p>
            <p className="muted">
              {visit ? `Visit on ${formatDate(visit.appointment_date)}` : 'Visit record'} · written {formatDateTime(record.created_at)}
            </p>
          </div>
          {record.follow_up_required ? <Stamp status="confirmed" label="Follow-up" /> : <Stamp status="completed" label="Closed" />}
        </header>
        <dl className="rx-body">
          <div>
            <dt className="caption">Diagnosis</dt>
            <dd>{record.diagnosis}</dd>
          </div>
          {record.treatmentPlan && (
            <div>
              <dt className="caption">Treatment plan</dt>
              <dd>{record.treatmentPlan}</dd>
            </div>
          )}
          {record.prescription && (
            <div className="rx-script">
              <dt className="caption">Prescription</dt>
              <dd>{record.prescription}</dd>
            </div>
          )}
          {record.follow_up_required && (
            <div>
              <dt className="caption">Follow-up</dt>
              <dd>{record.follow_up_date ? `By ${formatDate(record.follow_up_date)}` : 'Requested, date to be set'}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}

export default function PatientRecords() {
  const [patientId, setPatientId] = useState(null);
  const [records, setRecords] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [visits, setVisits] = useState([]);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/patients/profile')
      .then((res) => setPatientId(res.data.profile.patient_id))
      .catch((err) => setError(apiError(err, 'Could not find your patient file.')));
  }, []);

  const openRecords = async () => {
    setOpening(true);
    setError('');
    try {
      const [recordsRes, doctorsRes, visitsRes] = await Promise.all([
        api.get(`/medical-records/patient/${patientId}`),
        api.get('/doctors'),
        api.get('/appointments')
      ]);
      setRecords(recordsRes.data.records);
      setDoctors(doctorsRes.data.doctors);
      setVisits(visitsRes.data.appointments);
    } catch (err) {
      setError(apiError(err, 'Your records could not be opened.'));
    } finally {
      setOpening(false);
    }
  };

  return (
    <div className="page">
      <PageHead
        title="Medical records"
        lede="Written by your doctors after each visit. They stay sealed until you open them."
        actions={records && (
          <button type="button" className="btn btn-line" onClick={() => setRecords(null)}>
            <LockKeyhole aria-hidden="true" /> Seal again
          </button>
        )}
      />
      {error && <Notice tone="error">{error}</Notice>}

      {!records && (
        <section className="sealed-envelope sheet" aria-labelledby="sealed-heading">
          <Microprint />
          <div className="sheet-body envelope-body">
            <LockKeyhole className="envelope-icon" aria-hidden="true" />
            <h2 id="sealed-heading" className="heading">Your records are sealed</h2>
            <p className="muted">
              Opening them asks the server to decrypt your diagnoses. The visit is noted in the clinic's audit log
              as an access to your health information.
            </p>
            <button
              type="button"
              className="btn"
              onClick={openRecords}
              disabled={!patientId || opening}
            >
              <LockKeyholeOpen aria-hidden="true" />
              {opening ? 'Opening…' : 'Open my records'}
            </button>
          </div>
        </section>
      )}

      {opening && <Loading label="Decrypting records" />}

      {records && (
        records.length ? (
          <div className="rx-list">
            <Notice tone="info">This access was written to the audit log.</Notice>
            {records.map((record) => (
              <RecordSheet
                key={record.record_id}
                record={record}
                doctor={doctors.find((d) => d.doctor_id === record.doctor_id)}
                visit={visits.find((v) => v.appointment_id === record.appointment_id)}
              />
            ))}
          </div>
        ) : (
          <Empty title="No records yet" action={<Link to="/app/book" className="btn btn-line btn-sm">Book a visit</Link>}>
            A record appears here after a doctor completes your visit and writes it up.
          </Empty>
        )
      )}
    </div>
  );
}
