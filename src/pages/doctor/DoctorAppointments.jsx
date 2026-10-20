/**
 * DOCTOR: APPOINTMENTS
 * The doctor's own appointment book. Status changes are checked by the server:
 * a doctor can only change appointments that belong to them.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FilePenLine } from 'lucide-react';
import api from '../../services/api';
import { Stamp, Notice, Loading, Empty } from '../../components/Stationery';
import PageHead from '../../components/PageHead';
import { apiError, formatDate, formatTime, isUpcoming, parseApiDate, serialFor, toISODate } from '../../lib/format';

const ACTIONS = {
  scheduled: [
    { status: 'confirmed', label: 'Confirm' },
    { status: 'cancelled', label: 'Cancel', tone: 'stamp' }
  ],
  confirmed: [
    { status: 'completed', label: 'Mark completed' },
    { status: 'no_show', label: 'No show', tone: 'line' },
    { status: 'cancelled', label: 'Cancel', tone: 'stamp' }
  ]
};

function AppointmentRow({ appt, onStatus, busy }) {
  const actions = ACTIONS[appt.status] || [];
  return (
    <tr>
      <td className="num">
        <span className="serial">{formatTime(appt.appointment_time)}</span>
        <span className="cell-sub">{formatDate(appt.appointment_date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </td>
      <td>
        <span className="cell-main">{appt.patient_first_name} {appt.patient_last_name}</span>
        <span className="cell-sub serial">{serialFor(appt.appointment_id)}</span>
      </td>
      <td className="cell-reason">{appt.reason_for_visit}</td>
      <td><Stamp status={appt.status} /></td>
      <td>
        <div className="row-actions">
          {actions.map((a) => (
            <button
              key={a.status}
              type="button"
              className={`btn btn-sm${a.tone === 'stamp' ? ' btn-stamp' : a.tone === 'line' ? ' btn-line' : ''}`}
              onClick={() => onStatus(appt, a.status)}
              disabled={busy}
            >
              {a.label}
            </button>
          ))}
          {['completed', 'confirmed'].includes(appt.status) && (
            <Link to={`/app/appointments/${appt.appointment_id}/record`} className="btn btn-line btn-sm">
              <FilePenLine aria-hidden="true" /> Record
            </Link>
          )}
        </div>
      </td>
    </tr>
  );
}

function AppointmentTable({ title, rows, onStatus, busyId }) {
  return (
    <section className="page-section" aria-label={title}>
      <h2 className="heading">{title} <span className="count">{rows.length}</span></h2>
      <div className="sheet ledger-sheet">
        <div className="ledger-scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Patient</th>
                <th scope="col">Reason for visit</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((appt) => (
                <AppointmentRow key={appt.appointment_id} appt={appt} onStatus={onStatus} busy={busyId === appt.appointment_id} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function DoctorAppointments() {
  const [appts, setAppts] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => api.get('/appointments')
    .then((res) => setAppts(res.data.appointments))
    .catch((err) => setError(apiError(err, 'Could not load your appointments.')));

  useEffect(() => { load(); }, []);

  const changeStatus = async (appt, status) => {
    setBusyId(appt.appointment_id);
    setError('');
    setNotice('');
    try {
      await api.patch(`/appointments/${appt.appointment_id}/status`, { status });
      setNotice(`${appt.patient_first_name} ${appt.patient_last_name}'s visit is now ${status.replace('_', ' ')}.`);
      await load();
    } catch (err) {
      setError(apiError(err, 'The status could not be changed.'));
    } finally {
      setBusyId(null);
    }
  };

  const groups = useMemo(() => {
    if (!appts) return null;
    const todayIso = toISODate(new Date());
    const byTime = (a, b) => `${toISODate(parseApiDate(a.appointment_date))}${a.appointment_time}`
      .localeCompare(`${toISODate(parseApiDate(b.appointment_date))}${b.appointment_time}`);
    const today = appts.filter((a) => toISODate(parseApiDate(a.appointment_date)) === todayIso).sort(byTime);
    const upcoming = appts.filter((a) => !today.includes(a) && isUpcoming(a) && ['scheduled', 'confirmed'].includes(a.status)).sort(byTime);
    const earlier = appts.filter((a) => !today.includes(a) && !upcoming.includes(a));
    return { today, upcoming, earlier };
  }, [appts]);

  return (
    <div className="page">
      <PageHead
        title="Appointments"
        lede="Your appointment book. Confirm visits, mark them completed, then write the record."
      />
      {notice && <Notice tone="ok">{notice}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
      {!appts && !error && <Loading label="Loading appointments" />}

      {groups && (
        appts.length === 0 ? (
          <Empty title="No appointments yet">Visits patients book with you appear here.</Empty>
        ) : (
          <>
            {groups.today.length > 0 && <AppointmentTable title="Today" rows={groups.today} onStatus={changeStatus} busyId={busyId} />}
            {groups.upcoming.length > 0 && <AppointmentTable title="Upcoming" rows={groups.upcoming} onStatus={changeStatus} busyId={busyId} />}
            {groups.earlier.length > 0 && <AppointmentTable title="Earlier" rows={groups.earlier} onStatus={changeStatus} busyId={busyId} />}
          </>
        )
      )}
    </div>
  );
}
