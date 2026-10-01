# Infrastructure & Hosting Architecture

## Project: Secure Clinic Appointment System
**Course:** Web Security - Midterm Project

---

## Table of Contents
1. [Hosting Provider Selection](#hosting-provider-selection)
2. [Network Architecture](#network-architecture)
3. [Security Posture Analysis](#security-posture-analysis)
4. [Secrets Management](#secrets-management)
5. [Deployment Configuration](#deployment-configuration)

---

## Hosting Provider Selection

### Application Server: **Render** (Primary) / **Railway** (Alternative)

#### Selected Provider: Render (https://render.com)

**Service Type:** Web Service (Docker/Node.js)

**Justification:**

| Criteria | Render | Analysis |
|----------|--------|----------|
| **Security Posture** | ✅ Excellent | Automatic TLS/SSL certificates (Let's Encrypt), DDoS protection at CDN level, isolated compute instances, SOC 2 Type II compliant |
| **Network Isolation** | ✅ Strong | Private services can only be accessed within Render network, not exposed to public internet |
| **Managed TLS/SSL** | ✅ Free tier | Automatic HTTPS with auto-renewal, TLS 1.2+ enforced, HTTP → HTTPS redirect built-in |
| **Environment Variables** | ✅ Encrypted | Secrets stored encrypted at rest, injected at runtime, never logged |
| **DDoS Protection** | ✅ Included | Cloudflare CDN integration on paid plans, rate limiting at edge |
| **Firewall/IP Allowlisting** | ⚠️ Paid tier | IP allowlisting available on Team plan ($19/user/month) |
| **Automated Backups** | N/A | Application stateless, database handles backups |
| **Data Residency** | 🌍 US/EU | Servers in Oregon (US West), Ohio (US East), Frankfurt (EU) - GDPR compliant options |
| **Monitoring** | ✅ Built-in | Health checks, auto-restart on failure, log aggregation |
| **Cost** | ✅ Free tier | Free tier: 750 hrs/month, sufficient for development/demo; Starter ($7/month) for production |

**Free Tier Limitations:**
- Services spin down after 15 minutes of inactivity (cold starts ~30s)
- No IP allowlisting (security feature gated)
- 100GB bandwidth/month
- Shared compute resources

**Production Considerations:**
- Starter plan ($7/month) removes spin-down
- Team plan ($19/user/month) adds IP restrictions
- Pro plan ($85/month) adds advanced DDoS protection

---

### Database Server: **Supabase** (Primary) / **Neon** (Alternative)

#### Selected Provider: Supabase (https://supabase.com)

**Service Type:** Managed PostgreSQL with REST API

**Justification:**

| Criteria | Supabase | Analysis |
|----------|----------|----------|
| **Security Posture** | ✅ Excellent | PostgreSQL 15, managed by AWS RDS, encrypted at rest (AES-256), TLS 1.2+ in transit |
| **Network Isolation** | ✅ Private Connection | Connection pooler (PgBouncer) with connection string authentication, can restrict to specific IPs on paid plans |
| **Public Exposure** | ⚠️ Configurable | Database not directly public - accessed via connection pooler with auth; optional IP allowlisting on Pro plan |
| **Automated Backups** | ✅ Included | Daily backups retained 7 days (free), point-in-time recovery on Pro ($25/month) |
| **Secrets Management** | ✅ Secure | Connection strings include auto-generated passwords, stored in Render env vars (not in repo) |
| **Compliance** | ✅ SOC 2 Type II | GDPR compliant, HIPAA available on Enterprise plan |
| **Data Residency** | 🌍 Multi-region | US East, EU West, Southeast Asia - can choose region for data sovereignty |
| **Firewall** | ⚠️ Paid tier | IP restrictions available on Pro plan ($25/org/month) |
| **Monitoring** | ✅ Built-in | Query performance insights, connection pooling metrics, slow query logs |
| **Cost** | ✅ Free tier | Free: 500MB database, 2GB bandwidth, 50,000 monthly active users; Pro: $25/month for 8GB |

**Free Tier Limitations:**
- 500MB storage (sufficient for ~50,000 patient records)
- No IP allowlisting (database accessible from any IP with credentials)
- Paused after 7 days of inactivity (reactivates on first query)

**Security Mitigation for Free Tier:**
- Connection string includes strong auto-generated password
- Only application server has credentials (not exposed to clients)
- TLS required for all connections
- Render → Supabase connection uses private network when possible

**Alternative: Neon (https://neon.tech)**
- Serverless PostgreSQL with better free tier (3GB storage)
- Automatic scaling, faster cold starts
- Similar security posture
- No IP allowlisting on free tier

---

## Network Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         INTERNET (Public)                            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                │ HTTPS (TLS 1.2+)
                                │
                                ▼
                ┌──────────────────────────────────┐
                │   Cloudflare CDN (Optional)      │
                │   - DDoS Protection              │
                │   - Web Application Firewall     │
                │   - Edge Caching                 │
                │   - Rate Limiting (L7)           │
                └───────────────┬──────────────────┘
                                │
                                │ HTTPS
                                │
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    Trust Boundary #1 - CDN → App                      │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
                ┌────────────────────────────────────┐
                │   Render Web Service               │
                │   ┌──────────────────────────┐    │
                │   │  Node.js + Express       │    │
                │   │  Port: 3000 (internal)   │    │
                │   │  - Helmet (headers)      │    │
                │   │  - CORS (allowlist)      │    │
                │   │  - Rate Limiting         │    │
                │   │  - JWT Validation        │    │
                │   │  - Input Validation      │    │
                │   └──────────────────────────┘    │
                │                                    │
                │   Environment Variables:           │
                │   - DB_HOST, DB_PASSWORD          │
                │   - JWT_ACCESS_SECRET             │
                │   - ENCRYPTION_KEY                │
                │   (Encrypted at rest, injected    │
                │    at runtime, never logged)      │
                └─────────────┬──────────────────────┘
                              │
                              │ PostgreSQL Protocol
                              │ (TLS encrypted)
                              │
┌─────────────────────────────┼──────────────────────────────────────────┐
│            Trust Boundary #2 - App → Database                          │
└─────────────────────────────┼──────────────────────────────────────────┘
                              │
                              ▼
                ┌──────────────────────────────────────┐
                │   Supabase PostgreSQL                │
                │   ┌────────────────────────────┐     │
                │   │  PostgreSQL 15             │     │
                │   │  Port: 5432 (via pooler)   │     │
                │   │  - TLS Required            │     │
                │   │  - Password Auth           │     │
                │   │  - Connection Pooling      │     │
                │   │  - Encrypted at Rest       │     │
                │   │  - Daily Backups           │     │
                │   └────────────────────────────┘     │
                │                                      │
                │   Network Access:                    │
                │   ⚠️ Public endpoint with auth       │
                │   ✅ TLS 1.2+ required               │
                │   ✅ Strong password                 │
                │   (IP allowlist on paid plan)        │
                └──────────────────────────────────────┘
```

### Trust Boundaries

#### Trust Boundary #1: Internet → Application Server

**Threat Model:**
- Malicious clients attempting attacks (XSS, CSRF, SQLi)
- DDoS attacks
- Credential stuffing
- Man-in-the-middle attacks

**Controls:**
1. **TLS/HTTPS:** All traffic encrypted end-to-end
2. **HSTS:** Force HTTPS, prevent downgrade attacks
3. **Helmet.js:** Security headers (CSP, X-Frame-Options, etc.)
4. **CORS:** Strict origin allowlist, no wildcards
5. **Rate Limiting:** 100 req/15min per IP (general), 5 req/15min (auth)
6. **Input Validation:** Zod schemas reject malformed data
7. **Authentication:** JWT tokens required for protected endpoints

#### Trust Boundary #2: Application → Database

**Threat Model:**
- Compromised application server
- Database credential leakage
- SQL injection (defense in depth)
- Unauthorized data access

**Controls:**
1. **TLS in Transit:** PostgreSQL connections encrypted
2. **Least-Privilege User:** `clinic_app_user` has no DDL rights (no DROP/ALTER)
3. **Parameterized Queries:** All queries use `$1, $2` placeholders
4. **Encryption at Rest:** Supabase encrypts data with AES-256
5. **Connection String Security:** Stored in environment variables, never committed to Git
6. **Audit Logging:** All queries logged for forensics

---

## Security Posture Analysis

### Application Server (Render)

#### Strengths:
✅ **Automatic TLS:** Let's Encrypt certificates auto-provisioned and renewed  
✅ **Isolated Containers:** Each service runs in separate Docker container  
✅ **Secure Defaults:** HTTPS-only, modern TLS versions (1.2+)  
✅ **Environment Variable Encryption:** Secrets encrypted at rest in Render's vault  
✅ **DDoS Protection:** Basic protection at CDN layer (advanced on paid plans)  
✅ **SOC 2 Compliant:** Third-party security audit passed  
✅ **Auto-Healing:** Crashed services automatically restarted  

#### Limitations:
⚠️ **Free Tier IP Allowlisting:** Cannot restrict access to specific IPs without paid plan  
⚠️ **Shared Infrastructure:** Free tier shares compute with other tenants  
⚠️ **Cold Starts:** 15-min inactivity causes service to spin down (30s restart)  
⚠️ **Limited WAF:** No advanced WAF rules on free tier  

#### Risk Mitigation:
- **Rate limiting at application layer** compensates for lack of IP allowlist
- **Authentication required** for all sensitive endpoints (not relying on IP)
- **Input validation** defends against common attacks regardless of IP

### Database Server (Supabase)

#### Strengths:
✅ **Encryption at Rest:** AES-256 encryption for all stored data  
✅ **TLS Required:** Cannot connect without TLS 1.2+  
✅ **Managed Security:** AWS RDS handles OS patching, vulnerability scanning  
✅ **Automated Backups:** Daily backups with 7-day retention  
✅ **Connection Pooling:** PgBouncer prevents connection exhaustion  
✅ **Monitoring:** Real-time query performance insights  
✅ **Row-Level Security:** PostgreSQL RLS available (can be enabled)  

#### Limitations:
⚠️ **Public Endpoint:** Database accessible from internet (with credentials)  
⚠️ **No IP Allowlist (Free):** Cannot restrict to Render's IPs without Pro plan  
⚠️ **500MB Storage:** Limited to small datasets on free tier  

#### Risk Mitigation:
- **Strong Credentials:** Auto-generated 32-character passwords
- **TLS Mandatory:** Prevents credential interception
- **Application-Layer Authorization:** RBAC enforced in Node.js, not just DB
- **Least-Privilege User:** Application cannot drop tables even if compromised

---

## Secrets Management

### ❌ What NOT to Do (Common Mistakes)

```javascript
// ❌ NEVER COMMIT SECRETS TO GIT
const dbPassword = "my_secret_password_123";

// ❌ NEVER HARDCODE API KEYS
const JWT_SECRET = "hardcoded_secret";

// ❌ NEVER STORE SECRETS IN FRONTEND
const apiKey = process.env.REACT_APP_SECRET_KEY; // Exposed in bundle!
```

### ✅ Secure Secrets Management Implementation

#### 1. Environment Variables (`.env` file)

**File:** `.env` (local development only, NOT committed)

```bash
# Database credentials
DB_HOST=db.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.abcdefghijklmnop
DB_PASSWORD=randomly_generated_32_char_password_here

# JWT secrets (MUST be 32+ characters)
JWT_ACCESS_SECRET=your_randomly_generated_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_randomly_generated_refresh_secret_min_32_chars

# Encryption key for PHI (MUST be exactly 32 bytes for AES-256)
ENCRYPTION_KEY=your_32_character_encryption_key
```

**Security Measures:**
- ✅ `.env` listed in `.gitignore` (never committed)
- ✅ `.env.example` committed (shows structure, no real secrets)
- ✅ `dotenv` library loads variables at runtime
- ✅ Application validates required variables on startup

#### 2. Render Secrets Manager

**Configuration in Render Dashboard:**

1. Navigate to Web Service → Environment
2. Add environment variables:
   - `DB_HOST` = `db.supabase.co`
   - `DB_PASSWORD` = (paste from Supabase dashboard)
   - `JWT_ACCESS_SECRET` = (generate with `openssl rand -hex 32`)
   - etc.

**Render Security:**
- 🔒 Encrypted at rest (AES-256)
- 🔒 Encrypted in transit (TLS)
- 🔒 Only visible to service at runtime
- 🔒 Not logged or exposed in build logs
- 🔒 Automatic rotation supported

#### 3. Secret Generation Best Practices

```bash
# Generate strong JWT secrets (64 random hex characters)
openssl rand -hex 32
# Output: a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1

# Generate encryption key (32 characters for AES-256)
openssl rand -base64 32 | head -c 32
# Output: 7Bx9Kp2Lm5Nq8Rt4Wv6Yz1Ac3De5Fg7H

# Verify key length
echo -n "your_key_here" | wc -c  # Should output 32
```

#### 4. Secrets Verification (Startup Check)

**File:** `server/index.js`

```javascript
// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST', 'DB_PASSWORD', 'JWT_ACCESS_SECRET', 
  'JWT_REFRESH_SECRET', 'ENCRYPTION_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Validate secret strength
if (process.env.JWT_ACCESS_SECRET.length < 32) {
  console.error('❌ JWT_ACCESS_SECRET must be at least 32 characters');
  process.exit(1);
}
```

#### 5. Frontend Security (No Secrets!)

```javascript
// ✅ CORRECT: No secrets in frontend
const API_BASE_URL = '/api'; // Relative URL, proxied by Vite

// ❌ WRONG: Never use REACT_APP_* for secrets
// Anything prefixed with REACT_APP_ is bundled and publicly visible!
```

**How to verify frontend has no secrets:**
```bash
# Build production bundle
npm run build

# Search for potential secrets in bundle
grep -r "secret\|password\|api_key" dist/
# Should return no matches!
```

---

## Deployment Configuration

### Render Deployment

#### `render.yaml` (Infrastructure as Code)

```yaml
services:
  - type: web
    name: secure-clinic-api
    env: node
    region: oregon
    plan: starter  # $7/month, no cold starts
    buildCommand: npm install
    startCommand: node server/index.js
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DB_HOST
        sync: false  # Set in dashboard (secret)
      - key: DB_PASSWORD
        sync: false  # Set in dashboard (secret)
      - key: JWT_ACCESS_SECRET
        sync: false  # Set in dashboard (secret)
      - key: JWT_REFRESH_SECRET
        sync: false  # Set in dashboard (secret)
      - key: ENCRYPTION_KEY
        sync: false  # Set in dashboard (secret)
      - key: ALLOWED_ORIGINS
        value: https://secure-clinic.onrender.com
```

#### Deployment Process

1. **Connect Repository:**
   - Link GitHub/GitLab repository to Render
   - Enable auto-deploy on push to `main` branch

2. **Configure Environment:**
   - Add all secrets in Render dashboard
   - Set NODE_ENV=production
   - Configure ALLOWED_ORIGINS with actual domain

3. **Database Setup:**
   - Create Supabase project
   - Copy connection string from Supabase dashboard
   - Run `schema.sql` in Supabase SQL editor
   - Run `create-user.sql` (update password first!)

4. **Deploy:**
   - Push to `main` branch
   - Render automatically builds and deploys
   - Monitor build logs for errors

5. **Verify Deployment:**
   ```bash
   # Health check
   curl https://secure-clinic-api.onrender.com/health
   # Expected: {"success":true,"status":"healthy"}
   
   # Security headers check
   curl -I https://secure-clinic-api.onrender.com/health
   # Should see: Strict-Transport-Security, X-Frame-Options, CSP
   ```

### Supabase Configuration

#### Database Initialization

1. **Create Project:**
   - Sign up at https://supabase.com
   - Create new project (choose region: US East for latency)
   - Note down connection string

2. **Run Schema:**
   - Navigate to SQL Editor
   - Copy contents of `server/database/schema.sql`
   - Execute (creates tables, indexes, triggers)

3. **Create Application User:**
   - Copy contents of `server/database/create-user.sql`
   - **IMPORTANT:** Change password in script first!
   - Execute to create `clinic_app_user`

4. **Configure Connection:**
   - Use "Connection Pooling" string (port 6543, not 5432)
   - Format: `postgresql://postgres.[project]:[password]@db.supabase.co:6543/postgres`
   - Add to Render environment variables

#### Security Configuration

1. **Enable SSL/TLS:**
   - Already enabled by default on Supabase
   - Verify: Connection string includes `?sslmode=require`

2. **IP Allowlisting (Pro Plan):**
   - If using paid plan, restrict to Render's IP ranges
   - Settings → Database → Network Restrictions

3. **Monitoring:**
   - Enable slow query logging
   - Set up alerts for connection spikes
   - Monitor for suspicious queries

---

## Cost Analysis

### Development/Demo Configuration (FREE)

| Component | Provider | Plan | Cost | Limitations |
|-----------|----------|------|------|-------------|
| Application Server | Render | Free | $0/month | Cold starts, 750 hrs/month |
| Database | Supabase | Free | $0/month | 500MB storage, 7-day backups |
| Domain | N/A | Render subdomain | $0 | *.onrender.com |
| **Total** | | | **$0/month** | Suitable for demo/portfolio |

### Production Configuration (Recommended)

| Component | Provider | Plan | Cost | Features |
|-----------|----------|------|------|----------|
| Application Server | Render | Starter | $7/month | No cold starts, persistent |
| Database | Supabase | Pro | $25/month | 8GB storage, PITR, IP allowlist |
| Domain | Namecheap | .com | $13/year | Custom domain with SSL |
| **Total** | | | **$32/month** | Production-ready |

### Enterprise Configuration (Compliance)

| Component | Provider | Plan | Cost | Features |
|-----------|----------|------|------|----------|
| Application Server | Render | Team | $85/month | IP allowlist, advanced DDoS |
| Database | Supabase | Enterprise | Custom | HIPAA-compliant, BAA, SOC 2 |
| WAF | Cloudflare | Pro | $20/month | Advanced firewall rules |
| **Total** | | | **$105+/month** | HIPAA-ready |

---

## Data Residency and Compliance

### Geographic Distribution

**Application Server Regions (Render):**
- 🇺🇸 **US West (Oregon)** - Default, lowest latency for US
- 🇺🇸 **US East (Ohio)** - East coast applications
- 🇪🇺 **EU Central (Frankfurt)** - GDPR compliance, European users

**Database Regions (Supabase):**
- 🇺🇸 **US East (Virginia)** - Default
- 🇪🇺 **EU West (Ireland)** - GDPR data residency
- 🌏 **Southeast Asia (Singapore)** - APAC users

### Compliance Considerations

#### Data Privacy Act of 2012 (Philippines)

**Requirement:** Personal data must be protected with organizational, physical, and technical safeguards.

**Compliance Status:**
- ✅ **Technical Safeguards:** Encryption (at rest and in transit), access control, audit logging
- ✅ **Organizational:** Role-based access control, least-privilege principle
- ⚠️ **Physical:** Relies on hosting provider (Render/AWS/Supabase)
- ✅ **Data Location:** Can be hosted in US or EU (Supabase multi-region)

**Recommendation:** For Philippine deployment, choose **US East** or **Southeast Asia** region for lower latency.

#### GDPR (If serving EU users)

**Requirements:**
- Right to erasure (delete account)
- Right to data portability (export data)
- Data processing agreement with processors

**Implementation:**
- ✅ Soft delete via `is_active` flag supports "right to be forgotten"
- ✅ API endpoints can export user data (implement `/api/users/export`)
- ✅ Supabase is GDPR-compliant (DPA available)
- ⚠️ Must choose EU region (Frankfurt/Ireland) for EU users

#### HIPAA (If handling US healthcare data)

**Requirements:**
- Business Associate Agreement (BAA)
- Encrypted PHI at rest and in transit
- Access controls and audit logging
- Breach notification procedures

**Current Status:**
- ⚠️ **Free tier NOT HIPAA-compliant**
- ✅ **Supabase Enterprise** offers HIPAA BAA
- ✅ **Render Enterprise** offers HIPAA BAA
- ✅ PHI encryption implemented (diagnosis, treatment plans)

**For HIPAA Compliance:** Upgrade to Enterprise plans (~$500+/month combined)

---

## Monitoring and Incident Response

### Health Monitoring

**Render Built-in:**
- `/health` endpoint checked every 30 seconds
- Auto-restart on 3 consecutive failures
- Email alerts on service down

**Custom Monitoring (Recommended):**
```javascript
// server/index.js
app.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    await testConnection();
    
    res.status(200).json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed'
    });
  }
});
```

### Security Incident Response

**Breach Detection:**
1. Monitor audit log for unusual patterns:
   - Multiple failed logins from same IP
   - PHI access outside normal hours
   - Bulk data exports

2. Set up alerts:
   ```sql
   -- Query to detect suspicious activity
   SELECT user_id, action, COUNT(*) as count
   FROM audit_log
   WHERE action = 'FAILED_LOGIN'
     AND created_at > NOW() - INTERVAL '1 hour'
   GROUP BY user_id, action
   HAVING COUNT(*) > 5;
   ```

**Incident Response Plan:**
1. **Detect:** Monitor logs, alert triggers
2. **Contain:** Revoke compromised tokens, lock accounts
3. **Investigate:** Review audit logs, identify scope
4. **Notify:** Inform affected users (Data Privacy Act requirement)
5. **Remediate:** Patch vulnerability, rotate secrets
6. **Document:** Record incident for compliance

---

## Conclusion

This architecture demonstrates:

1. **Separation of Concerns:** Application and database on separate providers with distinct trust boundaries
2. **Defense in Depth:** Multiple layers of security (TLS, authentication, authorization, encryption, audit logging)
3. **Secrets Management:** Never commit secrets to Git; use environment variables and encrypted vaults
4. **Cost-Effective Security:** Free tier provides strong baseline security; paid tiers add compliance features
5. **Scalability:** Can upgrade to enterprise plans for HIPAA/GDPR compliance without architecture changes

**Key Security Decisions:**
- ✅ Database NOT directly exposed to public (requires application credentials)
- ✅ TLS enforced end-to-end (client → app → database)
- ✅ Secrets encrypted at rest in hosting provider vaults
- ✅ Least-privilege database user (cannot drop tables)
- ✅ Audit logging for forensic analysis
- ⚠️ IP allowlisting requires paid plan (mitigated with rate limiting + auth)

**Diagram Sources:**
- Render Architecture Docs: https://render.com/docs
- Supabase Security: https://supabase.com/docs/guides/platform/security
- OWASP Secure Deployment Guide: https://cheatsheetseries.owasp.org/
