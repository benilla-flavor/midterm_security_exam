/**
 * AUTHENTICATION CONTEXT
 * Security Features:
 * - Access token stored in memory (NOT localStorage - XSS protection)
 * - Refresh token handled via httpOnly cookies
 * - Automatic token refresh
 * - CSRF token management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    try {
      // Try to get user info using existing session
      const response = await api.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      // Try to refresh token
      try {
        const refreshResponse = await api.post('/auth/refresh');
        if (refreshResponse.data.success) {
          setAccessToken(refreshResponse.data.accessToken);
          const userResponse = await api.get('/auth/me');
          setUser(userResponse.data.user);
        }
      } catch (refreshError) {
        // Not authenticated
        setUser(null);
        setAccessToken(null);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        setAccessToken(response.data.accessToken);
        setUser(response.data.user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };
  
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data.success) {
        return { success: true };
      }
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
      setAccessToken(null);
    }
  };
  
  const value = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout
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
