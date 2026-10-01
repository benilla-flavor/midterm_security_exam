/**
 * ENCRYPTION UTILITIES
 * Security: AES-256-CBC encryption for sensitive PII data
 * Used for: SSN, medical diagnoses, treatment plans
 */

import CryptoJS from 'crypto-js';
import dotenv from 'dotenv';

dotenv.config();

// Validate encryption key exists and has sufficient length
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters for AES-256');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

/**
 * Encrypt sensitive data
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data (base64 encoded)
 */
export const encrypt = (plaintext) => {
  if (!plaintext) return null;
  
  try {
    const encrypted = CryptoJS.AES.encrypt(plaintext, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt sensitive data
 * @param {string} ciphertext - Encrypted data
 * @returns {string} Decrypted plaintext
 */
export const decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Hash data for comparison (one-way)
 * Used for token comparison without storing plaintext
 * @param {string} data - Data to hash
 * @returns {string} SHA256 hash
 */
export const hash = (data) => {
  return CryptoJS.SHA256(data).toString();
};

export default {
  encrypt,
  decrypt,
  hash
};
