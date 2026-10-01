# 🔐 Secure Clinic Appointment System
### Web Security Midterm Project | Defense-in-Depth Architecture

> A production-ready healthcare appointment management system demonstrating secure-by-design principles with **18+ security controls** across database, backend, and frontend layers. Built to handle Protected Health Information (PHI) following OWASP best practices and comprehensive threat mitigation strategies.

[![Security](https://img.shields.io/badge/Security-OWASP_Compliant-success?style=flat-square&logo=security)](docs/SECURITY_REPORT.md)
[![Tech Stack](https://img.shields.io/badge/Stack-React_+_Express_+_PostgreSQL-blue?style=flat-square)](docs/ARCHITECTURE.md)
[![Vulnerabilities](https://img.shields.io/badge/CVE_Analysis-7_Components-orange?style=flat-square)](docs/VULNERABILITY_ANALYSIS.md)
[![Tests](https://img.shields.io/badge/Security_Tests-14_Procedures-green?style=flat-square)](docs/SECURITY_TESTS.md)
[![Documentation](https://img.shields.io/badge/Docs-Complete-brightgreen?style=flat-square)](docs/)

---

## 🎯 Project Overview

**Domain**: Healthcare Clinic/Appointment Management System  
**Security Focus**: Handling sensitive PII (Protected Health Information)

### Core Features
- ✅ Patient registration and authentication
- ✅ Appointment booking and management
- ✅ Doctor scheduling and availability
- ✅ Medical notes (doctor-only access)
- ✅ Role-based access control (Patient, Doctor, Admin)

### Out of Scope
- Payment processing
- Prescription management
- Medical imaging storage
- Insurance claims processing

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL 15
- **Authentication**: JWT (access + refresh tokens)
- **Security Headers**: Helmet.js
- **Rate Limiting**: express-rate-limit
- **Input Validation**: Zod schemas

### Hosting Infrastructure
- **Application**: Render / Railway (with managed TLS)
- **Database**: Supabase / Neon PostgreSQL (private network connection)
- **Secrets Management**: Environment variables via hosting provider's secrets manager

## 🔒 Security Controls Implementation

### Frontend Security
- ✅ XSS Prevention (React auto-escaping + DOMPurify)
- ✅ CSRF Protection (SameSite cookies + double-submit)
- ✅ Content Security Policy (CSP)
- ✅ Clickjacking Protection (X-Frame-Options)
- ✅ No secrets in client bundle

### API/Middleware Security
- ✅ Access + Refresh Token Flow (15min + 7day)
- ✅ Role-Based Access Control (RBAC) server-side
- ✅ Rate Limiting on sensitive endpoints
- ✅ Schema validation (Zod) on all inputs
- ✅ CORS allowlist (no wildcards)
- ✅ Security headers (Helmet)

### Backend/Database Security
- ✅ Parameterized queries (SQL injection prevention)
- ✅ bcrypt password hashing (cost factor 12)
- ✅ Least-privilege DB user
- ✅ TLS/HTTPS enforced + HSTS
- ✅ AES-256 encryption for sensitive PII
- ✅ Secrets externalized (never in code)
- ✅ Security event logging (no sensitive data logged)

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Installation Steps

1. **Clone and install dependencies**
```bash
cd midterm_sec
npm install
```

2. **Set up environment variables**
```bash
# Copy the example file
copy .env.example .env

# Edit .env with your actual values
# IMPORTANT: Generate secure secrets for production!
```

3. **Database setup**
```bash
# Create database
psql -U postgres
CREATE DATABASE secure_clinic;

# Run schema initialization
psql -U postgres -d secure_clinic -f server/database/schema.sql

# Create least-privilege user
psql -U postgres -d secure_clinic -f server/database/create-user.sql
```

4. **Run the application**
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Frontend will be at http://localhost:5173
# Backend API will be at http://localhost:3000
```

### Default Test Accounts
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

## 🧪 Security Testing

### Running Vulnerability Scan
```bash
npm run audit
```

### Manual Security Tests
See `/docs/SECURITY_TESTS.md` for manual testing procedures including:
- XSS attack attempts
- SQL injection attempts
- CSRF bypass attempts
- Unauthorized access attempts
- Rate limiting verification

## 📚 Documentation

All documentation is located in the `/docs` folder:

- **[ERD.md](docs/ERD.md)** - Entity Relationship Diagram + Database Justification (includes PostgreSQL selection rationale, attack vector analysis, and data dictionary)
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Infrastructure & Network Diagrams (hosting provider justification, trust boundaries, secrets management)
- **[VULNERABILITY_ANALYSIS.md](docs/VULNERABILITY_ANALYSIS.md)** - Tech Stack CVE Analysis (7 components with real CVEs, specific mitigations, dependency scan report)
- **[SECURITY_TESTS.md](docs/SECURITY_TESTS.md)** - Security Testing & Demonstrations (14 comprehensive tests with evidence, automated test scripts)
- **[SECURITY_REPORT.md](docs/SECURITY_REPORT.md)** - Complete Security Implementation Report (evidence matrix, compliance alignment, rubric mapping)
- **[DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md)** - Presentation and Defense Guide (8-10 minute demo script, Q&A preparation)

## 🎓 Academic Context

This project fulfills the requirements for the Web Security course midterm:
- Application Concept & Scope ✓
- Database Design & Justification ✓
- Hosting & Infrastructure Research ✓
- Tech Stack & Vulnerability Analysis ✓
- Security Implementation (Frontend, Middleware, Backend) ✓
- Complete Documentation with Evidence ✓
- Working Demo & Defense Preparation ✓

## 📝 Compliance Note

This system handles Protected Health Information (PHI) and implements security controls aligned with:
- Data Privacy Act of 2012 (Philippines) - personal health data protection
- General security best practices for healthcare applications
- OWASP Top 10 mitigations

**Note**: This is an educational project and would require additional security audits, penetration testing, and compliance certification before production use with real patient data.

## 👥 Team Members
[Add your team member names here]

## 📄 License
Educational project - MIT License
