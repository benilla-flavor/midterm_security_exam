/**
 * STATIONERY PRIMITIVES
 * The small printed parts every sheet is made of: the clinic seal, microprint rules,
 * perforations, rubber stamps and notices.
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { STATUS_LABEL } from '../lib/format';

/** Clinic seal: engraved double ring around a cross built from fine rules. */
export function Mark({ size = 40 }) {
  const rays = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="22.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="19.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
      {rays.map((deg) => (
        <line
          key={deg}
          x1="24" y1="5.5" x2="24" y2="8"
          stroke="currentColor" strokeWidth="0.7"
          transform={`rotate(${deg} 24 24)`}
        />
      ))}
      <path d="M20.5 13h7v7.5H35v7h-7.5V35h-7v-7.5H13v-7h7.5z" fill="currentColor" />
      <path d="M22.3 15v7.3H15M25.7 15v7.3H33M22.3 33v-7.3H15M25.7 33v-7.3H33" fill="none" stroke="var(--sheet)" strokeWidth="0.6" />
    </svg>
  );
}

const MICRO_TEXT = 'SECURE CLINIC · PROTECTED HEALTH INFORMATION · '.repeat(24);

/** Microprinted border rule. Decorative, hidden from assistive tech. */
export function Microprint({ className = '' }) {
  return (
    <span className={`microprint ${className}`} aria-hidden="true">
      {MICRO_TEXT}
    </span>
  );
}

export function Perforation({ className = '' }) {
  return <div className={`perf ${className}`} aria-hidden="true" />;
}

/** Rubber-stamp status. Each status has its own stamp form, not just its own colour. */
export function Stamp({ status, label, press = false }) {
  const text = label || STATUS_LABEL[status] || status;
  return (
    <span className={`stamp stamp--${status}${press ? ' stamp--press' : ''}`}>
      {text}
    </span>
  );
}

const NOTICE_ICONS = { error: AlertTriangle, ok: CheckCircle2, info: Info };

export function Notice({ tone = 'info', children, role }) {
  const Icon = NOTICE_ICONS[tone];
  return (
    <div className={`notice notice--${tone}`} role={role || (tone === 'error' ? 'alert' : 'status')}>
      <Icon aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function FieldError({ children, id }) {
  if (!children) return null;
  return (
    <p className="field-error" id={id}>
      <AlertTriangle aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function Loading({ label = 'Loading' }) {
  return (
    <div role="status" aria-live="polite">
      <div className="loading-line" />
      <p className="caption" style={{ marginTop: 8 }}>{label}…</p>
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <p className="heading">{title}</p>
      {children && <p>{children}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
