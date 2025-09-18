import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AdminRoute Component
 * Protects admin-only routes and redirects unauthorized users
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and has admin privileges
  const isAdmin = user && (user.is_staff || user.is_superuser);

  if (!user) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location, message: 'Please log in to access this page' }} replace />;
  }

  if (!isAdmin) {
    // Redirect to dashboard with access denied message
    return <Navigate to="/dashboard" state={{ message: 'Access denied. Admin privileges required.' }} replace />;
  }

  return children;
};

export default AdminRoute;