/**
 * SECURITY MIDDLEWARE
 * Implements various security controls:
 * - Rate limiting
 * - Input validation
 * - CSRF protection
 * - Request sanitization
 */

import rateLimit from 'express-rate-limit';
import { z } from 'zod';

/**
 * RATE LIMITING - Prevent brute force and DoS attacks
 */

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't count successful requests that return a 2xx status
  skipSuccessfulRequests: false,
  // Skip rate limiting for certain IPs (e.g., health checks)
  skip: (req) => {
    // Add trusted IPs here if needed
    return false;
  }
});

// Stricter rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again in 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful logins
});

// Rate limiter for password reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset requests, please try again later'
  }
});

/**
 * INPUT VALIDATION MIDDLEWARE
 * Uses Zod schemas for type-safe validation
 */

/**
 * Validate request body against a Zod schema
 * @param {z.ZodSchema} schema - Zod validation schema
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      // Parse and validate request body
      const validated = schema.parse(req.body);
      req.body = validated; // Replace with validated data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input data',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request query parameters
 * @param {z.ZodSchema} schema - Zod validation schema
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Validate request route parameters
 * @param {z.ZodSchema} schema - Zod validation schema
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid URL parameters',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * CSRF PROTECTION
 * For cookie-based sessions, we use SameSite=Strict/Lax cookies
 * For additional protection, implement double-submit cookie pattern
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // For state-changing requests, verify CSRF token
  const csrfTokenFromHeader = req.headers['x-csrf-token'];
  const csrfTokenFromCookie = req.cookies?.csrf_token;
  
  // Double-submit cookie pattern: tokens must match
  if (!csrfTokenFromHeader || csrfTokenFromHeader !== csrfTokenFromCookie) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token'
    });
  }
  
  next();
};

/**
 * Generate and set CSRF token
 */
export const generateCsrfToken = (req, res, next) => {
  // Generate random token
  const token = require('crypto').randomBytes(32).toString('hex');
  
  // Set as httpOnly cookie
  res.cookie('csrf_token', token, {
    httpOnly: false, // Needs to be readable by JavaScript for header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Also send in response for client to use in headers
  req.csrfToken = token;
  next();
};

/**
 * Sanitize user input to prevent injection attacks
 * Note: This is a basic sanitizer. For HTML, use DOMPurify on frontend
 */
export const sanitizeInput = (req, res, next) => {
  // Remove any null bytes (can cause issues)
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/\0/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
};

/**
 * Content-Type validation
 * Ensure requests with body have correct Content-Type
 */
export const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        error: 'Content-Type must be application/json'
      });
    }
  }
  next();
};

export default {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  validateBody,
  validateQuery,
  validateParams,
  csrfProtection,
  generateCsrfToken,
  sanitizeInput,
  validateContentType
};
