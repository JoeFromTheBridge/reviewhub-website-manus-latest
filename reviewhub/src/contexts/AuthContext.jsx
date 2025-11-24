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

  // Global auth bootstrap loading (used by PrivateRoute)
  const [authLoading, setAuthLoading] = useState(true);

  // UI-only loading for login/register actions
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);
  const [emailVerificationStatus, setEmailVerificationStatus] = useState(null);

  // -------------------------------------------------
  // INITIAL AUTH BOOTSTRAP: Runs once on app load
  // -------------------------------------------------
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('access_token');

      if (token) {
        try {
          const userData = await apiService.getProfile();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          localStorage.removeItem('access_token');
          setUser(null);
        }
      }

      setAuthLoading(false);
    };

    bootstrap();
  }, []);

  // -------------------------------------------------
  // AUTH ACTIONS
  // -------------------------------------------------

  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);

      const response = await apiService.login(credentials);

      localStorage.setItem('access_token', response.access_token);
      setUser(response.user);

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

      localStorage.setItem('access_token', response.access_token);
      setUser(response.user);
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
      localStorage.removeItem('access_token');
      setUser(null);
      setError(null);
      setEmailVerificationStatus(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setError(null);
      const response = await apiService.updateProfile(profileData);
      setUser(response.user);
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

  const clearError = () => setError(null);
  const clearEmailVerificationStatus = () => setEmailVerificationStatus(null);

  const value = {
    user,

    // Exposed for PrivateRoute
    authLoading,

    // UI-only loading
    loading,

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
