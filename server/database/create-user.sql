-- ============================================================================
-- CREATE LEAST-PRIVILEGE DATABASE USER
-- Security Best Practice: Application should NOT connect as postgres/superuser
-- ============================================================================

-- Create application user with limited privileges
CREATE USER clinic_app_user WITH PASSWORD 'CHANGE_ME_IN_PRODUCTION_123!@#';

-- Grant CONNECT privilege to the database
GRANT CONNECT ON DATABASE secure_clinic TO clinic_app_user;

-- Grant USAGE on schema
GRANT USAGE ON SCHEMA public TO clinic_app_user;

-- Grant SELECT, INSERT, UPDATE, DELETE on tables (NO DROP, NO ALTER)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO clinic_app_user;

-- Grant USAGE on sequences (for auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clinic_app_user;

-- Make these grants apply to future tables too
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clinic_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO clinic_app_user;

-- Explicitly REVOKE superuser capabilities (defensive programming)
REVOKE CREATE ON SCHEMA public FROM clinic_app_user;

-- Log the user creation
INSERT INTO audit_log (action, details) VALUES
('DB_USER_CREATED', '{"user": "clinic_app_user", "privileges": "SELECT, INSERT, UPDATE, DELETE only - no DDL"}');

-- ============================================================================
-- VERIFICATION QUERY (run as postgres user)
-- ============================================================================
-- SELECT * FROM information_schema.role_table_grants WHERE grantee = 'clinic_app_user';
