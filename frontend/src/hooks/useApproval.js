import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Centralized approval/role status using existing AuthContext profile
export function useApproval() {
  const { user, profile, getUserRole, hasPermission } = useAuth();

  const state = useMemo(() => {
    const role = (getUserRole ? getUserRole() : profile?.role || '').toLowerCase();
    const approvalStatus =
      profile?.alumni_verification_status ||
      profile?.approval_status ||
      (profile?.is_approved ? 'approved' : 'pending');

    const isApproved =
      profile?.alumni_verification_status === 'approved' ||
      profile?.approval_status === 'approved' ||
      profile?.is_approved === true;
    const isMentor = role === 'mentor' || (hasPermission ? hasPermission('manage:mentor_profile') : false);
    const isMentee = role === 'mentee' || role === 'student' || role === 'alumni' || (hasPermission ? hasPermission('request:mentorship') : false);
    const isEmployer = role === 'employer' || (hasPermission ? hasPermission('post:jobs') : false);

    // If granular statuses exist on profile, prefer them; otherwise fall back to global approval
    const menteeStatus = profile?.mentee_status || (isMentee ? approvalStatus : undefined);
    const mentorStatus = profile?.mentor_status || (isMentor ? approvalStatus : undefined);
    const employerStatus = profile?.employer_status || (isEmployer ? approvalStatus : undefined);

    return {
      loading: !user && !profile, // basic heuristic; our app mounts profile early
      profile: profile || null,
      isApproved,
      isMentor,
      isMentee,
      isEmployer,
      // If granular statuses are missing, fall back to global approval to avoid false negatives
      isApprovedMentor: isMentor && ((mentorStatus ? mentorStatus === 'approved' : true) && isApproved),
      isApprovedMentee:
        isMentee &&
        (role === 'student' ? isApproved : true),
      isApprovedEmployer: isEmployer && ((employerStatus ? employerStatus === 'approved' : true) && isApproved),
    };
  }, [user, profile, getUserRole]);

  return state;
}
