/**
 * ADMIN ROUTES
 * Endpoints for administrative functions
 */

import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../database/db.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', async (req, res) => {
  try {
    const result = await query(
      `SELECT user_id, email, role, is_active, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );
    
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
});

/**
 * GET /api/admin/audit-log
 * Get security audit logs
 */
router.get('/audit-log', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await query(
      `SELECT * FROM audit_log
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.json({ success: true, logs: result.rows });
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve audit log' });
  }
});

/**
 * PATCH /api/admin/users/:userId/status
 * Activate/deactivate user account
 */
router.patch('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    
    const result = await query(
      `UPDATE users 
       SET is_active = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING user_id, email, role, is_active`,
      [isActive, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    await query(
      `INSERT INTO audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
       VALUES ($1, 'USER_STATUS_CHANGED', 'user', $2, $3, $4, $5)`,
      [req.user.userId, userId, req.ip, req.get('user-agent'), { isActive }]
    );
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user status' });
  }
});

export default router;
