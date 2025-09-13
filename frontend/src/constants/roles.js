// Deprecated: prefer importing from `src/lib/roles` directly.
// Kept for backward compatibility to avoid import churn across the app.
import { ROLE_OPTIONS, isRole as _isRole } from '../lib/roles';

export const ROLES = ROLE_OPTIONS.map(r => r.value);
export const isRole = (v) => _isRole(v);
