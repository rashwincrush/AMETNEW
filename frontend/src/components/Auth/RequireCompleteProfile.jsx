import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApproval } from '../../hooks/useApproval';

export default function RequireCompleteProfile({ children, enforceApproval = true }) {
  const { user, profile, loading: authLoading } = useAuth();
  const location = useLocation();
  const { loading: approvalLoading, isPending, isRejected, isFullyApproved } = useApproval();

  const loading = authLoading || approvalLoading;

  if (loading) return null; // let app-level spinner render
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // If approval enforcement is disabled, allow access
  if (!enforceApproval) return children;

  // Check rejection first - redirect to rejection page
  if (isRejected) {
    return <Navigate to="/rejection" replace />;
  }

  // Check pending approval - redirect to pending page
  if (isPending) {
    return <Navigate to="/pending-approval" replace />;
  }

  // Check if profile is fully approved and complete
  if (!isFullyApproved) {
    // Redirect to profile completion if not complete
    return (
      <Navigate
        to="/profile-completion"
        replace
        state={{ from: location.pathname, message: 'Please complete your profile to continue.' }}
      />
    );
  }

  return children;
}
