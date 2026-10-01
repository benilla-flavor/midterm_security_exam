/**
 * DOCTOR ROUTES
 * Endpoints for doctor profiles and schedules
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/db.js';

const router = express.Router();

/**
 * GET /api/doctors
 * Get list of all doctors (public)
 */
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT doctor_id, first_name, last_name, specialization, consultation_fee
       FROM doctors
       ORDER BY last_name, first_name`
    );
    
    res.json({ success: true, doctors: result.rows });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve doctors' });
  }
});

/**
 * GET /api/doctors/:doctorId
 * Get specific doctor details
 */
router.get('/:doctorId', async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.email 
       FROM doctors d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.doctor_id = $1`,
      [req.params.doctorId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    
    res.json({ success: true, doctor: result.rows[0] });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve doctor' });
  }
});

/**
 * GET /api/doctors/:doctorId/schedule
 * Get doctor's weekly schedule
 */
router.get('/:doctorId/schedule', async (req, res) => {
  try {
    const result = await query(
      `SELECT schedule_id, day_of_week, start_time, end_time, is_available
       FROM doctor_schedules
       WHERE doctor_id = $1 AND is_available = true
       ORDER BY day_of_week, start_time`,
      [req.params.doctorId]
    );
    
    res.json({ success: true, schedule: result.rows });
  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve schedule' });
  }
});

/**
 * GET /api/doctors/profile (for logged-in doctor)
 * Get own profile
 */
router.get('/me/profile', authenticate, authorize(['doctor']), async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, u.email 
       FROM doctors d
       JOIN users u ON d.user_id = u.user_id
       WHERE d.user_id = $1`,
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve profile' });
  }
});

export default router;
