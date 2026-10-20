/**
 * AUTHENTICATION CONTEXT
 * Security Features:
 * - Access token stored in memory (NOT localStorage - XSS protection)
 * - Refresh token handled via httpOnly cookies
 * - Session restored on reload by exchanging the httpOnly refresh cookie
 *   for a fresh in-memory access token (the token itself never touches storage)
 * - An unfinished booking slip is held in memory only, never in browser storage,
 *   because its "reason for visit" can contain health information
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingBooking, setPendingBooking] = useState(null);

  const applyToken = (token) => {
    setAccessToken(token);
    window.accessToken = token;
  };

  // Restore the session from the httpOnly refresh cookie, if one exists.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      try {
        const refreshResponse = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        if (!refreshResponse.data.success) return;
        applyToken(refreshResponse.data.accessToken);
        const me = await api.get('/auth/me');
        if (!cancelled && me.data.success) setUser(me.data.user);
      } catch {
        // No valid refresh cookie: stay signed out.
        applyToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        applyToken(response.data.accessToken);
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        error: error.response?.data?.error || 'Login failed',
        warning: error.response?.data?.warning
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
        details: error.response?.data?.details
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      applyToken(null);
      setPendingBooking(null);
    }
  };

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all');
    } finally {
      setUser(null);
      applyToken(null);
      setPendingBooking(null);
    }
  };

  const value = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    logoutAll,
    pendingBooking,
    setPendingBooking
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
