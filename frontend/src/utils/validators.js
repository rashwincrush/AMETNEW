// Simple validators for URLs and emails. Keep minimal and dependency-free.

/**
 * Validate URL with allowed schemes.
 * @param {string} s
 * @param {string[]} allowedSchemes default ['https','mailto']
 */
export function isValidUrl(s = '', allowedSchemes = ['https', 'mailto']) {
  try {
    const u = new URL(String(s).trim());
    return allowedSchemes.includes(u.protocol.replace(':', ''));
  } catch (_) {
    return false;
  }
}

/**
 * Basic email validation.
 * @param {string} s
 */
export function isValidEmail(s = '') {
  const v = String(s).trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
