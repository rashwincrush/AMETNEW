// src/utils/memberships.js
// Returns a map keyed by groupId: { isMember: boolean, isAdmin: boolean }
export async function fetchMembershipMap(supabase, groupIds) {
  if (!Array.isArray(groupIds) || groupIds.length === 0) return {};
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return {};

  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role')
    .in('group_id', groupIds)
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).reduce((acc, row) => {
    acc[row.group_id] = { isMember: true, isAdmin: row.role === 'admin' };
    return acc;
  }, {});
}
