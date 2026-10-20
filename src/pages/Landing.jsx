/**
 * LANDING PAGE (public)
 * The first viewport is a working booking slip: real doctors and real open times
 * from the public API. Security is shown as notes pinned to the fields it protects.
 */

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Check, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BookingSlip from '../components/BookingSlip';
import { Microprint, Perforation, Stamp } from '../components/Stationery';

// Real CryptoJS AES output format, produced from the specimen text with a throwaway key.
const SPECIMEN_CIPHERTEXT =
  'U2FsdGVkX19lQTYm6dgYKjQPPhNpn9BXvoJMbGDSrOR5J19Ggsii5eEpCM7RklvwOpGpT9OHGpTJkpET1kI7xm+4mP2bCoQCcnNf67wZfvE=';

const ACCESS_ROWS = [
  { what: 'Book a visit', patient: true, doctor: false, admin: false },
  { what: 'Cancel a visit', patient: 'Own visits', doctor: 'Own patients', admin: true },
  { what: 'Confirm, complete or mark no-show', patient: false, doctor: 'Own patients', admin: true },
  { what: 'Write a medical record', patient: false, doctor: 'Own appointments', admin: false },
  { what: 'Read medical records', patient: 'Own records', doctor: 'Records they wrote', admin: true },
  { what: 'Activate or deactivate accounts', patient: false, doctor: false, admin: true },
  { what: 'Read the security audit log', patient: false, doctor: false, admin: true }
];

function Access({ value }) {
  if (value === true) return <span className="access-yes"><Check aria-hidden="true" /><span className="sr-only">Yes</span></span>;
  if (value === false) return <span className="access-no"><Minus aria-hidden="true" /><span className="sr-only">No</span></span>;
  return <span className="access-part"><Check aria-hidden="true" />{value}</span>;
}

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;

  return (
    <main>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" className="display">Book a doctor. Your records stay sealed.</h1>
          <p className="lede">
            Choose a doctor and an open time on the slip. Diagnoses are encrypted before they are stored,
            and every time a record is opened, the clinic's audit log notes who looked.
          </p>
          <div className="hero-actions">
            <Link to="/login" className="btn btn-line">Sign in</Link>
            <Link to="/register" className="text-btn">Create a patient account</Link>
          </div>
          <p className="hero-demo caption">Demo accounts for patient, doctor and admin are listed on the sign-in page.</p>
        </div>
        <div className="hero-slip">
          <BookingSlip />
        </div>
      </section>

      <section className="sealed wrap" aria-labelledby="sealed-title">
        <div className="section-head">
          <h2 id="sealed-title" className="title">What happens to a record after the visit</h2>
          <p className="lede">
            This is a specimen. The same diagnosis exists twice: once as the ciphertext the database holds,
            once as the text the doctor and patient see after the server decrypts it.
          </p>
        </div>

        <article className="specimen sheet" aria-label="Specimen medical record">
          <Microprint />
          <div className="sheet-body">
            <header className="specimen-head">
              <div>
                <p className="heading">Juan Dela Cruz</p>
                <p className="muted">Synthetic patient for illustration, not a real person</p>
              </div>
              <Stamp status="sealed" label="Specimen" />
            </header>

            <div className="specimen-rows">
              <div className="specimen-row pinned" style={{ '--pin-top': '4px' }}>
                <p className="caption">Stored in the database</p>
                <p className="cipher">{SPECIMEN_CIPHERTEXT}</p>
                <p className="pin">
                  <strong>Encrypted at rest</strong>
                  Diagnosis and treatment plan are AES-256 encrypted by the server before the insert. A copied database shows only this.
                </p>
              </div>

              <div className="specimen-row pinned" style={{ '--pin-top': '4px' }}>
                <p className="caption">Shown to the patient and their doctor</p>
                <p className="specimen-plain">Tension-type headache, likely from screen strain.</p>
                <p className="pin">
                  <strong>Checked on every request</strong>
                  The server decides who may read it: the patient, the doctor who wrote it, or an admin. Anyone else gets a 403.
                </p>
              </div>

              <div className="specimen-row pinned" style={{ '--pin-top': '4px' }}>
                <p className="caption">Written to the audit log</p>
                <p className="audit-line serial">PHI_ACCESSED · medical_record · user d222…2222 · 10:42</p>
                <p className="pin">
                  <strong>Every look is logged</strong>
                  Opening records, failed logins and denied access all land in the audit log, without passwords or tokens.
                </p>
              </div>
            </div>
          </div>
          <Perforation />
          <p className="specimen-foot caption">Record serial SC-REC-SPECIMEN · Not valid for treatment</p>
        </article>
      </section>

      <section className="access wrap" aria-labelledby="access-title">
        <div className="section-head">
          <h2 id="access-title" className="title">Who can do what</h2>
          <p className="lede">
            Each account has one role. The menu changes with it, but the rule that counts is the one the server checks on every request.
          </p>
        </div>
        <div className="sheet ledger-sheet">
          <div className="ledger-scroll">
            <table className="ledger access-ledger">
              <thead>
                <tr>
                  <th scope="col">Action</th>
                  <th scope="col">Patient</th>
                  <th scope="col">Doctor</th>
                  <th scope="col">Admin</th>
                </tr>
              </thead>
              <tbody>
                {ACCESS_ROWS.map((row) => (
                  <tr key={row.what}>
                    <th scope="row">{row.what}</th>
                    <td data-label="Patient"><Access value={row.patient} /></td>
                    <td data-label="Doctor"><Access value={row.doctor} /></td>
                    <td data-label="Admin"><Access value={row.admin} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="colophon">
        <Microprint />
        <div className="wrap colophon-row">
          <p>
            <strong>Secure Clinic</strong> is an educational project for a Web Security course. It handles personal health
            information in line with the Philippines' Data Privacy Act of 2012 and OWASP Top 10 guidance, and would need a
            full audit before use with real patients.
          </p>
          <p className="caption">React · Express · PostgreSQL</p>
        </div>
      </footer>
    </main>
  );
}
