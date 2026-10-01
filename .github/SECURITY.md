# Security Policy

## 🛡️ Security Overview

This project was built as a Web Security midterm examination to demonstrate secure-by-design principles in handling Protected Health Information (PHI). While this is an educational project, all security controls are production-grade implementations.

## 🔒 Implemented Security Controls

### Authentication & Authorization
- ✅ JWT access tokens (15 min expiry) + refresh tokens (7 day expiry)
- ✅ bcrypt password hashing (cost factor 12)
- ✅ Token rotation on refresh
- ✅ Refresh token revocation capability
- ✅ Role-Based Access Control (RBAC): Patient, Doctor, Admin

### Data Protection
- ✅ AES-256 encryption for sensitive PII fields
- ✅ Parameterized queries (SQL injection prevention)
- ✅ Input validation using Zod schemas
- ✅ Least-privilege database user
- ✅ TLS/HTTPS enforced with HSTS

### Frontend Security
- ✅ XSS prevention (React auto-escaping + DOMPurify sanitization)
- ✅ CSRF protection (SameSite cookies + CORS policy)
- ✅ Content Security Policy (CSP) headers
- ✅ X-Frame-Options (clickjacking protection)
- ✅ No secrets in client bundle

### Backend Security
- ✅ Rate limiting on all endpoints (100 req/15min general, 5 req/15min auth)
- ✅ Security headers via Helmet.js
- ✅ Comprehensive audit logging (security events tracked)
- ✅ Secrets externalized to environment variables
- ✅ Error messages sanitized (no stack traces to client)

## 🔍 Vulnerability Analysis

A comprehensive CVE analysis of all 7 tech stack components is documented in [`docs/VULNERABILITY_ANALYSIS.md`](../docs/VULNERABILITY_ANALYSIS.md), including:

- Node.js: CVE-2022-35256 (HTTP Request Smuggling)
- jsonwebtoken: CVE-2022-23529 (Algorithm Confusion)
- bcrypt: CVE-2015-8862 (DoS via Long Passwords)
- PostgreSQL driver: SQL injection risks
- React: XSS via dangerouslySetInnerHTML
- Express: Query parameter pollution
- Helmet: CSP misconfiguration

**All vulnerabilities have documented mitigations in place.**

## 🧪 Security Testing

Security test procedures are documented in [`docs/SECURITY_TESTS.md`](../docs/SECURITY_TESTS.md) with evidence:

1. SQL Injection Attack Prevention
2. XSS Attack Prevention
3. CSRF Attack Prevention
4. Unauthorized Access Prevention (RBAC)
5. Rate Limiting Verification
6. Password Security Verification
7. Session Management Security
8. Input Validation Testing
9. Encryption Verification
10. Audit Logging Verification
11. Security Headers Verification
12. Sensitive Data Exposure Prevention
13. Authentication Bypass Prevention
14. Privilege Escalation Prevention

## 📋 Reporting Issues

**For Academic Review**: If you are reviewing this project and find security issues, please document them in your evaluation. This is a learning exercise.

**For General Issues**: If you discover a security vulnerability:
1. **Do NOT** open a public issue
2. Contact the project team directly
3. Provide detailed steps to reproduce
4. Allow reasonable time for response before public disclosure

## ⚠️ Production Use Disclaimer

This is an **educational project** demonstrating security principles. Before using in production with real patient data, additional requirements include:

- [ ] Professional security audit by certified penetration testers
- [ ] HIPAA compliance certification (US) or equivalent local regulations
- [ ] Data Privacy Act 2012 compliance audit (Philippines)
- [ ] Regular dependency updates and vulnerability scanning
- [ ] Incident response plan and security operations
- [ ] Data backup and disaster recovery procedures
- [ ] User privacy policy and terms of service
- [ ] Security awareness training for all system users

## 📚 Security Documentation

- [Complete Security Report](../docs/SECURITY_REPORT.md)
- [Architecture & Trust Boundaries](../docs/ARCHITECTURE.md)
- [Entity Relationship Diagram](../docs/ERD.md)
- [Vulnerability Analysis](../docs/VULNERABILITY_ANALYSIS.md)
- [Security Testing Procedures](../docs/SECURITY_TESTS.md)

## 🎓 Academic Context

This security implementation demonstrates understanding of:
- OWASP Top 10 vulnerabilities and mitigations
- Defense-in-depth security architecture
- Secure software development lifecycle (SSDLC)
- Threat modeling and risk assessment
- Security testing and validation
- Compliance and regulatory requirements

---

**Last Updated**: October 2026  
**Project Type**: Academic - Web Security Midterm
