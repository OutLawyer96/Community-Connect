import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../config/axios';
import API_CONFIG from '../config/api';

const AuthContext = createContext({});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on app start
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await apiClient.get(API_CONFIG.ENDPOINTS.DASHBOARD);
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Only logout on 401 errors (unauthorized), not other errors
        if (error.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.LOGIN, {
        username,
        password
      });
      
      const { user, token: authToken } = response.data;
      setCurrentUser(user);
      setToken(authToken);
      localStorage.setItem('authToken', authToken);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, userData);
      
      const { user, token: authToken } = response.data;
      setCurrentUser(user);
      setToken(authToken);
      localStorage.setItem('authToken', authToken);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('authToken');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      let response;
      
      // Check if profileData contains file uploads
      if (profileData instanceof FormData) {
        response = await apiClient.patch(
          API_CONFIG.ENDPOINTS.PROFILE,
          profileData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
      } else {
        response = await apiClient.patch(
          API_CONFIG.ENDPOINTS.PROFILE,
          profileData
        );
      }
      
      // Update current user data
      setCurrentUser(response.data);
      
      return { success: true, user: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Profile update failed',
        errors: error.response?.data // Include field-specific errors
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.DASHBOARD);
      setCurrentUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Error refreshing user data:', error);
      // Only logout on 401 errors
      if (error.response?.status === 401) {
        logout();
      }
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to refresh user data' 
      };
    }
  };

  const value = {
    currentUser,
    token,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}