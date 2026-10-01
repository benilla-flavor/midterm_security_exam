/**
 * APPOINTMENT ROUTES
 * Endpoints for appointment booking and management
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/security.js';
import { createAppointmentSchema, updateAppointmentStatusSchema, appointmentIdParamSchema } from '../middleware/validation-schemas.js';
import { query } from '../database/db.js';

const router = express.Router();

// All appointment routes require authentication
router.use(authenticate);

/**
 * POST /api/appointments
 * Create new appointment (patients only)
 */
router.post(
  '/',
  authorize(['patient']),
  validateBody(createAppointmentSchema),
  async (req, res) => {
    try {
      const { doctorId, appointmentDate, appointmentTime, reasonForVisit } = req.body;
      
      // Get patient ID from user
      const patientResult = await query(
        'SELECT patient_id FROM patients WHERE user_id = $1',
        [req.user.userId]
      );
      
      if (patientResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Patient profile not found' });
      }
      
      const patientId = patientResult.rows[0].patient_id;
      
      // Check if slot is available
      const existingAppt = await query(
        `SELECT appointment_id FROM appointments
         WHERE doctor_id = $1 AND appointment_date = $2 AND appointment_time = $3
         AND status NOT IN ('cancelled')`,
        [doctorId, appointmentDate, appointmentTime]
      );
      
      if (existingAppt.rows.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'This time slot is already booked'
        });
      }
      
      // Create appointment
      const result = await query(
        `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason_for_visit, status)
         VALUES ($1, $2, $3, $4, $5, 'scheduled')
         RETURNING *`,
        [patientId, doctorId, appointmentDate, appointmentTime, reasonForVisit]
      );
      
      res.status(201).json({ success: true, appointment: result.rows[0] });
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({ success: false, error: 'Failed to create appointment' });
    }
  }
);

/**
 * GET /api/appointments
 * Get user's appointments (patients see their own, doctors see theirs)
 */
router.get('/', async (req, res) => {
  try {
    let result;
    
    if (req.user.role === 'patient') {
      // Get patient's appointments
      const patientResult = await query(
        'SELECT patient_id FROM patients WHERE user_id = $1',
        [req.user.userId]
      );
      const patientId = patientResult.rows[0].patient_id;
      
      result = await query(
        `SELECT a.*, 
                d.first_name as doctor_first_name, 
                d.last_name as doctor_last_name,
                d.specialization
         FROM appointments a
         JOIN doctors d ON a.doctor_id = d.doctor_id
         WHERE a.patient_id = $1
         ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
        [patientId]
      );
    } else if (req.user.role === 'doctor') {
      // Get doctor's appointments
      const doctorResult = await query(
        'SELECT doctor_id FROM doctors WHERE user_id = $1',
        [req.user.userId]
      );
      const doctorId = doctorResult.rows[0].doctor_id;
      
      result = await query(
        `SELECT a.*, 
                p.first_name as patient_first_name, 
                p.last_name as patient_last_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         WHERE a.doctor_id = $1
         ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
        [doctorId]
      );
    }
    
    res.json({ success: true, appointments: result.rows });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve appointments' });
  }
});

/**
 * PATCH /api/appointments/:appointmentId/status
 * Update appointment status (doctors and patients can cancel, doctors can mark complete)
 */
router.patch(
  '/:appointmentId/status',
  validateParams(appointmentIdParamSchema),
  validateBody(updateAppointmentStatusSchema),
  async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { status } = req.body;
      
      // Verify user has permission to update this appointment
      const apptResult = await query(
        `SELECT a.*, p.user_id as patient_user_id, d.user_id as doctor_user_id
         FROM appointments a
         JOIN patients p ON a.patient_id = p.patient_id
         JOIN doctors d ON a.doctor_id = d.doctor_id
         WHERE a.appointment_id = $1`,
        [appointmentId]
      );
      
      if (apptResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Appointment not found' });
      }
      
      const appointment = apptResult.rows[0];
      
      // Check permissions
      const isPatient = req.user.userId === appointment.patient_user_id;
      const isDoctor = req.user.userId === appointment.doctor_user_id;
      const isAdmin = req.user.role === 'admin';
      
      if (!isPatient && !isDoctor && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      
      // Patients can only cancel
      if (isPatient && status !== 'cancelled') {
        return res.status(403).json({ success: false, error: 'Patients can only cancel appointments' });
      }
      
      // Update status
      const result = await query(
        `UPDATE appointments 
         SET status = $1, updated_at = NOW()
         WHERE appointment_id = $2
         RETURNING *`,
        [status, appointmentId]
      );
      
      res.json({ success: true, appointment: result.rows[0] });
    } catch (error) {
      console.error('Update appointment error:', error);
      res.status(500).json({ success: false, error: 'Failed to update appointment' });
    }
  }
);

export default router;
