/**
 * DATABASE CONNECTION MODULE
 * Security Features:
 * - Uses connection pooling for efficiency
 * - Least-privilege user credentials from environment variables
 * - TLS/SSL enforced for production
 * - Parameterized queries only (no string concatenation)
 * - Connection timeout limits
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Create connection pool with security settings
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER, // Should be 'clinic_app_user', NOT postgres
  password: process.env.DB_PASSWORD,
  
  // Security: Enable SSL/TLS in production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true, // Verify certificate
  } : false,
  
  // Connection pool settings
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Fail fast if connection takes too long
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✓ Database connection established');
});

pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

/**
 * Execute a parameterized query
 * SECURITY: Always use parameterized queries to prevent SQL injection
 * @param {string} text - SQL query with $1, $2, etc. placeholders
 * @param {Array} params - Array of parameter values
 * @returns {Promise<Object>} Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries (potential performance/DoS issue)
    if (duration > 1000) {
      console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error) {
    // Log error but don't expose internal details to client
    console.error('Database query error:', {
      message: error.message,
      code: error.code,
      // Don't log the full query or params in production (might contain sensitive data)
    });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * Use this when you need multiple queries in a transaction
 */
export const getClient = async () => {
  return await pool.connect();
};

/**
 * Test database connection
 */
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, current_user');
    console.log('Database connected:', {
      time: result.rows[0].current_time,
      user: result.rows[0].current_user
    });
    
    // Security check: Ensure we're not connected as superuser
    if (result.rows[0].current_user === 'postgres') {
      console.warn('⚠️  WARNING: Connected as superuser! Use least-privilege user instead.');
    }
    
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return false;
  }
};

/**
 * Graceful shutdown
 */
export const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

export default {
  query,
  getClient,
  testConnection,
  closePool
};
