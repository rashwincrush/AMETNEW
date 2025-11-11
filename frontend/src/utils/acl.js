export const canCreateGroup = (role) =>
  role === 'alumni' || role === 'admin' || role === 'super_admin';

export const isSiteAdmin = (role) =>
  role === 'admin' || role === 'super_admin';

// Legacy signature kept for compatibility
export const canManageGroupLegacy = (
  me = {},
  group = {},
  myMembership = {}
) => isSiteAdmin(me?.role) || group?.created_by === me?.id || myMembership?.role === 'admin';

// New helpers for Groups authorization
export const isGroupAdmin = (m) =>
  !!m && (m.status === 'active' || m.status === undefined) && (m.role === 'admin' || m.role === 'owner');

// New signature: (isSiteAdminFlag, isCreator, membership)
export const canManageGroup = (isSiteAdminFlag, isCreator, m) =>
  !!isSiteAdminFlag || !!isCreator || isGroupAdmin(m);

export const canPostToGroup = (group = {}, isSiteAdminFlag = false, m) => {
  if (group?.is_archived) return false;
  if (group?.is_admin_only_posts) return !!isSiteAdminFlag || isGroupAdmin(m);
  return !!m; // members can post otherwise
};

// Single source of truth for comment composer eligibility (JS)
export const canCommentOnGroup = (group = {}, role, isMember) => {
  if (!role || role === 'employer') return false;
  if (role === 'admin' || role === 'super_admin') return true;
  return group?.is_private ? !!isMember : role === 'alumni';
};
