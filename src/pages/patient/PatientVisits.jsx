/**
 * PATIENT: MY VISITS
 * Lists the patient's own appointments as slip stubs. Patients may only cancel;
 * the server rejects any other status change from a patient.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import { Stamp, Notice, Loading, Empty } from '../../components/Stationery';
import PageHead from '../../components/PageHead';
import { apiError, formatDate, formatTime, isUpcoming, serialFor } from '../../lib/format';

function VisitStub({ visit, onCancel }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const cancellable = ['scheduled', 'confirmed'].includes(visit.status) && isUpcoming(visit);

  const cancel = async () => {
    setBusy(true);
    await onCancel(visit);
    setBusy(false);
    setConfirming(false);
  };

  return (
    <li className="stub sheet">
      <div className="stub-main">
        <div className="stub-when">
          <span className="stub-day">{formatDate(visit.appointment_date, { day: 'numeric' })}</span>
          <span className="caption">{formatDate(visit.appointment_date, { month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="stub-what">
          <p className="heading">Dr. {visit.doctor_first_name} {visit.doctor_last_name}</p>
          <p className="muted">
            {visit.specialization} · {formatDate(visit.appointment_date, { weekday: 'long' })}, <span className="serial">{formatTime(visit.appointment_time)}</span>
          </p>
          <p className="stub-reason">{visit.reason_for_visit}</p>
        </div>
        <div className="stub-side">
          <Stamp status={visit.status} />
          <span className="caption serial">{serialFor(visit.appointment_id)}</span>
        </div>
      </div>
      {cancellable && (
        <div className="stub-tools">
          {confirming ? (
            <>
              <span>Cancel this visit? The time goes back on the schedule.</span>
              <button type="button" className="btn btn-stamp btn-sm" onClick={cancel} disabled={busy}>
                {busy ? 'Cancelling…' : 'Yes, cancel it'}
              </button>
              <button type="button" className="text-btn" onClick={() => setConfirming(false)}>Keep visit</button>
            </>
          ) : (
            <button type="button" className="text-btn" onClick={() => setConfirming(true)}>Cancel visit</button>
          )}
        </div>
      )}
    </li>
  );
}

export default function PatientVisits() {
  const [visits, setVisits] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    api.get('/appointments')
      .then((res) => setVisits(res.data.appointments))
      .catch((err) => setError(apiError(err, 'Could not load your visits.')));
  };

  useEffect(load, []);

  const cancelVisit = async (visit) => {
    setNotice('');
    setError('');
    try {
      await api.patch(`/appointments/${visit.appointment_id}/status`, { status: 'cancelled' });
      setNotice(`Visit ${serialFor(visit.appointment_id)} was cancelled.`);
      load();
    } catch (err) {
      setError(apiError(err, 'The visit could not be cancelled.'));
    }
  };

  const upcoming = visits?.filter((v) => isUpcoming(v) && !['cancelled', 'no_show', 'completed'].includes(v.status))
    .sort((a, b) => `${a.appointment_date}${a.appointment_time}`.localeCompare(`${b.appointment_date}${b.appointment_time}`));
  const history = visits?.filter((v) => !upcoming.includes(v));

  return (
    <div className="page">
      <PageHead
        title="My visits"
        lede="Every visit you've booked, with its stamp. You can cancel a visit until it starts."
        actions={<Link to="/app/book" className="btn"><Plus aria-hidden="true" /> Book a visit</Link>}
      />
      {notice && <Notice tone="ok">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {!visits && !error && <Loading label="Loading your visits" />}

      {visits && (
        <>
          <section aria-labelledby="upcoming-title" className="page-section">
            <h2 id="upcoming-title" className="heading">Coming up</h2>
            {upcoming.length ? (
              <ul className="stub-list">
                {upcoming.map((v) => <VisitStub key={v.appointment_id} visit={v} onCancel={cancelVisit} />)}
              </ul>
            ) : (
              <Empty
                title="No upcoming visits"
                action={<Link to="/app/book" className="btn btn-line btn-sm">Book a visit</Link>}
              >
                Booked visits appear here with their serial number.
              </Empty>
            )}
          </section>

          {history.length > 0 && (
            <section aria-labelledby="history-title" className="page-section">
              <h2 id="history-title" className="heading">Earlier and cancelled</h2>
              <ul className="stub-list">
                {history.map((v) => <VisitStub key={v.appointment_id} visit={v} onCancel={cancelVisit} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
