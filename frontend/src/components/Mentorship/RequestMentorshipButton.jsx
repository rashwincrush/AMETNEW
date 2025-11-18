import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useApproval } from '../../hooks/useApproval';
import { handleSupabaseGuardError } from '../../utils/mapSupabaseErrorToToast';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RequestMentorshipButton({ mentorId, disabled = false, requested = false, onSuccess }) {
  const { loading, isApprovedMentee } = useApproval();
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

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
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;

      const { error } = await supabase
        .from('mentorship_requests')
        .insert({
          mentor_id: mentorId,
          mentee_id: uid,
          status: 'pending',
        });

      if (error) {
        const msg = String(error?.message || '');
        if (msg.includes('mentorship_requests_no_self_mentee')) {
          toast.error("You can’t join your own mentorship as a mentee.");
        } else {
          handleSupabaseGuardError(error);
        }
        return;
      }

      toast.success('Request sent!');
      // Emit global event so other screens (Mentorship.js) can refresh
      window.dispatchEvent(new CustomEvent('mentorship:request:created', { detail: { mentorId, menteeId: uid } }));
      if (typeof onSuccess === 'function') {
        onSuccess({ mentorId, menteeId: uid });
      }
    } catch (err) {
      handleSupabaseGuardError(err);
    } finally {
      setBusy(false);
    }
  };

  const isDisabled = loading || busy || !isApprovedMentee || !!disabled || !!requested;

  return (
    isOwnerMentor ? (
      <p className="text-xs text-gray-500">You are the mentor for this program.</p>
    ) : (
      <button
        onClick={onClick}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        title={
          !isApprovedMentee
            ? 'Your profile is not approved. Kindly contact administrator.'
            : requested
              ? 'Request pending'
              : (disabled ? 'This mentor isn’t accepting requests right now.' : 'Request mentorship')
        }
        className={`flex-1 btn-ocean py-2 px-3 rounded text-sm ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {requested ? 'Request pending' : (busy ? 'Sending…' : 'Request Mentorship')}
      </button>
    )
  );
}
