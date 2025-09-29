import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function AdminRoute({ children }) {
  const { currentUser } = useAuth();
  
  // Check if user exists and has admin role
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
}

export default AdminRoute;