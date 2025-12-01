import { supabase } from '../utils/supabase';

// Admin Users API client built on top of existing admin RPCs.
// Currently uses admin_list_profiles_for_approval as the grid source,
// but is structured so we can later switch to get_admin_user_grid with minimal changes.

/**
 * Fetch a paginated grid of admin-visible users.
 *
 * @param {Object} params
 * @param {string | null} params.search
 * @param {string | null} params.role      // 'alumni' | 'student' | 'employer' | 'admin' | null
 * @param {string | null} params.status    // 'pending' | 'approved' | 'rejected' | null
 * @param {number} params.page             // 1-based
 * @param {number} params.pageSize
 */
export async function fetchAdminUserGrid({ search, role, status, page, pageSize }) {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  // Today: use admin_list_profiles_for_approval as the backing RPC.
  const { data, error } = await supabase.rpc('admin_list_profiles_for_approval', {
    p_status: status ?? null,
    p_role: role ?? null,
    p_search: search ?? null,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];

  // Future-friendly: if/when the grid RPC returns total_count per row,
  // we can surface it here without changing callers.
  const totalCount =
    rows.length && typeof rows[0]?.total_count === 'number'
      ? rows[0].total_count
      : undefined;

  return { rows, totalCount };
}

export async function adminUsersUpdateProfileApproval({ profileId, decision, notes }) {
  const { data, error } = await supabase.rpc('admin_update_profile_approval', {
    p_profile_id: profileId,
    p_decision: decision,
    p_notes: notes ?? null,
  });

  if (error) throw error;
  return data;
}

export async function adminUsersToggleActive({ userId, isActive, reason }) {
  const { data, error } = await supabase.rpc('admin_toggle_active', {
    p_user_id: userId,
    p_is_active: isActive,
    p_reason: reason ?? null,
  });

  if (error) throw error;
  return data;
}

export async function adminUsersSoftDelete({ userId, reason }) {
  const { data, error } = await supabase.rpc('admin_soft_delete_user', {
    target: userId,
    p_reason: reason ?? null,
  });

  if (error) throw error;
  return data;
}

export async function adminUsersPurgeData({ userId }) {
  const { data, error } = await supabase.rpc('admin_purge_user_data', {
    target: userId,
  });

  if (error) throw error;
  return data;
}

export async function adminUsersDeleteAuthUser({ userId }) {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { userId },
  });

  if (error) throw error;
  return data;
}
