import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext({});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const API_BASE_URL = 'http://localhost:8000/api';

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on app start
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/dashboard/`);
        setCurrentUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        logout();
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
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
        username,
        password
      });
      
      const { user, token: authToken } = response.data;
      setCurrentUser(user);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      
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
      const response = await axios.post(`${API_BASE_URL}/auth/register/`, userData);
      
      const { user, token: authToken } = response.data;
      setCurrentUser(user);
      setToken(authToken);
      localStorage.setItem('token', authToken);
      
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
      await axios.post(`${API_BASE_URL}/auth/logout/`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setToken(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const value = {
    currentUser,
    token,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}