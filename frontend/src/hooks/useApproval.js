import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Centralized approval/role status using AuthContext profile + approvalFlags
export function useApproval() {
  const { user, profile, getUserRole, hasPermission, approvalFlags } = useAuth();

  const state = useMemo(() => {
    const role = (getUserRole ? getUserRole() : profile?.role || '').toLowerCase();

    // Fallback status from profile for resilience
    const fallbackApprovalStatus =
      profile?.alumni_verification_status ||
      profile?.approval_status ||
      (profile?.is_approved ? 'approved' : 'pending');

    const approvalStatus = approvalFlags?.approvalStatus || fallbackApprovalStatus || 'pending';

    const fallbackIsApproved =
      profile?.alumni_verification_status === 'approved' ||
      profile?.approval_status === 'approved' ||
      profile?.is_approved === true;

    // Global full-approval flag is the primary source of truth
    const isGloballyApproved = approvalFlags?.isFullyApproved ?? fallbackIsApproved;

    const isMentor = role === 'mentor' || (hasPermission ? hasPermission('manage:mentor_profile') : false);
    const isMentee =
      role === 'mentee' ||
      role === 'student' ||
      role === 'alumni' ||
      (hasPermission ? hasPermission('request:mentorship') : false);
    const isEmployer = role === 'employer' || (hasPermission ? hasPermission('post:jobs') : false);

    // Prefer granular statuses when present, otherwise fall back to global status
    const menteeStatus = profile?.mentee_status || (isMentee ? approvalStatus : undefined);
    const mentorStatus = profile?.mentor_status || (isMentor ? approvalStatus : undefined);
    const employerStatus = profile?.employer_status || (isEmployer ? approvalStatus : undefined);

    return {
      loading: !user && !profile, // basic heuristic; our app mounts profile early
      profile: profile || null,
      isApproved: !!isGloballyApproved,
      isMentor,
      isMentee,
      isEmployer,
      // Mentor must be globally approved and (optionally) have mentor_status === 'approved'
      isApprovedMentor: isMentor && !!isGloballyApproved && (mentorStatus ? mentorStatus === 'approved' : true),
      // Mentee must be globally approved (students/alumni included) and (optionally) mentee_status === 'approved'
      isApprovedMentee: isMentee && !!isGloballyApproved && (menteeStatus ? menteeStatus === 'approved' : true),
      // Employer must be globally approved and (optionally) employer_status === 'approved'
      isApprovedEmployer: isEmployer && !!isGloballyApproved && (employerStatus ? employerStatus === 'approved' : true),
    };
  }, [user, profile, getUserRole, approvalFlags, hasPermission]);

  return state;
}
