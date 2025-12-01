import React, { useState } from 'react';
import { useApproval } from '../../hooks/useApproval';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useCreateMentorshipRequest } from '../../hooks/useMentorshipMutations';

export default function RequestMentorshipButton({
  mentorId,
  disabled = false,
  requested = false,
  requestStatus = null,
  disabledReason,
  onSuccess,
}) {
  const { loading, isApprovedMentee } = useApproval();
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const createMutation = useCreateMentorshipRequest();

  const isOwnerMentor = !!user && !!mentorId && user.id === mentorId;

  const onClick = async () => {
    if (!isApprovedMentee) {
      toast.error('Your profile is not approved. Kindly contact administrator.');
      return;
    }
    if (requested) return; // already requested
    if (isOwnerMentor) {
      toast.error("You can’t join your own mentorship as a mentee.");
      return;
    }
    try {
      setBusy(true);
      // RPC handles auth, eligibility, capacity, and duplicate checks server-side
      await createMutation.mutateAsync({ mentorId });

      toast.success('Request sent!');
      // Emit global event so other screens (Mentorship.js) can refresh
      window.dispatchEvent(
        new CustomEvent('mentorship:request:created', {
          detail: { mentorId, menteeId: user?.id },
        })
      );
      if (typeof onSuccess === 'function') {
        onSuccess({ mentorId, menteeId: user?.id });
      }
    } catch (err) {
      // Error toasts are already handled inside the mutation via mapMentorshipError
    } finally {
      setBusy(false);
    }
  };

  const activeStatus = requestStatus || (requested ? 'pending' : null);
  const hasOpenRequest = activeStatus === 'pending' || activeStatus === 'accepted';
  const isDisabled = loading || busy || !isApprovedMentee || !!disabled || hasOpenRequest;

  return (
    isOwnerMentor ? (
      <div className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold">
        <svg
          className="w-3.5 h-3.5 mr-1.5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879A1 1 0 006.293 10.293l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>You are the mentor for this program</span>
      </div>
    ) : (
      <button
        onClick={onClick}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        title={
          !isApprovedMentee
            ? 'Your profile is not approved. Kindly contact administrator.'
            : activeStatus === 'accepted'
              ? 'Request accepted'
              : activeStatus === 'pending'
                ? 'Request pending'
                : disabled && disabledReason
                  ? disabledReason
                  : disabled
                    ? 'This mentor isn’t accepting requests right now.'
                    : 'Request mentorship'
        }
        className={`flex-1 btn-ocean py-2 px-3 rounded text-sm ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {activeStatus === 'accepted'
          ? 'Request Accepted'
          : activeStatus === 'pending'
            ? 'Request pending'
            : (busy ? 'Sending…' : 'Request Mentorship')}
      </button>
    )
  );
}
