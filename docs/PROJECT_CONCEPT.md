# 🏥 Secure Clinic Appointment System - Project Concept

## Web Security Midterm Project

---

## 1. Executive Summary

The **Secure Clinic Appointment System** is a web-based healthcare management platform designed to streamline appointment scheduling, patient record management, and medical consultations between patients and doctors. Built with security as a first-class design requirement, this system handles Protected Health Information (PHI) and implements enterprise-grade security controls across all layers.

**Project Type:** Web Security Midterm - "Secure by Design" Database-Driven Web Application  
**Domain:** Healthcare / Medical Clinic Management  
**Primary Focus:** Security, Data Privacy, HIPAA-Aligned Best Practices

---

## 2. Problem Statement

### The Challenge
Healthcare facilities need secure digital systems to:
- Manage patient appointments efficiently
- Store and protect sensitive medical records (PHI)
- Enable secure communication between patients and healthcare providers
- Maintain audit trails for compliance
- Prevent unauthorized access to sensitive health data

### Current Pain Points
- Paper-based systems are inefficient and error-prone
- Generic scheduling tools don't handle PHI securely
- Unauthorized access to medical records
- No audit trail for sensitive data access
- Difficulty managing doctor availability and patient appointments

### Our Solution
A purpose-built, security-first clinic management system that:
- **Protects patient privacy** through encryption, access controls, and audit logging
- **Streamlines operations** with automated scheduling and availability management
- **Ensures compliance** with data privacy regulations
- **Prevents security breaches** through defense-in-depth architecture

---

## 3. Target Users & Roles

### 👤 Patient
**Who they are:** Individuals seeking medical care and managing their health records

**What they can do:**
- ✅ Register for an account with email verification
- ✅ Book appointments with available doctors
- ✅ View their own medical history and appointment records
- ✅ Update personal information (contact details, address)
- ✅ Cancel or reschedule appointments

**What they CANNOT do:**
- ❌ View other patients' records
- ❌ Access doctor schedules beyond availability
- ❌ Modify medical diagnoses or treatment plans
- ❌ Access administrative functions

**Security considerations:**
- Patients can only access their own data (enforced server-side)
- Personal health information encrypted at rest
- All data access logged for audit trail

---

### 👨‍⚕️ Doctor
**Who they are:** Licensed medical professionals providing healthcare services

**What they can do:**
- ✅ View their scheduled appointments
- ✅ Access patient records for assigned patients
- ✅ Create and update medical notes (diagnosis, treatment plans)
- ✅ Manage their availability schedule
- ✅ Mark appointments as completed or cancelled

**What they CANNOT do:**
- ❌ View records of patients not assigned to them
- ❌ Access other doctors' schedules or appointments
- ❌ Modify user accounts or system settings
- ❌ Delete audit logs

**Security considerations:**
- Doctors only see patients with scheduled/past appointments
- Medical notes encrypted with AES-256
- All record access logged with doctor ID and timestamp

---

### 🔐 Admin
**Who they are:** System administrators managing the platform

**What they can do:**
- ✅ View all users (patients, doctors, admins)
- ✅ Activate/deactivate user accounts
- ✅ View system audit logs
- ✅ Monitor security events (failed logins, access denials)
- ✅ Manage system-wide settings

**What they CANNOT do:**
- ❌ View encrypted medical records (no decryption key access)
- ❌ Modify audit logs (append-only)
- ❌ Access patient passwords (stored as bcrypt hashes)

**Security considerations:**
- Admin actions are heavily audited
- Cannot bypass RBAC to access medical records
- Least privilege - only necessary administrative functions

---

## 4. Core Features

### 4.1 Authentication & User Management
**Status:** ✅ Implemented

- User registration with role selection (Patient/Doctor)
- Secure login with JWT access tokens (15 min) + refresh tokens (7 days)
- Password requirements: minimum 8 characters, uppercase, lowercase, number, special character
- Account lockout after 5 failed login attempts (15-minute cooldown)
- Session management with token revocation
- Logout (single session) and logout-all (all devices)

**Security features:**
- bcrypt password hashing (cost factor 12)
- Rate limiting: 5 login attempts per 15 minutes
- Audit logging of all authentication events
- No password in URL, logs, or error messages

---

### 4.2 Appointment Scheduling
**Status:** ✅ Implemented

**Patient workflow:**
1. Browse available doctors by specialization
2. View doctor availability (day/time slots)
3. Book appointment with reason for visit
4. Receive confirmation
5. View upcoming and past appointments
6. Cancel appointments (with notification)

**Doctor workflow:**
1. Set weekly availability schedule (day, start time, end time)
2. View all scheduled appointments
3. Mark appointments as confirmed/completed/no-show
4. Block specific time slots when unavailable

**Business logic:**
- Prevents double-booking (database constraint: unique doctor + date + time)
- Appointment conflicts detected before confirmation
- Automatic status updates (scheduled → confirmed → completed)
- Appointment history preserved for audit

**Security features:**
- Patients can only book/cancel their own appointments
- Doctors can only view/modify their own appointments
- All appointment changes logged to audit trail

---

### 4.3 Patient Records Management
**Status:** ✅ Implemented

**Data stored:**
- Demographics: Name, date of birth, gender, phone, address
- Emergency contact information
- Medical history (linked to appointments)
- Encrypted SSN (PII protection)

**Access control:**
- Patients: View own records only
- Doctors: View records of patients with appointments
- Admin: View demographics only (no medical details)

**Security features:**
- SSN encrypted with AES-256 before storage
- Read access logged (who accessed, when, why)
- Updates require authentication and authorization

---

### 4.4 Medical Records (Doctor Notes)
**Status:** ✅ Implemented

**Created after appointments:**
- Diagnosis (encrypted)
- Treatment plan (encrypted)
- Prescription details
- Follow-up required (yes/no)
- Follow-up date (if applicable)

**Access control:**
- **Doctors:** Create/update records only for their own appointments
- **Patients:** Read-only access to their own medical records
- **Admin:** No access (medical records are doctor/patient only)

**Security features:**
- Diagnosis and treatment plan encrypted with AES-256
- Only accessible via API with valid JWT and correct role
- Every access logged with user ID, timestamp, action
- Cannot be deleted (soft delete only)

---

### 4.5 Doctor Scheduling & Availability
**Status:** ✅ Implemented

**Schedule management:**
- Set recurring weekly schedule (e.g., Mon-Fri 9 AM - 5 PM)
- Multiple time blocks per day
- Mark specific days as unavailable
- Consultation fee settings

**Integration with appointments:**
- Patients only see available time slots
- Booked slots automatically excluded
- Schedule conflicts prevented at database level

---

### 4.6 Audit Logging & Security Monitoring
**Status:** ✅ Implemented

**Events logged:**
- All authentication events (login, logout, failed attempts)
- Access to sensitive resources (medical records, patient data)
- Data modifications (create, update, delete)
- Authorization failures (access denied)
- Security policy violations

**Log details:**
- User ID (who)
- Action type (what)
- Timestamp (when)
- IP address (where from)
- User agent (browser/device)
- Additional context (JSON field)

**Security features:**
- Passwords and tokens never logged
- Logs are append-only (cannot be modified)
- Admin can view logs but not edit/delete
- Retention policy: logs kept indefinitely for compliance

---

## 5. Features Explicitly OUT OF SCOPE

To keep the project achievable within the midterm timeframe, the following features are **intentionally excluded**:

### ❌ Payment Processing
- No billing or payment collection
- No insurance claims management
- No pricing/invoicing system
- **Rationale:** Payment systems require PCI-DSS compliance, which is beyond scope

### ❌ Prescription Management
- No e-prescriptions or pharmacy integration
- No medication inventory tracking
- **Rationale:** Requires integration with external pharmacy systems and regulatory compliance

### ❌ Medical Imaging Storage
- No X-ray, MRI, CT scan uploads
- No DICOM image handling
- **Rationale:** Large file storage and specialized image viewers require significant infrastructure

### ❌ Telemedicine / Video Calls
- No video conferencing integration
- No real-time chat
- **Rationale:** Real-time communication requires WebRTC, signaling servers, beyond project scope

### ❌ Email Notifications
- No email confirmations for appointments
- No password reset emails
- **Rationale:** Requires email service integration (SendGrid, etc.), focus is on security not UX features

### ❌ Insurance Verification
- No insurance provider integration
- No eligibility checks
- **Rationale:** Requires external APIs and business relationships

### ❌ Multi-Language Support
- English only
- **Rationale:** Internationalization is a UX feature, not security-related

### ❌ Mobile Apps
- Web-only (responsive design)
- No native iOS/Android apps
- **Rationale:** Focus on web security, mobile adds deployment complexity

### ❌ Lab Results Upload
- No file uploads for lab reports
- **Rationale:** File upload introduces additional security vectors (malware scanning, storage)

---

## 6. System Workflows

### Workflow 1: Patient Registration & First Appointment

```
1. Patient visits site → Click "Register"
2. Fill registration form:
   - Email
   - Password (validated for complexity)
   - First/Last Name
   - Date of Birth
   - Gender, Phone, Address (optional)
3. Submit → Account created (role: patient)
4. Login with credentials
5. Navigate to "Book Appointment"
6. Select doctor by specialization
7. Choose available date/time slot
8. Enter reason for visit
9. Confirm booking
10. Appointment appears in "My Appointments"
```

**Security checkpoints:**
- Password validated (Zod schema)
- Rate limiting on registration endpoint
- Email uniqueness checked
- Password hashed with bcrypt before storage
- JWT issued on login
- Appointment booking requires authentication
- Patient can only book under their own account

---

### Workflow 2: Doctor Views Appointments & Creates Medical Record

```
1. Doctor logs in
2. Dashboard shows today's appointments
3. Click on appointment → View patient details
   - Name, age, reason for visit
   - Past medical history (if any)
4. After consultation, click "Create Medical Record"
5. Fill form:
   - Diagnosis
   - Treatment plan
   - Prescription (text)
   - Follow-up required (checkbox)
   - Follow-up date (if applicable)
6. Submit → Medical record created
7. Appointment status updated to "Completed"
```

**Security checkpoints:**
- Doctor must be authenticated (JWT valid)
- Doctor can only access their own appointments
- Diagnosis/treatment encrypted before database storage
- Medical record creation logged to audit trail
- Patient receives read-only access to their medical record

---

### Workflow 3: Admin Investigates Failed Login Attempts

```
1. Admin logs in
2. Navigate to "Audit Logs"
3. Filter by action: "FAILED_LOGIN"
4. View results:
   - Timestamp
   - Attempted email
   - IP address
   - Reason (invalid password, user not found)
   - Browser/device info
5. Identify suspicious patterns:
   - Multiple failed attempts from same IP
   - Brute force attempt detected
6. Take action:
   - Block IP (external firewall)
   - Contact user if legitimate account
```

**Security checkpoints:**
- Admin role required to view audit logs
- Logs are read-only (cannot modify/delete)
- Sensitive data (passwords, tokens) never logged
- Failed login attempts trigger rate limiting

---

## 7. Data Model Overview

### 8 Database Tables

1. **users** - Authentication and account management
   - Stores: email, password_hash, role, login attempts, account lock
   
2. **patients** - Patient demographic information
   - Stores: name, DOB, gender, phone, address, encrypted SSN
   - Links to: users (one-to-one)
   
3. **doctors** - Doctor profiles
   - Stores: name, specialization, license number, consultation fee
   - Links to: users (one-to-one)
   
4. **doctor_schedules** - Doctor availability
   - Stores: day of week, start/end time, availability flag
   - Links to: doctors (many-to-one)
   
5. **appointments** - Appointment bookings
   - Stores: date, time, status, reason for visit
   - Links to: patients, doctors (many-to-one each)
   - Constraint: UNIQUE(doctor_id, date, time) - prevents double booking
   
6. **medical_records** - Doctor's notes after consultations
   - Stores: encrypted diagnosis, encrypted treatment plan, prescription
   - Links to: appointments (one-to-one), patients, doctors
   
7. **refresh_tokens** - JWT refresh token management
   - Stores: token hash, expiry, revocation status
   - Links to: users (many-to-one)
   
8. **audit_log** - Security event logging
   - Stores: user, action, timestamp, IP, user agent, details (JSON)
   - Links to: users (many-to-one, nullable)

**For detailed ERD and relationships, see:** [`docs/ERD.md`](ERD.md)

---

## 8. Technology Stack

### Frontend
- **Framework:** React 18 (with Vite)
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Sanitization:** DOMPurify (XSS prevention)

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Security Middleware:** Helmet (headers), express-rate-limit, CORS
- **Validation:** Zod (schema validation)
- **Logging:** Morgan

### Database
- **DBMS:** PostgreSQL 15
- **Driver:** node-postgres (pg)
- **Connection:** Connection pooling

### Authentication & Encryption
- **JWT:** jsonwebtoken (access + refresh tokens)
- **Password Hashing:** bcrypt (cost factor 12)
- **Encryption:** crypto-js (AES-256-CBC)

### Hosting (Recommended)
- **Application:** Render / Railway
- **Database:** Supabase / Neon PostgreSQL
- **TLS/SSL:** Managed by hosting provider

**For detailed infrastructure diagram, see:** [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)

---

## 9. Security Requirements

### Data Classification

**Critical (Highest Protection):**
- Medical records (diagnosis, treatment)
- SSN (encrypted at rest)
- Password hashes
- JWT refresh tokens

**Sensitive (High Protection):**
- Patient demographics (name, DOB, address)
- Appointment details
- Doctor license numbers
- Audit logs

**Internal (Moderate Protection):**
- Doctor schedules
- User roles
- System configuration

**Public (Low Protection):**
- Doctor names and specializations (public directory)
- Available appointment slots

### Regulatory Considerations

**Data Privacy Act of 2012 (Philippines):**
- ✅ Personal data protection measures implemented
- ✅ Consent-based data collection
- ✅ Right to access personal data (patients view own records)
- ✅ Security controls for sensitive personal information

**HIPAA Alignment (if deployed in US):**
- ✅ PHI encryption at rest and in transit
- ✅ Access controls (RBAC)
- ✅ Audit trails for PHI access
- ✅ User authentication
- ⚠️ Note: Full HIPAA compliance requires business associate agreements, which is beyond this academic project

**GDPR Principles (if deployed in EU):**
- ✅ Data minimization (only collect necessary data)
- ✅ Purpose limitation (data used only for healthcare)
- ✅ Storage limitation (retention policies can be configured)
- ✅ Integrity and confidentiality (encryption, access controls)

---

## 10. Success Criteria

### Functional Requirements ✅
- [x] Users can register and login securely
- [x] Patients can book appointments with available doctors
- [x] Doctors can view appointments and create medical records
- [x] Admin can view users and audit logs
- [x] All data persisted to database
- [x] Application is fully functional end-to-end

### Security Requirements ✅
- [x] No SQL injection vulnerabilities
- [x] No XSS vulnerabilities
- [x] No CSRF vulnerabilities
- [x] Authentication and authorization enforced server-side
- [x] Sensitive data encrypted
- [x] Security events logged
- [x] Rate limiting prevents brute force
- [x] Secrets externalized (not in code)

### Documentation Requirements ✅
- [x] Complete ERD with justification
- [x] Architecture diagram with trust boundaries
- [x] CVE analysis for all tech stack components
- [x] Security implementation report with code evidence
- [x] Security testing procedures
- [x] Demo/presentation script
- [x] Rubric compliance verification

### Demo Requirements ✅
- [x] Application runs locally
- [x] Can demonstrate 2+ live attack/defense scenarios
- [x] Can explain every security decision
- [x] 8-10 minute presentation prepared

---

## 11. Future Enhancements (Post-Midterm)

If this project were to continue beyond the academic scope:

### Phase 2 (Security Hardening)
- Multi-factor authentication (MFA/OTP)
- Web Application Firewall (WAF) rules
- Automated penetration testing in CI/CD
- Intrusion detection system (IDS)
- Data loss prevention (DLP) monitoring

### Phase 3 (Feature Expansion)
- Email notifications (appointment reminders)
- SMS alerts for urgent updates
- Telemedicine integration (video consultations)
- Lab results upload and viewing
- Prescription e-prescribing integration

### Phase 4 (Compliance & Certification)
- Full HIPAA compliance audit
- SOC 2 certification
- Penetration testing by certified ethical hackers
- GDPR compliance for international deployment
- Data residency compliance (localized hosting)

### Phase 5 (Scale & Performance)
- Horizontal scaling (load balancing)
- Database replication (read replicas)
- CDN integration for static assets
- Caching layer (Redis)
- Real-time analytics dashboard

---

## 12. Project Timeline

**Week 1-2: Planning & Design**
- [x] Define scope and requirements
- [x] Create ERD and data model
- [x] Research hosting providers
- [x] Analyze tech stack vulnerabilities

**Week 3-4: Backend Development**
- [x] Set up database schema
- [x] Implement authentication (JWT)
- [x] Build API endpoints
- [x] Implement RBAC middleware
- [x] Add security middleware (rate limiting, validation, CORS)

**Week 5-6: Frontend Development**
- [x] Set up React application
- [x] Build authentication pages (login, register)
- [x] Create role-specific dashboards
- [x] Implement XSS/CSRF protections

**Week 7: Security Testing**
- [x] Run security test procedures
- [x] Perform vulnerability scans
- [x] Test all OWASP Top 10 mitigations
- [x] Document test results

**Week 8: Documentation & Demo Prep**
- [x] Write security reports
- [x] Create architecture diagrams
- [x] Prepare presentation script
- [x] Practice live demo and Q&A

---

## 13. Team Composition

**Recommended team structure for this project:**

### Solo Developer (Acceptable)
- Handles all aspects: backend, frontend, database, security, documentation
- Must demonstrate understanding of all components in defense

### 2-Person Team (Recommended)
- **Developer 1:** Backend, database, security middleware
- **Developer 2:** Frontend, documentation, testing

### 3-4 Person Team (Ideal)
- **Backend Developer:** API, authentication, database
- **Frontend Developer:** React UI, XSS/CSRF protection
- **Security Engineer:** Security middleware, vulnerability analysis, testing
- **Documentation Lead:** Architecture diagrams, security reports, demo script

**Important:** All team members must be able to explain any security control during the defense, regardless of who implemented it.

---

## 14. Lessons Learned & Takeaways

### Security Mindset
- **Threat modeling first:** Think like an attacker before building features
- **Defense in depth:** Multiple layers better than single strong control
- **Fail secure:** When something breaks, fail closed (deny access), not open
- **Least privilege:** Give users/services only what they need, nothing more

### Development Best Practices
- **Never trust user input:** Validate everything on the server side
- **Separate authentication from authorization:** Check identity AND permissions
- **Log security events, not sensitive data:** Audit trail without exposing secrets
- **Encrypt data at rest and in transit:** Assume database can be compromised

### Academic Value
This project demonstrates:
- Real-world application of OWASP Top 10 mitigations
- Understanding of authentication vs. authorization
- Knowledge of encryption, hashing, and key management
- Ability to research and mitigate known vulnerabilities
- Documentation skills for technical stakeholders

---

## 15. References & Resources

### Standards & Guidelines
- OWASP Top 10 (2021): https://owasp.org/Top10/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework
- Data Privacy Act of 2012 (Philippines): https://www.privacy.gov.ph/

### Technology Documentation
- PostgreSQL Security: https://www.postgresql.org/docs/current/security.html
- Express.js Best Practices: https://expressjs.com/en/advanced/best-practice-security.html
- React Security: https://react.dev/learn/security

### CVE Databases
- National Vulnerability Database: https://nvd.nist.gov/
- Snyk Vulnerability DB: https://security.snyk.io/
- npm audit: https://docs.npmjs.com/cli/audit

---

## 16. Contact & Support

**Project Repository:** [Your GitHub URL here]  
**Documentation:** See `/docs` folder for detailed technical documentation  
**Demo Video:** [Link when available]  

**For questions or clarifications during grading:**  
[Your team contact information]

---

## Appendix: Quick Reference

### Test Accounts
```
Admin:
  Email: admin@clinic.com
  Password: Admin123!

Doctor:
  Email: doctor@clinic.com
  Password: Doctor123!
  
Patient:
  Email: patient@clinic.com
  Password: Patient123!
```

### API Endpoints Summary
```
Authentication:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/refresh
  POST /api/auth/logout
  GET  /api/auth/me

Appointments:
  GET    /api/appointments          (list user's appointments)
  POST   /api/appointments          (create appointment)
  PATCH  /api/appointments/:id      (update status)
  DELETE /api/appointments/:id      (cancel appointment)

Medical Records:
  GET  /api/medical-records         (list user's records)
  GET  /api/medical-records/:id     (get specific record)
  POST /api/medical-records         (create record - doctors only)

Admin:
  GET /api/admin/users              (list all users)
  GET /api/admin/audit-logs         (view audit trail)
```

### Database Connection
```bash
# Development
Host: localhost
Port: 5432
Database: secure_clinic
User: clinic_app_user
Password: [See .env file]
```

---

**Document Version:** 1.0  
**Last Updated:** October 2026  
**Status:** ✅ Complete - Ready for Submission
