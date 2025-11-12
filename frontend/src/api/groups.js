import { supabase } from '../utils/supabase';

// Create (pending) via SECURITY DEFINER RPC
export async function createGroup({ name, description = '', isPrivate = false, tags = [] }) {
  const { data, error } = await supabase.rpc('create_group_and_add_admin', {
    group_name: name.trim(),
    group_description: (description || '').trim(),
    group_is_private: !!isPrivate,
    group_tags: Array.isArray(tags) ? tags : 
      (tags || '').split(',').map(t => t.trim()).filter(Boolean)
  });
  if (error) throw error;
  return data; // group_id
}

// Load groups visible to the current user (RLS will filter)
export async function fetchGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('id,name,description,is_private,is_admin_only_posts,is_archived,is_approved,approval_status,created_by,group_avatar_url,tags,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// One group + my membership (if any)
export async function fetchGroup(groupId, userId) {
  const [g, m] = await Promise.all([
    supabase.from('groups').select('*').eq('id', groupId).single(),
    userId
      ? supabase.from('group_members').select('role,status', { head: false }).eq('group_id', groupId).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null, error: null })
  ]);
  if (g.error) throw g.error;
  return { group: g.data, myMembership: m.data };
}

// Public self-join
export async function joinPublicGroup(groupId, userId) {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId, role: 'member', status: 'active' });
  if (error) throw error;
}

// Private: request to join (creates pending request)
export async function requestJoinPrivateGroup(groupId, userId) {
  const { error } = await supabase.from('group_memberships').insert({ group_id: groupId, user_id: userId, status: 'pending' });
  if (error) throw error;
}

// Admin: approve/deny a pending request
export async function decideJoinRequest(id, status) {
  const { error } = await supabase.from('group_memberships').update({ status }).eq('id', id);
  if (error) throw error;
}

// Admin/Group-admin: invite/add member directly
export async function addMember(groupId, userId, role = 'member') {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId, role, status: 'active' });
  if (error) throw error;
}

// Leave group (self)
export async function leaveGroup(groupId, userId) {
  const { error } = await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw error; // may throw "Each group must have at least one active admin"
}

// Promote/Demote (admin or group-admin)
export async function setMemberRole(groupId, userId, role) {
  const { error } = await supabase.from('group_members').update({ role }).eq('group_id', groupId).eq('user_id', userId);
  if (error) throw error;
}

// Toggle admin-only posts (creator/group-admin/site-admin)
export async function setAdminOnlyPosts(groupId, on) {
  const { error } = await supabase.from('groups').update({ is_admin_only_posts: on }).eq('id', groupId);
  if (error) throw error;
}

// Archive/unarchive (site admin OR group admin)
export async function setArchived(groupId, on) {
  const { error } = await supabase.from('groups').update({ is_archived: on }).eq('id', groupId);
  if (error) throw error;
}

// Approve (site admin only)
export async function approveGroup(groupId) {
  const { error } = await supabase.from('groups').update({ is_approved: true, approval_status: 'approved' }).eq('id', groupId);
  if (error) throw error;
}

// Posts (respect admin-only + archived in UI; RLS enforces anyway)
export async function createPost(groupId, content, userId) {
  const { error } = await supabase.from('group_posts').insert({ group_id: groupId, user_id: userId, content, status: 'approved' });
  if (error) throw error;
}
export async function updatePost(postId, content) {
  const { error } = await supabase.from('group_posts').update({ content }).eq('id', postId);
  if (error) throw error;
}
export async function deletePost(postId) {
  const { error } = await supabase.from('group_posts').delete().eq('id', postId);
  if (error) throw error;
}

// Comments: use group_comments (canonical)
export async function createComment(postId, groupId, content, userId) {
  const { error } = await supabase.from('group_comments').insert({ post_id: postId, group_id: groupId, user_id: userId, content });
  if (error) throw error;
}
export async function updateComment(id, content) {
  const { error } = await supabase.from('group_comments').update({ content }).eq('id', id);
  if (error) throw error;
}
export async function deleteComment(id) {
  const { error } = await supabase.from('group_comments').delete().eq('id', id);
  if (error) throw error;
}

// Moderation RPCs (JS build uses this file by default when importing '../api/groups')
export async function joinGroupV2(groupId) {
  const { data, error } = await supabase.rpc('join_group_v2', { p_group_id: groupId });
  if (error) throw error;
  return data;
}

export async function inviteMemberByEmail(groupId, email) {
  const { error } = await supabase.rpc('invite_member_by_email', { p_group_id: groupId, p_email: String(email || '').toLowerCase() });
  if (error) throw error;
}

export async function listPendingMembers(groupId) {
  const { data, error } = await supabase.rpc('list_pending_members', { p_group_id: groupId });
  if (error) throw error;
  return data || [];
}

export async function approveGroupMember(groupId, userId) {
  const { error } = await supabase.rpc('approve_group_member', { p_group_id: groupId, p_user_id: userId });
  if (error) throw error;
}

export async function rejectGroupMember(groupId, userId) {
  const { error } = await supabase.rpc('reject_group_member', { p_group_id: groupId, p_user_id: userId });
  if (error) throw error;
}

export async function setMemberRoleRpc(groupId, userId, role) {
  const { error } = await supabase.rpc('set_member_role', { p_group_id: groupId, p_user_id: userId, p_role: role });
  if (error) throw error;
}

export async function removeMemberRpc(groupId, userId) {
  const { error } = await supabase.rpc('remove_member', { p_group_id: groupId, p_user_id: userId });
  if (error) throw error;
}

export async function leaveGroupRpc(groupId) {
  const { error } = await supabase.rpc('leave_group', { p_group_id: groupId });
  if (error) throw error;
}
