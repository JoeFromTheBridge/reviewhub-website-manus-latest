// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // covers initial auth check and auth actions
  const [error, setError] = useState(null);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState(null);

  // Helper: normalize user payloads from different endpoints
  const extractUser = (data) => {
    // Most auth endpoints return { user: {...}, ... }
    if (data && typeof data === 'object' && data.user) {
      return data.user;
    }
    // Fallback: assume the payload itself is the user object
    return data || null;
  };

  // Initial auth check on app load / page refresh
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');

        if (!token) {
          setUser(null);
          return;
        }

        // Use /auth/profile to hydrate the user from the backend
        const profileResponse = await apiService.getProfile();
        const normalizedUser = extractUser(profileResponse);

        if (normalizedUser) {
          setUser(normalizedUser);
        } else {
          // If we failed to get a usable user, clear token to avoid bad state
          localStorage.removeItem('access_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to get user profile on init:', err);
        localStorage.removeItem('access_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.login(credentials);

      // Store token and normalize user data
      localStorage.setItem('access_token', response.access_token);

      const normalizedUser = extractUser(response);
      setUser(normalizedUser);

      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.register(userData);

      // For enhanced registration, don't auto-login until email is verified
      setEmailVerificationStatus('pending');

      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (token) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.verifyEmail(token);

      // Store token and user data after successful verification
      localStorage.setItem('access_token', response.access_token);

      const normalizedUser = extractUser(response);
      setUser(normalizedUser);

      setEmailVerificationStatus('verified');

      return response;
    } catch (error) {
      setError(error.message);
      setEmailVerificationStatus('failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationEmail = async (email) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.resendVerificationEmail(email);
      setEmailVerificationStatus('resent');

      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.forgotPassword(email);

      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.resetPassword(token, newPassword);

      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and token
      localStorage.removeItem('access_token');
      setUser(null);
      setError(null);
      setEmailVerificationStatus(null);
      setLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await apiService.updateProfile(profileData);

      const normalizedUser = extractUser(response);
      setUser(normalizedUser);

      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setError(null);
      return await apiService.changePassword(passwordData);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Optional helper if you ever want to force-refresh user from /auth/profile
  const refreshUserProfile = async () => {
    try {
      const profileResponse = await apiService.getProfile();
      const normalizedUser = extractUser(profileResponse);
      setUser(normalizedUser);
      return normalizedUser;
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const clearEmailVerificationStatus = () => {
    setEmailVerificationStatus(null);
  };

  const value = {
    user,
    loading, // used by PrivateRoute to block /profile, /privacy, /analytics until auth is resolved
    error,
    emailVerificationStatus,
    login,
    register,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    logout,
    updateProfile,
    changePassword,
    refreshUserProfile,
    clearError,
    clearEmailVerificationStatus,
    isAuthenticated: !!user,
    isEmailVerified: user?.email_verified || false,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
