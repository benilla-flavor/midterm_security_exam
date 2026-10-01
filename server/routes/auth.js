/**
 * AUTHENTICATION ROUTES
 * Public endpoints for user registration and authentication
 */

import express from 'express';
import { register, login, refresh, logout, logoutAll } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { validateBody } from '../middleware/security.js';
import { registerSchema, loginSchema } from '../middleware/validation-schemas.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user (patient or doctor)
 * Public endpoint with rate limiting
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  register
);

/**
 * POST /api/auth/login
 * Login with email and password
 * Public endpoint with strict rate limiting
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  login
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token from cookie
 * Public endpoint (authenticated via cookie)
 */
router.post('/refresh', refresh);

/**
 * POST /api/auth/logout
 * Logout current session (revoke refresh token)
 * Public endpoint
 */
router.post('/logout', logout);

/**
 * POST /api/auth/logout-all
 * Logout from all devices (revoke all refresh tokens)
 * Protected endpoint - requires authentication
 */
router.post('/logout-all', authenticate, logoutAll);

/**
 * GET /api/auth/me
 * Get current user info
 * Protected endpoint
 */
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

export default router;
