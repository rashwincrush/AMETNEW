import React from 'react';
import { useApproval } from '../../hooks/useApproval';

// Guard component to restrict access based on approval status
export default function ApprovedGuard({
  require = 'approved',
  children,
  fallback = null,
  showBlockedMessage = true,
  skeleton = null,
}) {
  const {
    loading,
    isApproved,
    isApprovedMentor,
    isApprovedMentee,
    isApprovedEmployer,
  } = useApproval();

  if (loading) return skeleton;

  const allowed =
    require === 'approved' ? isApproved :
    require === 'approved-mentor' ? isApprovedMentor :
    require === 'approved-mentee' ? isApprovedMentee :
    require === 'approved-employer' ? isApprovedEmployer :
    false;

  if (!allowed) {
    return fallback ?? (
      <div className="p-4 rounded-md bg-red-50 text-red-700 border border-red-200">
        {showBlockedMessage ? 'Your profile is not approved. Kindly contact administrator.' : null}
      </div>
    );
  }

  return <>{children}</>;
}
