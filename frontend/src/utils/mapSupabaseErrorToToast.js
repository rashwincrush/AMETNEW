import toast from 'react-hot-toast';

// Deduped error toast with a stable id
export function mapSupabaseErrorToToast(err, fallbackMessage = 'Something went wrong') {
  console.error('[SupabaseError]', err);
  const msg = err?.message || err?.error_description || fallbackMessage;
  toast.dismiss('supabase-error');
  toast.error(msg, { id: 'supabase-error' });
}

// Back-compat helper used in guard flows
export function handleSupabaseGuardError(err) {
  console.error('[GuardError]', err);
  toast.dismiss('supabase-guard');
  toast.error('Your profile is not approved. Kindly contact administrator.', { id: 'supabase-guard' });
}
