import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Centralized approval/role status using existing AuthContext profile
export function useApproval() {
  const { user, profile, getUserRole } = useAuth();

  const state = useMemo(() => {
    const role = (getUserRole ? getUserRole() : profile?.role || '').toLowerCase();
    const approvalStatus = (profile?.approval_status || (profile?.is_approved ? 'approved' : undefined)) || 'pending';

    const isApproved = approvalStatus === 'approved';
    const isMentor = role === 'mentor';
    const isMentee = role === 'mentee' || role === 'student';
    const isEmployer = role === 'employer';

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
      isApprovedMentor: isMentor && mentorStatus === 'approved' && isApproved,
      isApprovedMentee: isMentee && menteeStatus === 'approved' && isApproved,
      isApprovedEmployer: isEmployer && (employerStatus ? employerStatus === 'approved' : isApproved),
    };
  }, [user, profile, getUserRole]);

  return state;
}
