export type AppRole = 'alumni' | 'employer' | 'admin' | 'super_admin';

export const canCreateGroup = (role?: AppRole) =>
  role === 'alumni' || role === 'admin' || role === 'super_admin';

export const isSiteAdmin = (role?: AppRole) =>
  role === 'admin' || role === 'super_admin';

export const canManageGroup = (
  me: { id?: string; role?: AppRole },
  group: any,
  myMembership?: { role?: 'admin' | 'member' }
) =>
  isSiteAdmin(me?.role) || group?.created_by === me?.id || myMembership?.role === 'admin';
