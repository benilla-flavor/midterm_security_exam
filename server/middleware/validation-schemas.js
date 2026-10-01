/**
 * ZOD VALIDATION SCHEMAS
 * Centralized input validation schemas for all API endpoints
 * Security: Reject invalid data before it reaches business logic
 */

import { z } from 'zod';

// ============================================================================
// COMMON SCHEMAS
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid ID format');

export const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email too long');

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

export const phoneSchema = z.string()
  .regex(/^[\d\s\-+()]+$/, 'Invalid phone number format')
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long')
  .optional();

export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const timeSchema = z.string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Time must be in HH:MM or HH:MM:SS format');

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['patient', 'doctor'], {
    errorMap: () => ({ message: 'Role must be either patient or doctor' })
  }),
  firstName: z.string().min(1, 'First name required').max(100),
  lastName: z.string().min(1, 'Last name required').max(100),
  dateOfBirth: dateSchema,
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  phone: phoneSchema,
  // Doctor-specific fields
  specialization: z.string().max(100).optional(),
  licenseNumber: z.string().max(50).optional()
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password required')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required')
});

// ============================================================================
// APPOINTMENT SCHEMAS
// ============================================================================

export const createAppointmentSchema = z.object({
  doctorId: uuidSchema,
  appointmentDate: dateSchema,
  appointmentTime: timeSchema,
  reasonForVisit: z.string()
    .min(10, 'Please provide more details about your visit')
    .max(500, 'Reason for visit is too long')
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'], {
    errorMap: () => ({ message: 'Invalid status value' })
  })
});

export const appointmentQuerySchema = z.object({
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  status: z.enum(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

// ============================================================================
// MEDICAL RECORD SCHEMAS
// ============================================================================

export const createMedicalRecordSchema = z.object({
  appointmentId: uuidSchema,
  diagnosis: z.string()
    .min(5, 'Diagnosis too short')
    .max(2000, 'Diagnosis too long'),
  treatmentPlan: z.string()
    .max(2000, 'Treatment plan too long')
    .optional(),
  prescription: z.string()
    .max(1000, 'Prescription too long')
    .optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: dateSchema.optional()
});

export const updateMedicalRecordSchema = z.object({
  diagnosis: z.string().min(5).max(2000).optional(),
  treatmentPlan: z.string().max(2000).optional(),
  prescription: z.string().max(1000).optional(),
  followUpRequired: z.boolean().optional(),
  followUpDate: dateSchema.optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

// ============================================================================
// PATIENT SCHEMAS
// ============================================================================

export const updatePatientProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: phoneSchema,
  address: z.string().max(500).optional(),
  emergencyContactName: z.string().max(200).optional(),
  emergencyContactPhone: phoneSchema
});

// ============================================================================
// DOCTOR SCHEMAS
// ============================================================================

export const updateDoctorProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  specialization: z.string().max(100).optional(),
  phone: phoneSchema,
  consultationFee: z.number().min(0).max(999999.99).optional()
});

export const createDoctorScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6, 'Day of week must be 0-6 (0=Sunday)'),
  startTime: timeSchema,
  endTime: timeSchema
}).refine(data => data.endTime > data.startTime, {
  message: 'End time must be after start time'
});

// ============================================================================
// ADMIN SCHEMAS
// ============================================================================

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['patient', 'doctor', 'admin'])
});

export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  role: z.enum(['patient', 'doctor', 'admin']).optional(),
  isActive: z.boolean().optional()
});

// ============================================================================
// PARAMETER SCHEMAS
// ============================================================================

export const idParamSchema = z.object({
  id: uuidSchema
});

export const patientIdParamSchema = z.object({
  patientId: uuidSchema
});

export const doctorIdParamSchema = z.object({
  doctorId: uuidSchema
});

export const appointmentIdParamSchema = z.object({
  appointmentId: uuidSchema
});

export const recordIdParamSchema = z.object({
  recordId: uuidSchema
});

export default {
  // Common
  uuidSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
  dateSchema,
  timeSchema,
  
  // Auth
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  
  // Appointments
  createAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentQuerySchema,
  
  // Medical Records
  createMedicalRecordSchema,
  updateMedicalRecordSchema,
  
  // Patients
  updatePatientProfileSchema,
  
  // Doctors
  updateDoctorProfileSchema,
  createDoctorScheduleSchema,
  
  // Admin
  createUserSchema,
  updateUserSchema,
  
  // Params
  idParamSchema,
  patientIdParamSchema,
  doctorIdParamSchema,
  appointmentIdParamSchema,
  recordIdParamSchema
};
