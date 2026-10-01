/**
 * JWT TOKEN UTILITIES
 * Security Implementation:
 * - Access Token: Short-lived (15 minutes), stored in memory
 * - Refresh Token: Long-lived (7 days), stored in httpOnly cookie
 * - Separate secrets for each token type
 * - Token rotation on refresh
 * - Revocation support via database
 */

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { query } from '../database/db.js';
import { hash } from './encryption.js';

dotenv.config();

// Validate JWT secrets exist and are strong
if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate access token (short-lived)
 * @param {Object} payload - User data (userId, email, role)
 * @returns {string} JWT access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
    issuer: 'secure-clinic-system',
    audience: 'clinic-api'
  });
};

/**
 * Generate refresh token (long-lived) and store in database
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { token, tokenId }
 */
export const generateRefreshToken = async (userId) => {
  const payload = { userId };
  const token = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
    issuer: 'secure-clinic-system',
    audience: 'clinic-api'
  });
  
  // Store hashed token in database for revocation capability
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING token_id`,
    [userId, tokenHash, expiresAt]
  );
  
  return {
    token,
    tokenId: result.rows[0].token_id
  };
};

/**
 * Verify access token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyAccessToken = (token) => {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET, {
      issuer: 'secure-clinic-system',
      audience: 'clinic-api'
    });
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Access token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Verify refresh token and check if revoked
 * @param {string} token - JWT refresh token
 * @returns {Promise<Object>} Decoded payload with tokenId
 * @throws {Error} If token is invalid, expired, or revoked
 */
export const verifyRefreshToken = async (token) => {
  try {
    // First verify JWT signature and expiration
    const decoded = jwt.verify(token, REFRESH_SECRET, {
      issuer: 'secure-clinic-system',
      audience: 'clinic-api'
    });
    
    // Check if token exists in database and is not revoked
    const tokenHash = hash(token);
    const result = await query(
      `SELECT token_id, user_id, revoked_at 
       FROM refresh_tokens 
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Refresh token not found or expired');
    }
    
    const tokenRecord = result.rows[0];
    
    if (tokenRecord.revoked_at) {
      throw new Error('Refresh token has been revoked');
    }
    
    return {
      ...decoded,
      tokenId: tokenRecord.token_id
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Revoke a refresh token
 * @param {string} tokenId - Token ID from database
 */
export const revokeRefreshToken = async (tokenId) => {
  await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW() 
     WHERE token_id = $1`,
    [tokenId]
  );
};

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 * @param {string} userId - User ID
 */
export const revokeAllUserTokens = async (userId) => {
  await query(
    `UPDATE refresh_tokens 
     SET revoked_at = NOW() 
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
};

/**
 * Clean up expired tokens (run periodically)
 */
export const cleanupExpiredTokens = async () => {
  const result = await query(
    `DELETE FROM refresh_tokens 
     WHERE expires_at < NOW() - INTERVAL '30 days'`
  );
  
  console.log(`Cleaned up ${result.rowCount} expired tokens`);
};

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  cleanupExpiredTokens
};
