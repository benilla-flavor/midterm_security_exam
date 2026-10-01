/**
 * AUTHENTICATION & AUTHORIZATION MIDDLEWARE
 * Security: Server-side enforcement of access control
 * NEVER trust client-side checks alone
 */

import { verifyAccessToken } from '../utils/jwt.js';
import { query } from '../database/db.js';

/**
 * Authenticate request using JWT access token
 * Extracts token from Authorization header
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const decoded = verifyAccessToken(token);
    
    // Check if user still exists and is active
    const userResult = await query(
      'SELECT user_id, email, role, is_active FROM users WHERE user_id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }
    
    // Attach user info to request for downstream middleware/controllers
    req.user = {
      userId: user.user_id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    // Log failed authentication attempt
    await logSecurityEvent('FAILED_AUTH', req, null, error.message);
    
    return res.status(401).json({
      success: false,
      error: error.message || 'Invalid or expired token'
    });
  }
};

/**
 * Authorize based on user role
 * Usage: authorize(['admin', 'doctor'])
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      // Log unauthorized access attempt
      logSecurityEvent('ACCESS_DENIED', req, null, 
        `User with role ${req.user.role} attempted to access ${req.path}`
      );
      
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

/**
 * Check if user owns the resource (for patient/doctor self-access)
 * @param {string} paramName - Name of route parameter containing resource ID
 * @param {string} userType - 'patient' or 'doctor'
 */
export const checkResourceOwnership = (paramName, userType) => {
  return async (req, res, next) => {
    const resourceId = req.params[paramName];
    const userId = req.user.userId;
    
    try {
      let result;
      
      if (userType === 'patient') {
        result = await query(
          'SELECT patient_id FROM patients WHERE patient_id = $1 AND user_id = $2',
          [resourceId, userId]
        );
      } else if (userType === 'doctor') {
        result = await query(
          'SELECT doctor_id FROM doctors WHERE doctor_id = $1 AND user_id = $2',
          [resourceId, userId]
        );
      }
      
      // Admin can access any resource
      if (req.user.role === 'admin' || result.rows.length > 0) {
        next();
      } else {
        await logSecurityEvent('ACCESS_DENIED', req, resourceId,
          `User attempted to access resource they don't own`
        );
        
        return res.status(403).json({
          success: false,
          error: 'Access denied to this resource'
        });
      }
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify resource ownership'
      });
    }
  };
};

/**
 * Log security events to audit log
 */
const logSecurityEvent = async (action, req, resourceId, details) => {
  try {
    await query(
      `INSERT INTO audit_log (user_id, action, resource_id, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user?.userId || null,
        action,
        resourceId,
        req.ip,
        req.get('user-agent'),
        { message: details }
      ]
    );
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export default {
  authenticate,
  authorize,
  checkResourceOwnership
};
