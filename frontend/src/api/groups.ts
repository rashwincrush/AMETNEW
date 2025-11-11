import { supabase } from '../utils/supabase';

/** Create (pending) via SECURITY DEFINER RPC */
type CreateGroupInput = { name: string; description?: string; isPrivate?: boolean; tags?: string[] };
export async function createGroup({ name, description = '', isPrivate = false, tags = [] }: CreateGroupInput) {
  await guardEmployers();
  const { data, error } = await supabase.rpc('create_group_and_add_admin', {
    group_name: name.trim(),
    group_description: (description || '').trim(),
    group_is_private: !!isPrivate,
    group_tags: Array.isArray(tags) ? tags : []
  });
  if (error) throw error;
  return data as string; // group_id
}

/** Load groups visible to the current user (RLS will filter). For non-admins, ensure approved, not archived, and public. */
export async function fetchGroups(options?: { isAdmin?: boolean }) {
  const isAdmin = !!options?.isAdmin || (await isSiteAdmin()).value;
  const { data, error } = await supabase
    .from('groups')
    .select('id,name,description,is_private,is_admin_only_posts,is_archived,is_approved,approval_status,created_by,group_avatar_url,tags,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (isAdmin) return data;
  return (data || []).filter(
    (g: any) => g.is_approved === true && g.is_archived === false && g.is_private === false
  );
}

/** One group + my membership (if any) */
export async function fetchGroup(groupId: string, userId?: string) {
  const [g, m] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    userId
      ? supabase.from('group_members').select('role,status').eq('group_id', groupId).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);
  if (g.error) throw g.error;
  return { group: g.data, myMembership: m.data } as { group: any; myMembership: { role?: 'admin' | 'member'; status?: string } | null };
}

/** Public self-join */
export async function joinPublicGroup(groupId: string, userId: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId, role: 'member', status: 'active' });
  if (error) throw error;
}

/** Private: request to join (creates pending request) */
export async function requestJoinPrivateGroup(groupId: string, userId: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_memberships').insert({ group_id: groupId, user_id: userId, status: 'pending' });
  if (error) throw error;
}

/** Admin: approve/deny a pending request */
export async function decideJoinRequest(id: string, status: 'approved' | 'rejected') {
  const { error } = await supabase.from('group_memberships').update({ status }).eq('id', id);
  if (error) throw error;
}

/** Admin/Group-admin: invite/add member directly */
export async function addMember(groupId: string, userId: string, role: 'member' | 'admin' = 'member') {
  await guardEmployers();
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId, role, status: 'active' });
  if (error) throw error;
}

/** Leave group (self) */
export async function leaveGroup(groupId: string, userId: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw error; // may throw "Each group must have at least one active admin"
}

/** Promote/Demote (admin or group-admin) */
export async function setMemberRole(groupId: string, userId: string, role: 'member' | 'admin') {
  await guardEmployers();
  const { error } = await supabase.from('group_members').update({ role }).eq('group_id', groupId).eq('user_id', userId);
  if (error) throw error;
}

/** Toggle admin-only posts (creator/group-admin/site-admin) */
export async function setAdminOnlyPosts(groupId: string, on: boolean) {
  await guardEmployers();
  const { error } = await supabase.from('groups').update({ is_admin_only_posts: on }).eq('id', groupId);
  if (error) throw error;
}

/** Archive/unarchive (site admin OR group admin) */
export async function setArchived(groupId: string, on: boolean) {
  await guardEmployers();
  const { error } = await supabase.from('groups').update({ is_archived: on }).eq('id', groupId);
  if (error) throw error;
}

/** Approve (site admin only) */
export async function approveGroup(groupId: string) {
  const { error } = await supabase.from('groups').update({ is_approved: true, approval_status: 'approved' }).eq('id', groupId);
  if (error) throw error;
}

/** Posts (respect admin-only + archived in UI; RLS enforces anyway) */
export async function createPost(groupId: string, content: string, userId: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_posts').insert({ group_id: groupId, user_id: userId, content, status: 'approved' });
  if (error) throw error;
}
export async function updatePost(postId: string, content: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_posts').update({ content }).eq('id', postId);
  if (error) throw error;
}
export async function deletePost(postId: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_posts').delete().eq('id', postId);
  if (error) throw error;
}

/** Comments: use group_comments (canonical) */
export async function createComment(postId: string, groupId: string, content: string, userId: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_comments').insert({ post_id: postId, group_id: groupId, user_id: userId, content });
  if (error) throw error;
}
export async function updateComment(id: string, content: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_comments').update({ content }).eq('id', id);
  if (error) throw error;
}
export async function deleteComment(id: string) {
  await guardEmployers();
  const { error } = await supabase.from('group_comments').delete().eq('id', id);
  if (error) throw error;
}

/** Moderation RPCs */
export async function joinGroupV2(groupId: string): Promise<'active' | 'pending'> {
  await guardEmployers();
  const { data, error } = await supabase.rpc('join_group_v2', { p_group_id: groupId });
  if (error) throw error;
  return (data as any) as 'active' | 'pending';
}

export async function inviteMemberByEmail(groupId: string, email: string) {
  const { error } = await supabase.rpc('invite_member_by_email', { p_group_id: groupId, p_email: email.toLowerCase() });
  if (error) throw error;
}

export async function listPendingMembers(groupId: string): Promise<Array<{ user_id: string; requested_at: string }>> {
  const { data, error } = await supabase.rpc('list_pending_members', { p_group_id: groupId });
  if (error) throw error;
  return (data as any) || [];
}

export async function approveGroupMember(groupId: string, userId: string) {
  const { error } = await supabase.rpc('approve_group_member', { p_group_id: groupId, p_user_id: userId });
  if (error) throw error;
}

export async function rejectGroupMember(groupId: string, userId: string) {
  const { error } = await supabase.rpc('reject_group_member', { p_group_id: groupId, p_user_id: userId });
  if (error) throw error;
}

export async function setMemberRoleRpc(groupId: string, userId: string, role: 'member' | 'admin') {
  const { error } = await supabase.rpc('set_member_role', { p_group_id: groupId, p_user_id: userId, p_role: role });
  if (error) throw error;
}

export async function removeMemberRpc(groupId: string, userId: string) {
  const { error } = await supabase.rpc('remove_member', { p_group_id: groupId, p_user_id: userId });
  if (error) throw error;
}

export async function leaveGroupRpc(groupId: string) {
  const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
  if (error) throw error;
}

// Helpers
async function getMyRole(): Promise<'alumni' | 'employer' | 'admin' | 'super_admin' | null> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;
  const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  return (data?.role as any) || null;
}

async function isSiteAdmin() {
  const role = await getMyRole();
  return { value: role === 'admin' || role === 'super_admin', role };
}

async function guardEmployers(explicitRole?: string) {
  const role = explicitRole || (await getMyRole());
  if (role === 'employer') {
    const err: any = new Error('Employers cannot perform this action.');
    err.code = 'EMPLOYER_POLICY';
    throw err;
  }
}
