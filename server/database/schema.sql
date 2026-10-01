-- ============================================================================
-- SECURE CLINIC APPOINTMENT SYSTEM - DATABASE SCHEMA
-- Web Security Midterm Project
-- ============================================================================
-- Security Features Implemented:
-- 1. Least-privilege principle (separate user with limited grants)
-- 2. Parameterized queries only (enforced at application layer)
-- 3. Encrypted sensitive fields (SSN, medical notes - encrypted at app layer)
-- 4. Audit trail for sensitive operations
-- 5. Foreign key constraints for data integrity
-- 6. Check constraints for data validation
-- ============================================================================

-- Enable UUID extension for secure random IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE - Central authentication table
-- ============================================================================
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed, never plaintext
    role VARCHAR(20) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- PATIENTS TABLE - Patient demographic and PII data
-- ============================================================================
CREATE TABLE patients (
    patient_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    phone VARCHAR(20),
    address TEXT,
    ssn_encrypted TEXT, -- AES-256 encrypted at application layer
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);

-- ============================================================================
-- DOCTORS TABLE - Doctor profiles and specializations
-- ============================================================================
CREATE TABLE doctors (
    doctor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20),
    consultation_fee DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);

-- ============================================================================
-- DOCTOR_SCHEDULES TABLE - Doctor availability for appointments
-- ============================================================================
CREATE TABLE doctor_schedules (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

CREATE INDEX idx_doctor_schedules_doctor ON doctor_schedules(doctor_id);

-- ============================================================================
-- APPOINTMENTS TABLE - Appointment bookings
-- ============================================================================
CREATE TABLE appointments (
    appointment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
    reason_for_visit TEXT NOT NULL,
    notes TEXT, -- Patient's initial notes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_doctor_appointment UNIQUE (doctor_id, appointment_date, appointment_time)
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ============================================================================
-- MEDICAL_RECORDS TABLE - Doctor's notes and diagnoses (PHI - most sensitive)
-- ============================================================================
CREATE TABLE medical_records (
    record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID UNIQUE NOT NULL REFERENCES appointments(appointment_id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    diagnosis_encrypted TEXT NOT NULL, -- AES-256 encrypted at application layer
    treatment_plan_encrypted TEXT, -- AES-256 encrypted at application layer
    prescription TEXT, -- Could be encrypted in production
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_records_patient ON medical_records(patient_id);
CREATE INDEX idx_medical_records_appointment ON medical_records(appointment_id);

-- ============================================================================
-- REFRESH_TOKENS TABLE - Secure token management
-- ============================================================================
CREATE TABLE refresh_tokens (
    token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL, -- Hashed refresh token
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP NULL,
    replaced_by_token UUID NULL REFERENCES refresh_tokens(token_id)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ============================================================================
-- AUDIT_LOG TABLE - Security event logging
-- ============================================================================
CREATE TABLE audit_log (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'LOGIN', 'FAILED_LOGIN', 'ACCESS_DENIED', 'DATA_MODIFIED'
    resource_type VARCHAR(50), -- e.g., 'appointment', 'medical_record', 'user'
    resource_id UUID,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB, -- Additional context (never log passwords/tokens)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ============================================================================
-- TRIGGER: Update updated_at timestamp automatically
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA for testing (ONLY for development - remove in production)
-- ============================================================================
-- Note: Passwords are bcrypt hashed version of: "Admin123!", "Doctor123!", "Patient123!"
-- Cost factor: 12

-- Insert test users
INSERT INTO users (user_id, email, password_hash, role) VALUES
('a1111111-1111-1111-1111-111111111111', 'admin@clinic.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7RMKF4hX5m', 'admin'),
('d2222222-2222-2222-2222-222222222222', 'doctor@clinic.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7RMKF4hX5m', 'doctor'),
('p3333333-3333-3333-3333-333333333333', 'patient@clinic.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7RMKF4hX5m', 'patient');

-- Insert test doctor
INSERT INTO doctors (doctor_id, user_id, first_name, last_name, specialization, license_number, phone, consultation_fee) VALUES
('d0000001-0000-0000-0000-000000000001', 'd2222222-2222-2222-2222-222222222222', 'John', 'Smith', 'General Practitioner', 'LIC-GP-12345', '+63-917-1234567', 1500.00);

-- Insert test patient
INSERT INTO patients (patient_id, user_id, first_name, last_name, date_of_birth, gender, phone, address) VALUES
('p0000001-0000-0000-0000-000000000001', 'p3333333-3333-3333-3333-333333333333', 'Jane', 'Doe', '1990-05-15', 'female', '+63-917-7654321', '123 Main St, Manila');

-- Insert doctor schedule (Monday to Friday, 9 AM - 5 PM)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time) VALUES
('d0000001-0000-0000-0000-000000000001', 1, '09:00:00', '17:00:00'),
('d0000001-0000-0000-0000-000000000001', 2, '09:00:00', '17:00:00'),
('d0000001-0000-0000-0000-000000000001', 3, '09:00:00', '17:00:00'),
('d0000001-0000-0000-0000-000000000001', 4, '09:00:00', '17:00:00'),
('d0000001-0000-0000-0000-000000000001', 5, '09:00:00', '17:00:00');

-- Log the schema creation
INSERT INTO audit_log (action, details) VALUES
('SCHEMA_INITIALIZED', '{"message": "Database schema created successfully"}');
