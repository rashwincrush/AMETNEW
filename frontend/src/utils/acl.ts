export type AppRole = 'alumni' | 'employer' | 'admin' | 'super_admin';

export const canCreateGroup = (role?: AppRole) =>
  role === 'alumni' || role === 'admin' || role === 'super_admin';

export const isSiteAdmin = (role?: AppRole) =>
  role === 'admin' || role === 'super_admin';

export const canManageGroupLegacy = (
  me: { id?: string; role?: AppRole },
  group: any,
  myMembership?: { role?: 'admin' | 'member' }
) =>
  isSiteAdmin(me?.role) || group?.created_by === me?.id || myMembership?.role === 'admin';

// New helpers for Groups authorization
export const isGroupAdmin = (m?: { status?: string; role?: 'admin' | 'owner' | 'member' }) =>
  !!m && (m.status === 'active' || m.status === undefined) && (m.role === 'admin' || m.role === 'owner');

export const canManageGroup = (
  isSiteAdminFlag: boolean,
  isCreator: boolean,
  m?: { status?: string; role?: 'admin' | 'owner' | 'member' }
) => isSiteAdminFlag || isCreator || isGroupAdmin(m);

export const canPostToGroup = (
  group: { is_archived?: boolean; is_admin_only_posts?: boolean },
  isSiteAdminFlag: boolean,
  m?: { status?: string; role?: 'admin' | 'owner' | 'member' }
) => {
  if (group?.is_archived) return false;
  if (group?.is_admin_only_posts) return isSiteAdminFlag || isGroupAdmin(m);
  // Otherwise members can post
  return !!m;
};

// Single source of truth for comment composer eligibility
export const canCommentOnGroup = (
  group: { is_private?: boolean },
  role?: AppRole,
  isMember?: boolean
) => {
  if (!role || role === 'employer') return false;
  if (role === 'admin' || role === 'super_admin') return true;
  return group?.is_private ? !!isMember : role === 'alumni';
};
