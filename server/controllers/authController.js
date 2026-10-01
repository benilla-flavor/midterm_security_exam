/**
 * AUTHENTICATION CONTROLLER
 * Handles user registration, login, token refresh, and logout
 */

import { query, getClient } from '../database/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } from '../utils/jwt.js';

/**
 * Register a new user (patient or doctor)
 */
export const register = async (req, res) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const {
      email,
      password,
      role,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      specialization,
      licenseNumber
    } = req.body;
    
    // Check if user already exists
    const existingUser = await client.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }
    
    // Hash password
    const passwordHash = await hashPassword(password);
    
    // Create user account
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING user_id, email, role, created_at`,
      [email, passwordHash, role]
    );
    
    const user = userResult.rows[0];
    
    // Create role-specific profile
    if (role === 'patient') {
      await client.query(
        `INSERT INTO patients (user_id, first_name, last_name, date_of_birth, gender, phone)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.user_id, firstName, lastName, dateOfBirth, gender || null, phone || null]
      );
    } else if (role === 'doctor') {
      // Validate doctor-specific fields
      if (!specialization || !licenseNumber) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'Specialization and license number required for doctor registration'
        });
      }
      
      await client.query(
        `INSERT INTO doctors (user_id, first_name, last_name, specialization, license_number, phone)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.user_id, firstName, lastName, specialization, licenseNumber, phone || null]
      );
    }
    
    // Log registration event
    await client.query(
      `INSERT INTO audit_log (user_id, action, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user.user_id,
        'USER_REGISTERED',
        req.ip,
        req.get('user-agent'),
        { role }
      ]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  } finally {
    client.release();
  }
};

/**
 * Login user and issue tokens
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Retrieve user with password hash
    const userResult = await query(
      `SELECT user_id, email, password_hash, role, is_active, 
              failed_login_attempts, locked_until
       FROM users 
       WHERE email = $1`,
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Log failed login attempt
      await query(
        `INSERT INTO audit_log (action, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4)`,
        ['FAILED_LOGIN', req.ip, req.get('user-agent'), { email, reason: 'user_not_found' }]
      );
      
      // Generic error message to prevent user enumeration
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
    
    const user = userResult.rows[0];
    
    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        success: false,
        error: 'Account temporarily locked due to multiple failed login attempts. Try again later.'
      });
    }
    
    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account has been deactivated'
      });
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      // Increment failed login attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const lockUntil = newAttempts >= 5 
        ? new Date(Date.now() + 15 * 60 * 1000) // Lock for 15 minutes after 5 failed attempts
        : null;
      
      await query(
        `UPDATE users 
         SET failed_login_attempts = $1, locked_until = $2
         WHERE user_id = $3`,
        [newAttempts, lockUntil, user.user_id]
      );
      
      // Log failed login
      await query(
        `INSERT INTO audit_log (user_id, action, ip_address, user_agent, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.user_id, 'FAILED_LOGIN', req.ip, req.get('user-agent'), { reason: 'invalid_password', attempts: newAttempts }]
      );
      
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        ...(newAttempts >= 3 && { warning: `${5 - newAttempts} attempts remaining before account lock` })
      });
    }
    
    // Reset failed attempts on successful login
    await query(
      `UPDATE users 
       SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
       WHERE user_id = $1`,
      [user.user_id]
    );
    
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.user_id,
      email: user.email,
      role: user.role
    });
    
    const { token: refreshToken, tokenId } = await generateRefreshToken(user.user_id);
    
    // Set refresh token as httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true, // Cannot be accessed by JavaScript (XSS protection)
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Log successful login
    await query(
      `INSERT INTO audit_log (user_id, action, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [user.user_id, 'LOGIN_SUCCESS', req.ip, req.get('user-agent')]
    );
    
    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'No refresh token provided'
      });
    }
    
    // Verify refresh token
    const decoded = await verifyRefreshToken(refreshToken);
    
    // Get user data
    const userResult = await query(
      'SELECT user_id, email, role, is_active FROM users WHERE user_id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }
    
    const user = userResult.rows[0];
    
    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.user_id,
      email: user.email,
      role: user.role
    });
    
    // Optional: Rotate refresh token (revoke old, issue new)
    // This is a security best practice but can be skipped for simplicity
    // await revokeRefreshToken(decoded.tokenId);
    // const { token: newRefreshToken } = await generateRefreshToken(user.user_id);
    // res.cookie('refresh_token', newRefreshToken, { ... });
    
    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Failed to refresh token'
    });
  }
};

/**
 * Logout user (revoke refresh token)
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (refreshToken) {
      const decoded = await verifyRefreshToken(refreshToken);
      await revokeRefreshToken(decoded.tokenId);
      
      // Log logout
      await query(
        `INSERT INTO audit_log (user_id, action, ip_address, user_agent)
         VALUES ($1, $2, $3, $4)`,
        [decoded.userId, 'LOGOUT', req.ip, req.get('user-agent')]
      );
    }
    
    // Clear refresh token cookie
    res.clearCookie('refresh_token');
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

/**
 * Logout from all devices
 */
export const logoutAll = async (req, res) => {
  try {
    const userId = req.user.userId; // From authenticate middleware
    
    // Revoke all refresh tokens
    await revokeAllUserTokens(userId);
    
    // Clear current refresh token cookie
    res.clearCookie('refresh_token');
    
    // Log event
    await query(
      `INSERT INTO audit_log (user_id, action, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'LOGOUT_ALL_DEVICES', req.ip, req.get('user-agent')]
    );
    
    res.json({
      success: true,
      message: 'Logged out from all devices'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout from all devices'
    });
  }
};

export default {
  register,
  login,
  refresh,
  logout,
  logoutAll
};
