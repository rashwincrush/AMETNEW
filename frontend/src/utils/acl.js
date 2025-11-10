export const canCreateGroup = (role) =>
  role === 'alumni' || role === 'admin' || role === 'super_admin';

export const isSiteAdmin = (role) =>
  role === 'admin' || role === 'super_admin';

export const canManageGroup = (
  me = {},
  group = {},
  myMembership = {}
) =>
  isSiteAdmin(me?.role) || group?.created_by === me?.id || myMembership?.role === 'admin';
