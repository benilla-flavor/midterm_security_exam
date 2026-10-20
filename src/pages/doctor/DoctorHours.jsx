/**
 * DOCTOR: CLINIC HOURS
 * The weekly hours patients can book against. Read-only: the API has no endpoint to edit them.
 */

import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Microprint, Notice, Loading } from '../../components/Stationery';
import PageHead from '../../components/PageHead';
import { apiError, formatFee, formatTime } from '../../lib/format';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorHours() {
  const [profile, setProfile] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const me = await api.get('/doctors/me/profile');
        setProfile(me.data.profile);
        const res = await api.get(`/doctors/${me.data.profile.doctor_id}/schedule`);
        setSchedule(res.data.schedule);
      } catch (err) {
        setError(apiError(err, 'Could not load your clinic hours.'));
      }
    };
    load();
  }, []);

  return (
    <div className="page">
      <PageHead
        title="Clinic hours"
        lede="The weekly hours patients can book you for, in 30-minute slots. These can't be changed from this app yet."
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!error && !schedule && <Loading label="Loading clinic hours" />}

      {profile && schedule && (
        <div className="hours-layout">
          <section className="sheet" aria-label="Weekly hours">
            <Microprint />
            <ol className="week">
              {DAYS.map((name, index) => {
                const blocks = schedule.filter((s) => s.day_of_week === index);
                return (
                  <li key={name} className={blocks.length ? 'week-day is-open' : 'week-day'}>
                    <span className="week-name">{name}</span>
                    <span className="week-hours serial">
                      {blocks.length
                        ? blocks.map((b) => `${formatTime(b.start_time)} – ${formatTime(b.end_time)}`).join(', ')
                        : 'Closed'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
          <aside className="side-note">
            <p className="heading">Dr. {profile.first_name} {profile.last_name}</p>
            <dl className="fixed-fields fixed-fields--stack">
              <div><dt className="caption">Specialization</dt><dd>{profile.specialization}</dd></div>
              <div><dt className="caption">License</dt><dd className="serial">{profile.license_number}</dd></div>
              <div><dt className="caption">Consultation fee</dt><dd className="serial">{formatFee(profile.consultation_fee)}</dd></div>
              <div><dt className="caption">Email</dt><dd>{profile.email}</dd></div>
            </dl>
          </aside>
        </div>
      )}
    </div>
  );
}
