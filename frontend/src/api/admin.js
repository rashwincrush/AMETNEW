// Centralized admin RPC wrappers

import { supabase } from '../utils/supabase';

/**
 * Update profile approval state via centralized admin RPC.
 * @param {{ profileId: string, decision: string, notes?: string | null }} params
 * decision: 'approve' | 'reject' | 'block' | 'unblock' | 'deactivate' | 'reactivate' | 'reset'
 * @returns {Promise<any>} RPC response data
 */
export async function adminUpdateProfileApproval({ profileId, decision, notes }) {
	const { data, error } = await supabase.rpc('admin_update_profile_approval', {
		p_profile_id: profileId,
		p_decision: decision,
		p_notes: notes ?? null,
	});

	if (error) throw error;
	return data;
}

/**
 * List profiles for approval queues with optional filters.
 * @param {{ status?: string | null, role?: string | null, search?: string | null, limit?: number, offset?: number }} params
 * status: 'pending' | 'approved' | 'rejected' | null
 * role: 'alumni' | 'student' | 'employer' | 'admin' | null
 */
export async function adminListProfilesForApproval({ status, role, search, limit = 50, offset = 0 }) {
	const { data, error } = await supabase.rpc('admin_list_profiles_for_approval', {
		p_status: status ?? null,
		p_role: role ?? null,
		p_search: search ?? null,
		p_limit: limit,
		p_offset: offset,
	});

	if (error) throw error;
	return data;
}

/**
 * Fetch approval/audit history for a given profile.
 * @param {{ profileId: string, limit?: number, offset?: number }} params
 */
export async function adminGetProfileApprovalAudit({ profileId, limit = 50, offset = 0 }) {
	const { data, error } = await supabase.rpc('admin_get_profile_approval_audit', {
		p_profile_id: profileId,
		p_limit: limit,
		p_offset: offset,
	});

	if (error) throw error;
	return data;
}
