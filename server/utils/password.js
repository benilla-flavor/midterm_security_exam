/**
 * PASSWORD HASHING UTILITIES
 * Security: bcrypt with cost factor 12 (2^12 iterations)
 * Protects against brute-force attacks through computational cost
 */

import bcrypt from 'bcrypt';

// Cost factor (rounds): 12 is recommended for 2024
// Higher = more secure but slower (exponential)
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    // bcrypt automatically generates salt and includes it in output
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('Password hashing error:', error.message);
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare a password with its hash
 * @param {string} password - Plain text password to verify
 * @param {string} hash - Stored hash to compare against
 * @returns {Promise<boolean>} True if password matches
 */
export const comparePassword = async (password, hash) => {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch;
  } catch (error) {
    console.error('Password comparison error:', error.message);
    throw new Error('Failed to compare password');
  }
};

/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains number
 * - Contains special character
 * @param {string} password
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePasswordStrength = (password) => {
  const errors = [];
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  hashPassword,
  comparePassword,
  validatePasswordStrength
};
