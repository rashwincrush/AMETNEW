import toast from 'react-hot-toast';

export function handleSupabaseGuardError(err) {
  // Keep raw error in console for developers
  console.error('[GuardError]', err);
  toast.error('Your profile is not approved. Kindly contact administrator.');
}
