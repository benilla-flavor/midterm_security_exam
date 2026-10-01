# Demo Script & Defense Preparation

## Project: Secure Clinic Appointment System
**Course:** Web Security - Midterm Project  
**Presentation Time:** 8-10 minutes

---

## Pre-Demo Checklist

### Environment Setup (30 minutes before)

```bash
# 1. Start PostgreSQL database
# Ensure PostgreSQL is running on port 5432

# 2. Initialize database
psql -U postgres
CREATE DATABASE secure_clinic;
\c secure_clinic
\i server/database/schema.sql
\i server/database/create-user.sql
\q

# 3. Configure environment variables
cp .env.example .env
# Edit .env with actual values:
# - DB connection string
# - JWT secrets (generate with: openssl rand -hex 32)
# - Encryption key (32 characters)

# 4. Install dependencies
npm install

# 5. Start application
npm run dev
# Backend: http://localhost:3000
# Frontend: http://localhost:5173

# 6. Verify health check
curl http://localhost:3000/health
# Expected: {"success":true,"status":"healthy"}

# 7. Open browser tabs
# Tab 1: Frontend (http://localhost:5173)
# Tab 2: DB client (pgAdmin, DBeaver, or psql)
# Tab 3: Browser dev tools (for showing cookies, headers)
# Tab 4: Terminal (for curl commands)
```

### Materials to Have Ready

- ✅ Architecture diagram (print or on screen)
- ✅ ERD diagram
- ✅ Browser with dev tools open
- ✅ Database client connected
- ✅ Terminal with prepared curl commands
- ✅ This demo script
- ✅ Backup slides (if technical issues)

---

## Demo Script (8-10 Minutes)

### Minute 0-1: Introduction & Overview

**Script:**
> "Good [morning/afternoon]. We built a secure clinic appointment system that handles sensitive medical data—Protected Health Information. Our approach was **security-first design**: we treated security not as a feature to add later, but as a foundational requirement from day one.
>
> The application has three user roles: Patients can book appointments and view their medical history. Doctors can manage their schedule and create medical records. Admins oversee the system.
>
> Let me show you the architecture..."

**[Show Architecture Diagram]**

> "We have three trust boundaries: Client to app server, app to database, and defense in depth at every layer. The database handles sensitive PHI, encrypted at rest. Let's dive into the security controls."

**Key Points:**
- Healthcare domain (sensitive PII/PHI)
- 3 roles with different permissions
- PostgreSQL database
- Multi-layer security

---

### Minute 1-3: Authentication & Authorization Demo

#### Part A: Successful Login

**Script:**
> "First, let's demonstrate authentication. I'll login as a patient."

**[Navigate to http://localhost:5173/login]**

**Actions:**
1. Enter credentials:
   - Email: `patient@clinic.com`
   - Password: `Patient123!`
2. Click "Login"
3. **[Open Browser Dev Tools → Application → Cookies]**

**Script:**
> "Notice we get an access token in the response, and a refresh token stored in an httpOnly cookie. The access token expires in 15 minutes—short-lived for security. The refresh token lasts 7 days for user convenience but can be revoked anytime.
>
> The refresh token cookie has three key security attributes: **httpOnly**—JavaScript cannot access it, preventing XSS attacks from stealing it. **SameSite=Strict**—prevents CSRF attacks. And **Secure** in production—only sent over HTTPS."

**[Point out cookie attributes in dev tools]**

---

#### Part B: SQL Injection Attempt (Blocked)

**Script:**
> "Now let's try to bypass authentication with a SQL injection attack."

**[Logout, return to login page]**

**Actions:**
1. Enter malicious email: `admin@clinic.com' OR '1'='1 --`
2. Enter password: `anything`
3. Click "Login"

**Script:**
> "The login fails. Why? We use parameterized queries everywhere. The malicious SQL is treated as a literal email string, not executable code. Let me show you in the database..."

**[Switch to database client]**

```sql
SELECT * FROM users WHERE email = 'admin@clinic.com'' OR ''1''=''1 --';
-- Returns 0 rows (no match)
```

**Script:**
> "The database driver automatically escapes the quotes. Even if an attacker tries injection, they can't bypass our authentication."

**[Show code in editor]**

```javascript
// server/controllers/authController.js
const userResult = await query(
  'SELECT * FROM users WHERE email = $1',  // Parameterized
  [email]  // User input safely passed as parameter
);
```

---

#### Part C: Role-Based Access Control

**Script:**
> "Let's test authorization. I'm logged in as a patient. Can I access doctor-only endpoints?"

**[Open terminal]**

```bash
# Get access token from browser (copy from Network tab)
TOKEN="<paste_access_token>"

# Attempt to access doctor endpoint
curl -X GET http://localhost:3000/api/doctors/me/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Output:**
```json
{
  "success": false,
  "error": "Insufficient permissions"
}
```

**Script:**
> "403 Forbidden—patients can't access doctor resources. This is enforced server-side, not just by hiding UI elements. Every protected route checks the user's role from the JWT token, which is verified on every request."

**[Show audit log in database]**

```sql
SELECT action, user_id, ip_address, created_at, details
FROM audit_log
WHERE action = 'ACCESS_DENIED'
ORDER BY created_at DESC
LIMIT 1;
```

**Script:**
> "The unauthorized access attempt is logged for security monitoring. In a production system, multiple failed attempts could trigger alerts."

---

### Minute 3-5: Attack Demonstrations

#### Demo 1: XSS Prevention

**Script:**
> "Let's test Cross-Site Scripting protection. I'll register a new user with a malicious script as the first name."

**[Navigate to Register page]**

**Actions:**
1. Enter registration details:
   - First Name: `<script>alert('XSS')</script>`
   - Last Name: `TestUser`
   - Email: `xsstest@test.com`
   - Password: `Test123!@#`
   - (Fill in other required fields)
2. Submit form
3. Login as that user
4. Navigate to dashboard

**Script:**
> "The script doesn't execute. React automatically escapes all output. Look at the DOM..."

**[Open Dev Tools → Elements tab, inspect name display]**

**Script:**
> "The HTML shows `&lt;script&gt;` instead of `<script>` tags. React treats it as text, not code. Even if an attacker injects malicious scripts through any input field—name, address, medical notes—it will never execute."

---

#### Demo 2: CSRF Attack (Blocked)

**Script:**
> "For Cross-Site Request Forgery, I created a malicious website that tries to logout the user."

**[Open csrf-attack.html in browser]**

```html
<!-- Show the code briefly -->
<form action="http://localhost:3000/api/auth/logout" method="POST">
  <input type="submit" value="Click to claim prize!">
</form>
```

**Actions:**
1. Ensure still logged into clinic app (check cookies)
2. Open `csrf-attack.html` from file system (different origin)
3. Click submit button

**Script:**
> "The request is blocked by CORS. Our server only accepts requests from trusted origins—the frontend domain. Additionally, our cookies use SameSite=Strict, so they won't even be sent in cross-site requests."

**[Show browser console error]**

```
Access to fetch at 'http://localhost:3000/api/auth/logout' from origin 'null' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**[Show CORS configuration in code]**

```javascript
// server/index.js
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Explicit allowlist
  credentials: true
}));
```

---

#### Demo 3: Rate Limiting (Brute Force Protection)

**Script:**
> "Finally, let's try a brute force attack—rapidly guessing passwords."

**[Open terminal]**

```bash
# Attempt 6 rapid login attempts
for i in {1..6}; do
  echo "Attempt $i"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@clinic.com\",\"password\":\"wrong$i\"}"
  echo ""
done
```

**Script:**
> "The first 5 attempts get 401 Unauthorized—wrong password. But on the 6th attempt..."

**Expected Output (6th request):**
```json
{
  "success": false,
  "error": "Too many authentication attempts, please try again in 15 minutes"
}
```

**Script:**
> "429 Too Many Requests. The attacker is rate-limited. They only get 5 attempts per 15 minutes, making brute force impractical. Even with a list of common passwords, it would take weeks to try them all."

---

### Minute 5-7: Database Security

#### Part A: Encryption at Rest

**Script:**
> "Now let's look at how we protect the most sensitive data—medical records."

**[Switch to database client]**

**Actions:**
1. Show medical_records table structure

```sql
\d medical_records

-- Show encrypted columns:
-- diagnosis_encrypted TEXT
-- treatment_plan_encrypted TEXT
```

2. Query encrypted data directly

```sql
SELECT record_id, diagnosis_encrypted, treatment_plan_encrypted
FROM medical_records
LIMIT 1;
```

**Expected Output:**
```
record_id    | abc-123-def...
diagnosis_encrypted | U2FsdGVkX1+JxT9ZK... (unreadable ciphertext)
treatment_plan_encrypted | U2FsdGVkX1+9Qp2M... (unreadable ciphertext)
```

**Script:**
> "Even if an attacker gains direct database access—through SQL injection or a compromised server—the medical diagnoses and treatment plans are encrypted with AES-256. They're unreadable without the encryption key, which is stored separately in environment variables, never in the database."

**[Show decryption in application]**

**Actions:**
1. Make API request for medical records

```bash
curl -X GET http://localhost:3000/api/medical-records/patient/<patient_id> \
  -H "Authorization: Bearer $DOCTOR_TOKEN"
```

**Expected Output (decrypted):**
```json
{
  "success": true,
  "records": [{
    "diagnosis": "Patient has hypertension and diabetes",  // Decrypted
    "treatmentPlan": "Prescribe metformin 500mg twice daily"
  }]
}
```

**Script:**
> "When an authorized doctor requests the records through the API, the application decrypts them on-the-fly. But notice—only the doctor who created the record can access it. This is enforced by the authorization logic."

---

#### Part B: Least-Privilege Database User

**Script:**
> "Our application doesn't connect to the database as the superuser. We use a restricted account."

**[Show in database client or terminal]**

```sql
-- Show current user
SELECT current_user;
-- Output: clinic_app_user (NOT postgres)

-- Attempt destructive operation
DROP TABLE users;
-- ERROR: must be owner of table users
```

**Script:**
> "The application user can't drop tables, alter schemas, or perform any administrative operations. Even if the application is fully compromised, an attacker can't destroy our database structure. They're limited to CRUD operations—Create, Read, Update, Delete—on data only."

---

#### Part C: Audit Trail

**Script:**
> "Every security-relevant event is logged for forensic analysis."

**[Query audit log]**

```sql
SELECT action, user_id, ip_address, created_at, details
FROM audit_log
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Output:**
```
action              | user_id    | ip_address | created_at          | details
--------------------|------------|------------|---------------------|-------------------
PHI_ACCESSED        | d2222...   | 127.0.0.1  | 2026-10-01 10:45:00 | {"patientId":"..."}
ACCESS_DENIED       | p3333...   | 127.0.0.1  | 2026-10-01 10:44:50 | {"role":"patient"}
LOGIN_SUCCESS       | p3333...   | 127.0.0.1  | 2026-10-01 10:44:45 | {}
FAILED_LOGIN        | NULL       | 127.0.0.1  | 2026-10-01 10:44:40 | {"reason":"invalid_password"}
```

**Script:**
> "We log successful logins, failed attempts, access denials, and especially any access to Protected Health Information. Notice failed logins are logged even without a user ID—this helps detect if someone is trying to guess email addresses.
>
> In a real incident, we could reconstruct exactly what happened: who accessed what, from which IP, and when."

---

### Minute 7-8: Additional Security Features (Quick Overview)

**Script:**
> "Let me quickly highlight a few more security controls we implemented..."

**[Show list on screen or verbally]**

**1. Security Headers (Helmet.js):**
- HSTS: Forces HTTPS for one year
- X-Frame-Options: Prevents clickjacking
- CSP: Restricts what resources can load
- X-Content-Type-Options: Prevents MIME sniffing

**[Show in terminal]**
```bash
curl -I http://localhost:3000/health
# Shows all security headers
```

**2. Input Validation (Zod):**
- Every endpoint validates input before processing
- Type checking, length limits, format validation
- Rejects malformed data with detailed error messages

**3. Password Security:**
- bcrypt hashing with cost factor 12
- Strong password requirements enforced
- Account lockout after 5 failed attempts

**4. Token Rotation:**
- Access tokens expire in 15 minutes
- Refresh tokens can be revoked (logout)
- Token families prevent reuse attacks

---

### Minute 8-9: Architecture & Technology Choices

**Script:**
> "Let me explain some key architectural decisions..."

**[Show architecture diagram again]**

**Why PostgreSQL over NoSQL?**
> "We chose PostgreSQL because healthcare data has complex relationships—patients have appointments, appointments have medical records, records belong to doctors. Relational databases excel at this. We also need ACID transactions for consistency—when booking an appointment, we must prevent double-booking. Finally, PostgreSQL's parameterized queries make it inherently more resistant to SQL injection compared to NoSQL operator injection vulnerabilities."

**Why JWT over Session Cookies?**
> "JWTs are stateless—the server doesn't need to store session state, making it easier to scale horizontally. We get the best of both worlds: short-lived access tokens in memory for API calls, and httpOnly refresh tokens in cookies for security."

**Why separate frontend and backend?**
> "This architecture creates a clear trust boundary. The frontend is untrusted—anyone can view or modify it in dev tools. All security enforcement happens server-side where the user can't tamper with it. The API validates every request regardless of what the UI does."

**Hosting Choice (Render + Supabase):**
> "We selected Render for the application and Supabase for PostgreSQL. Both provide managed TLS, automated backups, and security compliance. They have free tiers for development but can scale to enterprise plans with HIPAA compliance for production use."

---

### Minute 9-10: Q&A and Defense

**Be Prepared to Answer:**

**Q: Why not use session-based authentication instead of JWT?**
> A: "Sessions require server-side state, which complicates scaling. With JWT, we can scale horizontally without session affinity. We get stateless authentication while still maintaining security through short token lifetimes and refresh token revocation stored in the database."

**Q: Why store refresh tokens in a database if JWTs are supposed to be stateless?**
> A: "Refresh tokens need to be revocable—for logout, password reset, or security incidents. We hash them before storage so even if the database is compromised, the actual tokens can't be reconstructed. This is a deliberate trade-off: access tokens remain stateless for performance, while refresh tokens are revocable for security."

**Q: What if someone steals the encryption key?**
> A: "If the encryption key is compromised, we'd need to re-encrypt all PHI data with a new key—a serious incident. That's why the key is stored in environment variables, never in code or the database. In production, we'd use a dedicated secrets manager like AWS Secrets Manager or HashiCorp Vault with automatic rotation."

**Q: How do you prevent timing attacks on password comparison?**
> A: "bcrypt's compare function has constant-time comparison built-in to prevent timing attacks. Additionally, our rate limiting makes timing attacks impractical—an attacker only gets 5 attempts per 15 minutes."

**Q: Why not use HTTPS in development?**
> A: "We could, but it adds complexity with self-signed certificates. The security controls are still effective in development—HSTS is configured but not enforced, and cookies use SameSite protection. In production deployment, Render automatically provisions Let's Encrypt certificates and enforces HTTPS."

**Q: What's your plan for GDPR right-to-erasure?**
> A: "We use soft deletes with the `is_active` flag, which supports account deactivation. For full GDPR compliance, we'd add an anonymization process that replaces PII with pseudonymous identifiers, keeping medical records for regulatory retention requirements while removing identifying information. We'd also implement a data export API for right to portability."

**Q: How would you detect a compromised account?**
> A: "Multiple signals: unusual login locations (compare IP/geo to history), access patterns (patient suddenly accessing admin endpoints), bulk data exports, or off-hours PHI access. The audit log enables anomaly detection. In production, we'd integrate with a SIEM system for real-time alerts."

**Q: What's the biggest security risk in your current implementation?**
> A: "The free hosting tier lacks IP allowlisting—the database is accessible from any IP with credentials. In production, we'd use the paid tier to restrict database access to only the application server's IPs. Also, our CSP uses `unsafe-inline` in development; production should use nonce-based CSP for stricter script control."

---

## Closing Statement

**Script:**
> "To summarize: we built a healthcare application where security was the foundation, not an afterthought. Every component—from the React frontend to the PostgreSQL database—has multiple layers of protection. We handle sensitive medical data with encryption, strict access controls, and comprehensive audit logging.
>
> All our security controls are documented with evidence, tested with attack scenarios, and aligned with industry standards like OWASP Top 10 and data privacy regulations.
>
> Thank you. I'm ready for questions."

---

## Backup: If Technical Issues Occur

### Plan B: Use Screenshots

If the live demo fails (database connection issues, server won't start, etc.), have these ready:

1. ✅ Screenshots of successful authentication
2. ✅ Screenshot of encrypted data in database
3. ✅ Screenshot of audit log entries
4. ✅ Screenshot of security headers (curl output)
5. ✅ Architecture and ERD diagrams (PDF)

**Script for Recovery:**
> "We're experiencing a technical issue with the live environment. Let me show you pre-captured evidence of the security controls instead..."

**[Walk through screenshots with the same narrative]**

### Plan C: Code Walkthrough

If even screenshots fail, focus on code review:

1. Show authentication middleware (`/server/middleware/auth.js`)
2. Show parameterized queries (`/server/database/db.js`)
3. Show encryption utilities (`/server/utils/encryption.js`)
4. Walk through security headers configuration (`/server/index.js`)

---

## Post-Demo: Anticipated Questions

### Technical Questions

**Q: How do you handle password reset securely?**
> A: "We'd generate a cryptographically random token, store its hash in the database with expiration, send it via email, and require the user to set a new password. The reset link would be single-use and expire after 1 hour."

**Q: What about API versioning for backward compatibility?**
> A: "We'd version the API with `/api/v1/` prefix and maintain old versions for a deprecation period. Security fixes would be backported to supported versions."

**Q: How do you prevent session fixation?**
> A: "We regenerate session tokens after successful login—the JWT issued is brand new, not reused from any previous session. Additionally, our SameSite=Strict cookies prevent session tokens from being sent in cross-site contexts."

**Q: What's your disaster recovery plan?**
> A: "Supabase provides automated daily backups with 7-day retention on the free tier. For production, we'd use point-in-time recovery, replicate to a secondary region, and maintain offsite backups. Application state is stateless (JWT), so we can spin up new servers quickly."

---

### Design Questions

**Q: Why not use OAuth2/OpenID Connect?**
> A: "For a closed system where we control all user accounts, our JWT implementation is simpler and equally secure. OAuth2 is designed for delegated authorization—third-party apps accessing your data. If we wanted 'Login with Google,' we'd absolutely use OAuth2."

**Q: Why not use WebSockets for real-time features?**
> A: "We don't have real-time requirements in the current scope. If we added features like live appointment availability or doctor-patient messaging, we'd add Socket.io with JWT authentication on the WebSocket handshake."

**Q: Why not use a framework like Next.js?**
> A: "We could! Next.js would give us server-side rendering and API routes in the same framework. We chose separate frontend/backend for clear separation of concerns and to demonstrate security boundaries explicitly. Both approaches can be equally secure with proper implementation."

---

### Security Questions

**Q: How do you prevent privilege escalation?**
> A: "Multiple controls: Role is stored in the JWT but verified against the database on every request. Users can't modify their own role—the update user endpoint excludes the role field. Admins can change roles, but all such changes are logged."

**Q: What about insider threats—malicious admins?**
> A: "Admins are logged like any other user. PHI access is audited regardless of role. In a real system, we'd implement the principle of least privilege even for admins—separate roles for user management, data access, and system configuration. We'd also require multi-person approval for sensitive operations."

**Q: How do you handle vulnerabilities in dependencies?**
> A: "We run `npm audit` before each deployment and have documented our response process. For critical vulnerabilities, we'd patch immediately. For lower severity, we assess the risk—does it affect our usage of the library? We'd also set up automated dependency scanning with Dependabot or Snyk for continuous monitoring."

---

## Final Preparation Checklist

**Day Before:**
- [ ] Run full test suite (`./test-security.sh`)
- [ ] Practice demo script out loud (aim for 8 minutes)
- [ ] Verify all test accounts work (patient, doctor, admin)
- [ ] Test on backup laptop (in case primary fails)
- [ ] Print backup materials (diagrams, code snippets)

**30 Minutes Before:**
- [ ] Start database
- [ ] Start application
- [ ] Test all demo scenarios
- [ ] Open all browser tabs
- [ ] Have terminal commands ready to paste
- [ ] Close all unnecessary applications
- [ ] Turn off notifications

**During Presentation:**
- [ ] Speak clearly and at moderate pace
- [ ] Make eye contact (don't just read from screen)
- [ ] Point out specific code sections when discussing
- [ ] Acknowledge if something doesn't work (stay calm)
- [ ] Invite questions throughout (engage audience)

---

## Confidence Boosters

Remember:
- ✅ You built a real, working application
- ✅ Every security claim has evidence
- ✅ You researched actual CVEs and implemented mitigations
- ✅ Your documentation is comprehensive
- ✅ You understand the trade-offs you made
- ✅ It's okay to say "I don't know, but here's how I'd find out"

**Good luck! You've got this. 🚀**
