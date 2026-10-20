# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary audience (confirmed):** the course instructor and classmates evaluating this Web Security midterm during a live demo. They need it to behave like a real clinic site and to see the security work.
- **In-product roles:** patients (register, book and cancel visits, read their own medical records), doctors (see their appointments, mark them confirmed/completed/no-show, write encrypted medical records), and admins (manage user accounts, read the security audit log).

## Product Purpose

Secure Clinic is a clinic appointment system that handles Protected Health Information. It exists to demonstrate secure-by-design web development: a working booking product with defense-in-depth controls across the frontend, API, and database. Success means a demo where every role's workflow works end to end and the protections are visible and explainable.

## Positioning

Booking a doctor, safely. The trust claim is backed by controls that are actually implemented in this codebase, not asserted: encrypted diagnoses, short-lived access tokens kept in memory, server-side role checks, rate limiting, and an audit trail of every PHI access.

## Operating Context

- Presented live as an 8-10 minute course demo, switching between the seeded patient, doctor, and admin accounts.
- Philippine context: fees in pesos (PHP), phone numbers in +63 format, Data Privacy Act of 2012 named as the compliance reference.

## Capabilities and Constraints

- Stack is fixed: React 18 + Vite frontend, Express API, PostgreSQL 15. The frontend talks only to the existing `/api` endpoints.
- API covers: auth (register, login, refresh, logout, logout-all, me), doctors (list, detail, weekly schedule), appointments (book, list own, update status), medical records (create by doctor, list by patient), patient profile (read/update), admin (users, toggle active, audit log).
- Not available in the API (do not imply in UI): doctor schedule editing, doctor profile editing, rescheduling, payment, prescriptions management, insurance, file uploads.
- Security constraints the UI must keep: access token in memory only (never localStorage), refresh token in an httpOnly cookie, Content-Security-Policy with `'self'` only for scripts and fonts (no external fonts, scripts, or CDNs), React auto-escaping plus DOMPurify for user text, no secrets in the client bundle.
- Out of scope: payment processing, prescription management, medical imaging, insurance claims.

## Brand Commitments

- Name: **Secure Clinic** (confirmed).
- No existing logo or brand assets.

## Evidence on Hand

- Real: the security controls listed in README.md and docs/ (SECURITY_REPORT.md, SECURITY_TESTS.md, VULNERABILITY_ANALYSIS.md, ARCHITECTURE.md, ERD.md).
- Seed data: four demo doctors and one demo patient in `server/database/schema.sql`.
- Absent and must not be fabricated: patient testimonials, clinic address/hours beyond seed data, accreditation badges, real staff photos, usage statistics.

## Product Principles

1. Booking first, security as the reason to trust it.
2. Every security claim on screen maps to a control that exists in the code.
3. Each role sees only what the server authorizes; the UI never pretends to enforce access on its own.
4. PHI is shown deliberately, never casually: records appear only on explicit request.

## Accessibility & Inclusion

No product-specific standard was set; WCAG 2.2 AA is the working floor.
