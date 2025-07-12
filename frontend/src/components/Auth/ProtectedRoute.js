import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, getUserRole, loading } = useAuth();
  const location = useLocation();
  const userRole = getUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg mb-4 mx-auto animate-pulse">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div className="text-gray-600 text-lg mb-2">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" state={{ from: location, error: 'unauthorized' }} replace />;
  }

  return children;
};

export default ProtectedRoute;
