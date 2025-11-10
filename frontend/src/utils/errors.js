// Centralized friendly error message mapping
// Usage: import { getFriendlyErrorMessage } from '../utils/errors';
// toast.error(getFriendlyErrorMessage(err, 'Fallback message'))

export function getFriendlyErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const code = String(err?.code ?? '').toLowerCase();
  const status = String(err?.status ?? '').toLowerCase();
  const msg = String(err?.message ?? '').toLowerCase();

  // PostgREST single-row mismatch (common when an entity becomes hidden/pending)
  if (/json object requested, multiple \(or no\) rows returned/i.test(msg)) {
    return 'This item is currently not available. It may be pending review or archived.';
  }

  // Permission denied
  if (code === '42501' || status === '403' || /permission denied|rls|not allowed|forbidden/i.test(msg)) {
    return "You don't have permission to perform this action.";
  }

  // Duplicate/unique violations
  if (code === '23505' || /duplicate|unique constraint/i.test(msg)) {
    return 'This already exists.';
  }

  // Not found
  if (status === '404' || /not found|no row/i.test(msg)) {
    return 'We could not find what you were looking for.';
  }

  // Network/timeout
  if (/network|fetch failed|timeout|timed out|connection/i.test(msg)) {
    return 'Network error. Please check your connection and try again.';
  }

  // Storage issues (common patterns)
  if (/bucket|storage|upload|download/i.test(msg)) {
    return 'There was a problem handling your file. Please try again.';
  }

  return fallback;
}

export function toFriendlyToast(toast, err, fallback) {
  try {
    const msg = getFriendlyErrorMessage(err, fallback);
    toast.error(msg);
  } catch (_) {
    toast.error(fallback || 'Something went wrong. Please try again.');
  }
}