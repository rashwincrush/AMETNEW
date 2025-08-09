import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredPermission, isSuperAdminOnly }) => {
  const { isAuthenticated, hasPermission, loading, getUserRole } = useAuth();
  const location = useLocation();

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

  if ((requiredPermission && !hasPermission(requiredPermission)) || 
      (isSuperAdminOnly && getUserRole() !== 'super_admin')) {
    // Redirect to the dedicated 'access-denied' page
    return <Navigate to="/access-denied" state={{ from: location.pathname }} replace />;
  }

  return children;
};

export default ProtectedRoute;
