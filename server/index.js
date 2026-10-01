/**
 * SECURE CLINIC APPOINTMENT SYSTEM - MAIN SERVER
 * Web Security Midterm Project
 * 
 * Security features implemented:
 * - Helmet for security headers
 * - CORS with strict allowlist
 * - Rate limiting
 * - Input validation
 * - JWT authentication
 * - CSRF protection
 * - HTTPS enforcement
 * - Request logging (without sensitive data)
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { testConnection } from './database/db.js';
import { apiLimiter, sanitizeInput, validateContentType } from './middleware/security.js';

// Import routes (to be created)
import authRoutes from './routes/auth.js';
import patientRoutes from './routes/patients.js';
import doctorRoutes from './routes/doctors.js';
import appointmentRoutes from './routes/appointments.js';
import medicalRecordRoutes from './routes/medical-records.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * HELMET - Sets various HTTP headers for security
 * - X-Content-Type-Options: nosniff (prevent MIME sniffing)
 * - X-Frame-Options: DENY (prevent clickjacking)
 * - X-XSS-Protection: 1; mode=block (legacy XSS protection)
 * - Strict-Transport-Security (HSTS) - force HTTPS
 * - Content-Security-Policy (CSP) - prevent XSS
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for React (production should use nonce)
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny' // Prevent clickjacking
  },
  noSniff: true, // Prevent MIME sniffing
  xssFilter: true // Enable XSS filter
}));

/**
 * CORS - Control which origins can access the API
 * Security: Never use '*' in production with credentials
 */
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-Total-Count'], // For pagination
  maxAge: 600 // Cache preflight requests for 10 minutes
}));

/**
 * BODY PARSING
 * Limit body size to prevent DoS attacks via large payloads
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * REQUEST LOGGING
 * Security: Don't log sensitive data (passwords, tokens, SSN, etc.)
 */
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, {
  skip: (req) => {
    // Skip logging health check endpoints
    return req.url === '/health' || req.url === '/api/health';
  },
  stream: {
    write: (message) => {
      // Filter out any sensitive data from logs
      const filtered = message.replace(
        /(password|token|authorization|ssn|credit|card)[=:]\s*\S+/gi,
        '$1=[REDACTED]'
      );
      console.log(filtered.trim());
    }
  }
}));

/**
 * CUSTOM SECURITY MIDDLEWARE
 */
app.use(sanitizeInput);
app.use(validateContentType);

/**
 * RATE LIMITING
 * Apply to all API routes
 */
app.use('/api', apiLimiter);

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

/**
 * Global error handler
 * Security: Don't expose internal error details in production
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy violation'
    });
  }
  
  // Generic error response
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const startServer = async () => {
  try {
    // Test database connection
    console.log('Testing database connection...');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`🏥 Secure Clinic System - Server Running`);
      console.log('='.repeat(60));
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Port: ${PORT}`);
      console.log(`HTTPS: ${process.env.NODE_ENV === 'production' ? 'Enforced' : 'Development mode'}`);
      console.log(`CORS Origins: ${allowedOrigins.join(', ')}`);
      console.log('='.repeat(60));
      console.log(`Server ready at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  process.exit(0);
});

startServer();

export default app;
