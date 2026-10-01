/**
 * PATIENT ROUTES
 * Endpoints for patient profile management
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/db.js';

const router = express.Router();

// All patient routes require authentication
router.use(authenticate);

/**
 * GET /api/patients/profile
 * Get current patient's profile
 */
router.get('/profile', authorize(['patient']), async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, u.email 
       FROM patients p
       JOIN users u ON p.user_id = u.user_id
       WHERE p.user_id = $1`,
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

/**
 * PUT /api/patients/profile
 * Update current patient's profile
 */
router.put('/profile', authorize(['patient']), async (req, res) => {
  try {
    const { firstName, lastName, phone, address, emergencyContactName, emergencyContactPhone } = req.body;
    
    const result = await query(
      `UPDATE patients 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           emergency_contact_name = COALESCE($5, emergency_contact_name),
           emergency_contact_phone = COALESCE($6, emergency_contact_phone),
           updated_at = NOW()
       WHERE user_id = $7
       RETURNING *`,
      [firstName, lastName, phone, address, emergencyContactName, emergencyContactPhone, req.user.userId]
    );
    
    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

export default router;
