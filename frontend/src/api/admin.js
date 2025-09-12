// Centralized admin RPC wrappers
// Aligns with 2-arg signature: admin_set_profile_approval(target uuid, new_status text)

import { supabase } from '../utils/supabase';

/**
 * Set profile approval status via RPC.
 * @param {string} userId - UUID of the target profile/user
 * @param {'pending'|'approved'|'rejected'} status - new approval status
 * @returns {Promise<{ data: any, error: any }>} Supabase response
 */
export async function adminSetProfileApproval(userId, status) {
  return supabase.rpc('admin_set_profile_approval', {
    target: userId,
    new_status: status,
  });
}
