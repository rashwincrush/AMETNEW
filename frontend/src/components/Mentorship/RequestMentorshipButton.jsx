import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useApproval } from '../../hooks/useApproval';
import { handleSupabaseGuardError } from '../../utils/mapSupabaseErrorToToast';
import toast from 'react-hot-toast';

export default function RequestMentorshipButton({ mentorId, disabled = false }) {
  const { loading, isApprovedMentee } = useApproval();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (!isApprovedMentee) {
      toast.error('Your profile is not approved. Kindly contact administrator.');
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
        handleSupabaseGuardError(error);
        return;
      }

      toast.success('Request sent!');
    } catch (err) {
      handleSupabaseGuardError(err);
    } finally {
      setBusy(false);
    }
  };

  const isDisabled = loading || busy || !isApprovedMentee || !!disabled;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      title={!isApprovedMentee ? 'Your profile is not approved. Kindly contact administrator.' : (disabled ? 'This mentor isn’t accepting requests right now.' : 'Request mentorship')}
      className={`flex-1 btn-ocean py-2 px-3 rounded text-sm ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {busy ? 'Sending…' : 'Request Mentorship'}
    </button>
  );
}
