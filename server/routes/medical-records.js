/**
 * MEDICAL RECORDS ROUTES
 * Endpoints for managing sensitive medical records (PHI)
 * SECURITY: Encrypted diagnosis and treatment plans
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/security.js';
import { createMedicalRecordSchema } from '../middleware/validation-schemas.js';
import { query } from '../database/db.js';
import { encrypt, decrypt } from '../utils/encryption.js';

const router = express.Router();

// All medical record routes require authentication
router.use(authenticate);

/**
 * POST /api/medical-records
 * Create medical record (doctors only)
 */
router.post(
  '/',
  authorize(['doctor']),
  validateBody(createMedicalRecordSchema),
  async (req, res) => {
    try {
      const { appointmentId, diagnosis, treatmentPlan, prescription, followUpRequired, followUpDate } = req.body;
      
      // Get doctor ID
      const doctorResult = await query(
        'SELECT doctor_id FROM doctors WHERE user_id = $1',
        [req.user.userId]
      );
      
      if (doctorResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Doctor profile not found' });
      }
      
      const doctorId = doctorResult.rows[0].doctor_id;
      
      // Verify appointment exists and belongs to this doctor
      const apptResult = await query(
        'SELECT patient_id FROM appointments WHERE appointment_id = $1 AND doctor_id = $2',
        [appointmentId, doctorId]
      );
      
      if (apptResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Appointment not found or access denied' });
      }
      
      const patientId = apptResult.rows[0].patient_id;
      
      // Encrypt sensitive PHI data
      const diagnosisEncrypted = encrypt(diagnosis);
      const treatmentPlanEncrypted = treatmentPlan ? encrypt(treatmentPlan) : null;
      
      // Create medical record
      const result = await query(
        `INSERT INTO medical_records 
         (appointment_id, patient_id, doctor_id, diagnosis_encrypted, treatment_plan_encrypted, 
          prescription, follow_up_required, follow_up_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING record_id, appointment_id, patient_id, doctor_id, 
                   prescription, follow_up_required, follow_up_date, created_at`,
        [appointmentId, patientId, doctorId, diagnosisEncrypted, treatmentPlanEncrypted,
         prescription, followUpRequired, followUpDate]
      );
      
      // Log PHI access
      await query(
        `INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent)
         VALUES ($1, 'MEDICAL_RECORD_CREATED', 'medical_record', $2, $3, $4)`,
        [req.user.userId, result.rows[0].record_id, req.ip, req.get('user-agent')]
      );
      
      res.status(201).json({ 
        success: true, 
        record: {
          ...result.rows[0],
          diagnosis,
          treatmentPlan
        }
      });
    } catch (error) {
      console.error('Create medical record error:', error);
      res.status(500).json({ success: false, error: 'Failed to create medical record' });
    }
  }
);

/**
 * GET /api/medical-records/patient/:patientId
 * Get patient's medical records (patient themselves, their doctors, or admin)
 */
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Verify access rights
    let hasAccess = false;
    
    if (req.user.role === 'admin') {
      hasAccess = true;
    } else if (req.user.role === 'patient') {
      // Patient can only access their own records
      const patientResult = await query(
        'SELECT patient_id FROM patients WHERE user_id = $1 AND patient_id = $2',
        [req.user.userId, patientId]
      );
      hasAccess = patientResult.rows.length > 0;
    } else if (req.user.role === 'doctor') {
      // Doctor can access records they created
      hasAccess = true; // Will be filtered in query
    }
    
    if (!hasAccess) {
      await query(
        `INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
         VALUES ($1, 'PHI_ACCESS_DENIED', 'medical_record', $2, $3, $4, $5)`,
        [req.user.userId, patientId, req.ip, req.get('user-agent'), 
         { reason: 'Unauthorized access attempt' }]
      );
      
      return res.status(403).json({ success: false, error: 'Access denied' });
    }
    
    // Get medical records
    let recordsResult;
    if (req.user.role === 'doctor') {
      // Only records created by this doctor
      const doctorResult = await query(
        'SELECT doctor_id FROM doctors WHERE user_id = $1',
        [req.user.userId]
      );
      const doctorId = doctorResult.rows[0].doctor_id;
      
      recordsResult = await query(
        `SELECT * FROM medical_records 
         WHERE patient_id = $1 AND doctor_id = $2
         ORDER BY created_at DESC`,
        [patientId, doctorId]
      );
    } else {
      recordsResult = await query(
        `SELECT * FROM medical_records 
         WHERE patient_id = $1
         ORDER BY created_at DESC`,
        [patientId]
      );
    }
    
    // Decrypt sensitive fields
    const records = recordsResult.rows.map(record => ({
      ...record,
      diagnosis: decrypt(record.diagnosis_encrypted),
      treatmentPlan: record.treatment_plan_encrypted ? decrypt(record.treatment_plan_encrypted) : null,
      // Remove encrypted fields from response
      diagnosis_encrypted: undefined,
      treatment_plan_encrypted: undefined
    }));
    
    // Log PHI access
    await query(
      `INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent)
       VALUES ($1, 'PHI_ACCESSED', 'medical_record', $2, $3, $4)`,
      [req.user.userId, patientId, req.ip, req.get('user-agent')]
    );
    
    res.json({ success: true, records });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve medical records' });
  }
});

export default router;
