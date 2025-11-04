import toast from 'react-hot-toast';
import logger from './logger';

// Deduped error toast with a stable id
export function mapSupabaseErrorToToast(err, fallbackMessage = 'Something went wrong') {
  const raw = String(err?.message || err?.error_description || fallbackMessage || 'Error');
  const msg = raw.slice(0, 256);
  logger.error('[SupabaseError]', msg);
  toast.dismiss('supabase-error');
  toast.error(msg, { id: 'supabase-error' });
}

// Back-compat helper used in guard flows
export function handleSupabaseGuardError(err) {
  const msg = String(err?.message || 'Guard error').slice(0, 256);
  logger.error('[GuardError]', msg);
  toast.dismiss('supabase-guard');
  toast.error('Your profile is not approved. Kindly contact administrator.', { id: 'supabase-guard' });
}
