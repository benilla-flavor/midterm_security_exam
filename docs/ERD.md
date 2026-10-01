# Entity-Relationship Diagram (ERD) and Database Design

## Project: Secure Clinic Appointment System
**Course:** Web Security - Midterm Project

---

## Table of Contents
1. [ERD Diagram](#erd-diagram)
2. [Database Type Selection](#database-type-selection)
3. [Schema Justification](#schema-justification)
4. [Security Attack Vectors and Mitigations](#security-attack-vectors-and-mitigations)
5. [Data Dictionary](#data-dictionary)

---

## ERD Diagram

```
┌──────────────────┐
│      USERS       │
├──────────────────┤
│ PK user_id (UUID)│
│    email         │──────┐
│    password_hash │      │
│    role          │      │  (1:1)
│    is_active     │      │
│    created_at    │      ├──────────────────────┐
│    updated_at    │      │                      │
│    last_login    │      │                      │
│    failed_login  │      │                      │
│    locked_until  │      │                      │
└──────────────────┘      │                      │
                          │                      │
        ┌─────────────────┘                      │
        │                                        │
        │                                        │
        ▼                                        ▼
┌──────────────────┐                    ┌──────────────────┐
│    PATIENTS      │                    │     DOCTORS      │
├──────────────────┤                    ├──────────────────┤
│ PK patient_id    │                    │ PK doctor_id     │
│ FK user_id       │                    │ FK user_id       │
│    first_name    │                    │    first_name    │
│    last_name     │                    │    last_name     │
│    date_of_birth │                    │ specialization   │
│    gender        │                    │ license_number   │
│    phone         │                    │    phone         │
│    address       │                    │ consultation_fee │
│    ssn_encrypted │                    │    created_at    │
│ emergency_contact│                    │    updated_at    │
│    created_at    │                    └──────────────────┘
│    updated_at    │                            │
└──────────────────┘                            │ (1:N)
        │                                       │
        │ (1:N)                                 ▼
        │                            ┌──────────────────────┐
        │                            │  DOCTOR_SCHEDULES    │
        │                            ├──────────────────────┤
        │                            │ PK schedule_id       │
        │                            │ FK doctor_id         │
        │                            │    day_of_week       │
        │                            │    start_time        │
        │                            │    end_time          │
        │                            │    is_available      │
        │                            │    created_at        │
        │                            └──────────────────────┘
        │
        │
        ▼
┌──────────────────────────────────────────────────┐
│              APPOINTMENTS                         │
├──────────────────────────────────────────────────┤
│ PK appointment_id (UUID)                         │
│ FK patient_id    ───────────────────┐            │
│ FK doctor_id     ───────────────┐   │            │
│    appointment_date              │   │            │
│    appointment_time (UNIQUE with │   │            │
│                     doctor_id)   │   │            │
│    status                        │   │            │
│    reason_for_visit              │   │            │
│    notes                         │   │            │
│    created_at                    │   │            │
│    updated_at                    │   │            │
└──────────────────────────────────┘   │            │
        │                              │            │
        │ (1:1)                        │            │
        ▼                              │            │
┌──────────────────────────────────┐   │            │
│     MEDICAL_RECORDS              │   │            │
├──────────────────────────────────┤   │            │
│ PK record_id (UUID)              │   │            │
│ FK appointment_id (UNIQUE)       │   │            │
│ FK patient_id        ────────────┼───┘            │
│ FK doctor_id         ────────────┼────────────────┘
│    diagnosis_encrypted (PHI)     │
│    treatment_plan_encrypted (PHI)│
│    prescription                  │
│    follow_up_required            │
│    follow_up_date                │
│    created_at                    │
│    updated_at                    │
└──────────────────────────────────┘


┌──────────────────────────────────┐
│      REFRESH_TOKENS              │
├──────────────────────────────────┤
│ PK token_id (UUID)               │
│ FK user_id                       │
│    token_hash                    │
│    expires_at                    │
│    created_at                    │
│    revoked_at                    │
│    replaced_by_token             │
└──────────────────────────────────┘


┌──────────────────────────────────┐
│         AUDIT_LOG                │
├──────────────────────────────────┤
│ PK log_id (UUID)                 │
│ FK user_id (nullable)            │
│    action                        │
│    resource_type                 │
│    resource_id                   │
│    ip_address                    │
│    user_agent                    │
│    details (JSONB)               │
│    created_at                    │
└──────────────────────────────────┘
```

---

## Database Type Selection

### Selected Database: **PostgreSQL 15 (Relational SQL)**

### Justification Against Required Criteria:

#### 1. **Data Structure (Fixed Schema vs. Flexible/Nested Data)**

**Decision:** Fixed schema required

**Reasoning:**
- Healthcare data has well-defined, structured relationships (patients, doctors, appointments, medical records)
- Each entity has consistent attributes that rarely change
- Medical data benefits from enforced data types and constraints (e.g., dates, UUIDs, status enums)
- Foreign key constraints ensure referential integrity critical for medical records
- No need for flexible document structures in this domain

**PostgreSQL Advantage:** Strict schema enforcement with CHECK constraints, NOT NULL, and data type validation prevents data corruption

#### 2. **Relationship Complexity (Joins/Relations vs. Denormalized Documents)**

**Decision:** High relationship complexity requires normalized relational model

**Relationships in the system:**
- Users → Patients/Doctors (1:1 polymorphic)
- Doctors → Appointments (1:N)
- Patients → Appointments (1:N)
- Appointments → Medical Records (1:1)
- Doctors → Medical Records (1:N) - access control
- Users → Refresh Tokens (1:N)
- Users → Audit Log (1:N)

**Reasoning:**
- Multiple many-to-one and one-to-many relationships require efficient JOINs
- Need to query across relationships (e.g., "get all appointments for a patient with doctor details")
- Normalization prevents data duplication and update anomalies
- Foreign keys enforce data integrity (cannot delete a doctor who has appointments)

**PostgreSQL Advantage:** Excellent JOIN performance, indexing strategies, and foreign key constraints

#### 3. **Consistency Requirements (ACID Transactions)**

**Decision:** Strong consistency required - ACID compliance is critical

**Critical Consistency Needs:**
- **Appointment booking:** Must prevent double-booking (same doctor, date, time)
- **Medical records:** Cannot be partially saved or lost
- **User registration:** User account + patient/doctor profile must be created atomically
- **Token revocation:** Logout must immediately invalidate tokens
- **Financial operations:** Consultation fees (if implemented) require transactional integrity

**Example Transaction (User Registration):**
```sql
BEGIN;
  INSERT INTO users (email, password_hash, role) VALUES (...);
  INSERT INTO patients (user_id, first_name, ...) VALUES (...);
  INSERT INTO audit_log (action, user_id, ...) VALUES (...);
COMMIT;
-- If ANY step fails, ROLLBACK entire transaction
```

**Reasoning:**
- Healthcare data cannot tolerate eventual consistency
- Money/inventory-adjacent (appointment slots, doctor availability)
- Regulatory compliance requires audit trails with guaranteed consistency

**PostgreSQL Advantage:** Full ACID compliance with serializable isolation level support

#### 4. **Expected Scale (Volume of Users, Traffic, Data, Requests)**

**Project Scale Expectations:**
- **Users:** 500-5,000 (small to medium clinic)
- **Daily Appointments:** 50-500
- **Concurrent Users:** 10-100
- **Database Size:** <10GB (first year)
- **Read/Write Ratio:** 70/30 (more reads than writes)
- **Query Patterns:** Relational queries, date-range filters, user-specific data

**Reasoning:**
- PostgreSQL handles millions of rows efficiently with proper indexing
- Connection pooling (pg Pool) supports moderate concurrency
- Vertical scaling sufficient for projected load
- Read replicas can be added if read traffic increases
- Not a "web-scale" application requiring horizontal sharding

**PostgreSQL Advantage:** Proven performance at this scale, excellent query planner, mature indexing

#### 5. **Security Implications of the Model**

**Security Comparison:**

| Security Aspect | PostgreSQL (Selected) | MongoDB (NoSQL Alternative) |
|----------------|----------------------|----------------------------|
| **SQL Injection** | Risk if using string concatenation; **mitigated with parameterized queries** | Risk of NoSQL injection ($where, $ne, $gt operators); requires sanitization |
| **Least Privilege** | Granular GRANT/REVOKE on tables/columns | Role-based but less granular |
| **Encryption at Rest** | Supported (pgcrypto, TDE) | Supported |
| **Audit Logging** | Built-in with triggers | Requires application-level implementation |
| **Schema Validation** | Enforced at DB level (types, constraints) | Optional (JSON Schema), often skipped |

**Security Implementation in This Project:**
1. **Parameterized Queries Only:** All queries use `$1, $2` placeholders (see `/server/database/db.js`)
2. **Least-Privilege User:** Application connects as `clinic_app_user`, NOT postgres superuser
3. **Encrypted Sensitive Fields:** SSN, diagnosis, treatment plans encrypted at application layer (AES-256)
4. **Audit Trail:** Dedicated `audit_log` table tracks all security events
5. **Row-Level Security (Future):** PostgreSQL RLS can enforce "users only see their own data" at DB level

**PostgreSQL Advantage:** Mature security model with proven track record in healthcare systems

---

## Schema Justification

### Normalization Level: **3rd Normal Form (3NF)**

**Justification:**
- **1NF:** All attributes atomic (no multi-valued fields)
- **2NF:** No partial dependencies (all non-key attributes fully depend on primary key)
- **3NF:** No transitive dependencies (no non-key depends on another non-key)

**Example:** Patient's `first_name` depends only on `patient_id`, not on `user_id` or any other attribute.

### Key Design Decisions:

#### 1. **UUID Primary Keys**
- **Security:** Non-sequential IDs prevent enumeration attacks (can't guess IDs)
- **Distribution:** Universally unique across all tables
- **Privacy:** Patient IDs in URLs don't reveal total patient count

#### 2. **Separate Users Table (Polymorphic Pattern)**
- **Flexibility:** One authentication system for all roles
- **DRY Principle:** Email/password stored once, not duplicated
- **Security:** Password hashing logic centralized

#### 3. **Encrypted Fields for PHI**
- `ssn_encrypted`, `diagnosis_encrypted`, `treatment_plan_encrypted`
- **Compliance:** Data Privacy Act of 2012 (Philippines) requires protection of sensitive health data
- **Defense in Depth:** Even if DB is compromised, PHI remains encrypted

#### 4. **Audit Log with JSONB**
- **Flexibility:** JSONB `details` field stores context-specific data
- **Performance:** PostgreSQL's JSONB is indexed and queryable
- **Forensics:** Track all security events (logins, access denials, data modifications)

#### 5. **Soft Delete via `is_active` Flag**
- **Data Retention:** Keep records for legal/audit purposes
- **User Experience:** Accounts can be reactivated
- **Security:** Revoke access without data loss

---

## Security Attack Vectors and Mitigations

### Attack Vector 1: **SQL Injection**

#### Description:
An attacker manipulates SQL queries by injecting malicious SQL code through user inputs, potentially:
- Extracting sensitive data (patient records, passwords)
- Modifying or deleting data
- Bypassing authentication
- Executing administrative operations

#### Example Attack (Without Protection):
```javascript
// VULNERABLE CODE (NOT USED IN THIS PROJECT)
const email = req.body.email; // User input: admin@clinic.com' OR '1'='1
const query = `SELECT * FROM users WHERE email = '${email}'`;
// Resulting query: SELECT * FROM users WHERE email = 'admin@clinic.com' OR '1'='1'
// Returns ALL users, bypassing authentication
```

#### Mitigation Implemented:

**1. Parameterized Queries (Prepared Statements)**
```javascript
// SECURE CODE (see /server/database/db.js)
export const query = async (text, params) => {
  const result = await pool.query(text, params);
  return result;
};

// Usage in controller (see /server/controllers/authController.js)
const userResult = await query(
  'SELECT * FROM users WHERE email = $1',  // $1 is a placeholder
  [email]  // User input safely passed as parameter
);
```

**How it works:**
- Database driver treats parameters as DATA, not SQL code
- Special characters are automatically escaped
- Query structure is fixed at compile time

**2. Input Validation (Zod Schemas)**
```javascript
// See /server/middleware/validation-schemas.js
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long');
```
- Reject malformed inputs before reaching database
- Type checking prevents injection attempts

**3. Least-Privilege Database User**
```sql
-- See /server/database/create-user.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES TO clinic_app_user;
-- NO DROP, NO ALTER, NO CREATE (damage limitation)
```

**4. Error Handling**
```javascript
// See /server/database/db.js
catch (error) {
  console.error('Database query error:', {
    message: error.message,
    code: error.code
    // Don't log query or params (might contain sensitive data)
  });
  throw error; // Generic error to client, no SQL details exposed
}
```

**Testing Evidence:**
```bash
# Test injection attempt (will be blocked):
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@clinic.com'\'' OR '\''1'\''='\''1", "password": "test"}'

# Expected: 401 Unauthorized (parameterized query prevents injection)
```

---

### Attack Vector 2: **NoSQL Injection (Comparative Analysis)**

#### Description:
While this project uses PostgreSQL, it's important to understand NoSQL injection risks that would exist with MongoDB:

**MongoDB Injection Example:**
```javascript
// VULNERABLE MongoDB query
db.users.find({ 
  email: req.body.email,  // User input: { $ne: "" }
  password: req.body.password
});
// Returns ALL users where email is "not empty" (bypasses auth)
```

**Other NoSQL Operators Exploitable:**
- `$where` - Execute arbitrary JavaScript
- `$gt`, `$lt` - Range queries for password brute-forcing
- `$regex` - Regex DOS attacks

#### Why PostgreSQL is More Secure for This Use Case:

1. **No Operator Injection:**
   - PostgreSQL has no query operators in JSON format
   - All special characters must be in SQL syntax, which is parameterized

2. **Type Safety:**
   - PostgreSQL validates data types at schema level
   - MongoDB's flexible schema allows unexpected data types

3. **Query Structure:**
   ```javascript
   // PostgreSQL (secure)
   query('SELECT * FROM users WHERE email = $1', [userInput]);
   
   // MongoDB (requires sanitization)
   collection.find({ email: userInput });  // Must validate userInput is a string
   ```

#### Mitigation (If Using NoSQL):
- Sanitize all inputs with libraries like `mongo-sanitize`
- Use schema validation
- Disable `$where` operator in production
- Never pass user input directly to query objects

**For This Project:** PostgreSQL's parameterized queries eliminate this entire class of vulnerabilities.

---

### Attack Vector 3: **Mass Assignment / Parameter Tampering**

#### Description:
Attacker modifies request parameters to update fields they shouldn't have access to.

**Example Attack:**
```javascript
// User sends malicious payload
PUT /api/patients/profile
{
  "firstName": "John",
  "role": "admin"  // Attempting to escalate privileges
}
```

#### Mitigation Implemented:

**1. Explicit Field Selection (Whitelisting)**
```javascript
// See /server/routes/patients.js
const { firstName, lastName, phone, address, emergencyContactName, emergencyContactPhone } = req.body;
// Only these fields are extracted - 'role' is ignored

await query(
  `UPDATE patients 
   SET first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name)
   WHERE user_id = $7`,
  [firstName, lastName, phone, address, emergencyContactName, emergencyContactPhone, req.user.userId]
);
```

**2. Schema Validation (Zod)**
```javascript
// See /server/middleware/validation-schemas.js
export const updatePatientProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: phoneSchema,
  address: z.string().max(500).optional()
  // 'role' field NOT in schema - will be rejected
});
```

**3. Authorization Checks**
```javascript
// See /server/middleware/auth.js
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};
```

---

## Data Dictionary

### Users Table
| Column | Type | Constraints | Description | Security Notes |
|--------|------|-------------|-------------|----------------|
| user_id | UUID | PK, DEFAULT uuid_generate_v4() | Unique user identifier | Non-sequential to prevent enumeration |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email (login credential) | Validated with regex, indexed |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt hash of password | Never store plaintext, cost=12 |
| role | VARCHAR(20) | NOT NULL, CHECK (role IN ('patient', 'doctor', 'admin')) | User role for RBAC | Enforced at DB level |
| is_active | BOOLEAN | DEFAULT true | Account status | Soft delete flag |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp | Audit trail |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp | Auto-updated via trigger |
| last_login | TIMESTAMP | NULL | Last successful login | Security monitoring |
| failed_login_attempts | INT | DEFAULT 0 | Failed login counter | Brute-force protection |
| locked_until | TIMESTAMP | NULL | Account lock expiration | Auto-unlock after 15min |

### Patients Table
| Column | Type | Constraints | Description | Security Notes |
|--------|------|-------------|-------------|----------------|
| patient_id | UUID | PK | Unique patient identifier | |
| user_id | UUID | FK → users(user_id), UNIQUE | Link to user account | Cascade delete |
| first_name | VARCHAR(100) | NOT NULL | Patient first name | |
| last_name | VARCHAR(100) | NOT NULL | Patient last name | Indexed for search |
| date_of_birth | DATE | NOT NULL | Birth date | Age validation at app layer |
| gender | VARCHAR(20) | CHECK (gender IN (...)) | Gender | Optional, inclusive options |
| phone | VARCHAR(20) | | Phone number | Validated format |
| address | TEXT | | Mailing address | |
| ssn_encrypted | TEXT | | AES-256 encrypted SSN | **PHI - encrypted at rest** |
| emergency_contact_name | VARCHAR(200) | | Emergency contact | |
| emergency_contact_phone | VARCHAR(20) | | Emergency phone | |

### Medical_Records Table
| Column | Type | Constraints | Description | Security Notes |
|--------|------|-------------|-------------|----------------|
| record_id | UUID | PK | Unique record identifier | |
| appointment_id | UUID | FK, UNIQUE | One record per appointment | |
| patient_id | UUID | FK, NOT NULL | Patient reference | Access control |
| doctor_id | UUID | FK, NOT NULL | Creating doctor | Access control |
| diagnosis_encrypted | TEXT | NOT NULL | AES-256 encrypted diagnosis | **PHI - highest sensitivity** |
| treatment_plan_encrypted | TEXT | | AES-256 encrypted treatment | **PHI - highest sensitivity** |
| prescription | TEXT | | Prescription details | Could be encrypted in production |
| follow_up_required | BOOLEAN | DEFAULT false | Follow-up flag | |
| follow_up_date | DATE | | Next appointment date | |

### Audit_Log Table
| Column | Type | Constraints | Description | Security Notes |
|--------|------|-------------|-------------|----------------|
| log_id | UUID | PK | Unique log entry | |
| user_id | UUID | FK, NULLABLE | User who performed action | NULL for anonymous |
| action | VARCHAR(100) | NOT NULL | Action type | e.g., 'LOGIN', 'PHI_ACCESSED' |
| resource_type | VARCHAR(50) | | Resource affected | e.g., 'medical_record' |
| resource_id | UUID | | Specific resource ID | |
| ip_address | VARCHAR(45) | | Client IP (IPv4/IPv6) | Forensics |
| user_agent | TEXT | | Browser/client info | Device fingerprinting |
| details | JSONB | | Additional context | **Never log passwords/tokens** |
| created_at | TIMESTAMP | DEFAULT NOW() | Log timestamp | Immutable |

---

## Indexes for Performance and Security

```sql
-- Authentication performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Query performance
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);

-- Security monitoring
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);
```

---

## Compliance and Regulatory Considerations

### Data Privacy Act of 2012 (Philippines)

**Applicable Sections:**
- **Section 11 (Sensitive Personal Information):** Medical/health information is classified as sensitive
- **Section 20 (Security Measures):** Requires organizational, physical, and technical safeguards

**Compliance Measures:**
1. **Encryption:** PHI encrypted at rest (diagnosis, treatment, SSN)
2. **Access Control:** RBAC ensures doctors only see their patients' records
3. **Audit Trail:** All PHI access logged in `audit_log` table
4. **Data Minimization:** Only collect necessary health information
5. **User Consent:** Registration implies consent (should be explicit in production)

### International Standards (For Reference)

**HIPAA (US):**
- Would require: Business Associate Agreements, breach notification, stronger encryption
- This project demonstrates controls aligned with HIPAA principles

**GDPR (EU):**
- Right to erasure, data portability, consent management
- `is_active` flag supports soft deletion for compliance

---

## Conclusion

This database design prioritizes:
1. **Security:** Encryption, parameterized queries, least privilege, audit logging
2. **Data Integrity:** ACID transactions, foreign keys, check constraints
3. **Scalability:** Proper indexing, connection pooling, normalized schema
4. **Compliance:** Aligned with Data Privacy Act requirements for healthcare data

The relational model (PostgreSQL) is justified over NoSQL alternatives due to:
- Complex relationships requiring joins
- Strong consistency requirements (ACID)
- Structured, predictable data schema
- Superior security against injection attacks when using parameterized queries

**Sources:**
- PostgreSQL Documentation: https://www.postgresql.org/docs/15/
- OWASP SQL Injection Prevention: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- Data Privacy Act of 2012 (Philippines): Republic Act No. 10173
