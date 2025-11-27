import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Unified frontend approval engine
// Derives approval + profile completeness state from the current user's profile
export function useApproval() {
  const {
    user,
    profile,
    loading,
    getUserRole,
    hasPermission,
    approvalStatus: ctxApprovalStatus,
    isApproved: ctxIsApproved,
    isPending: ctxIsPending,
    isRejected: ctxIsRejected,
    isAdminLike: isAdminLikeFlag,
  } = useAuth();

  const state = useMemo(() => {
    const baseProfile = profile || null;
    const role = (getUserRole ? getUserRole() : baseProfile?.role || '').toLowerCase();

    // Treat admin / super_admin as always approved in the UI
    const isAdminLikeRole = isAdminLikeFlag || role === 'admin' || role === 'super_admin';

    // Prefer AuthContext's canonical approval status, fall back to profile
    const approvalStatus =
      ctxApprovalStatus ??
      baseProfile?.approval_status ??
      null;

    // Use AuthContext booleans when available, but enforce admin bypass
    const isApproved = isAdminLikeRole
      ? true
      : (ctxIsApproved ?? (approvalStatus === 'approved'));

    const isRejected = isAdminLikeRole
      ? false
      : (ctxIsRejected ?? (approvalStatus === 'rejected'));

    const isPending = isAdminLikeRole
      ? false
      : (ctxIsPending ?? (!isRejected && !isApproved));

    // Profile completeness
    const isProfileComplete =
      !!baseProfile?.degree_code &&
      !!baseProfile?.department_id &&
      !!baseProfile?.expected_graduation_year;

    const isFullyApproved = !!isApproved && isProfileComplete;

    // Legacy convenience flags (preserved for existing callers)
    const isMentor = role === 'mentor' || (hasPermission ? hasPermission('manage:mentor_profile') : false);
    const isMentee =
      role === 'mentee' ||
      role === 'student' ||
      role === 'alumni' ||
      (hasPermission ? hasPermission('request:mentorship') : false);
    const isEmployer = role === 'employer' || (hasPermission ? hasPermission('post:jobs') : false);

    return {
      // Core unified shape
      loading: loading || (!user && !baseProfile),
      profile: baseProfile,
      approvalStatus,
      isPending,
      isApproved,
      isRejected,
      isProfileComplete,
      isFullyApproved,
      // Backwards-compatible fields
      isMentor,
      isMentee,
      isEmployer,
      isApprovedMentor: isMentor && isFullyApproved,
      isApprovedMentee: isMentee && isFullyApproved,
      isApprovedEmployer: isEmployer && isFullyApproved,
    };
  }, [
    user,
    profile,
    loading,
    getUserRole,
    hasPermission,
    ctxApprovalStatus,
    ctxIsApproved,
    ctxIsPending,
    ctxIsRejected,
    isAdminLikeFlag,
  ]);

  return state;
}
