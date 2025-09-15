// Centralized permissions for Groups, aligned with new rules
// Usage: import { PERMISSIONS, can } from '@/lib/permissions';

export const PERMISSIONS = {
  super_admin: { 'groups:create': true,  'groups:approve': true  },
  admin:       { 'groups:create': true,  'groups:approve': true  },
  alumni:      { 'groups:create': true,  'groups:approve': false },
  employer:    { 'groups:create': false, 'groups:approve': false },
  student:     { 'groups:create': false, 'groups:approve': false },
};

export const can = (perm, role, map = PERMISSIONS) => !!(map?.[role]?.[perm]);
