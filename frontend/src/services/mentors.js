// frontend/src/services/mentors.js
import { supabase } from '../utils/supabase';
import logger from '../utils/logger';

/**
 * Translates a PostgREST error into a user-friendly message.
 * @param {object} error - The PostgREST error object.
 * @returns {string} A user-friendly error message.
 */
const handlePostgrestError = (error) => {
  if (!error) return 'An unknown error occurred.';

  // 406: No rows for .single() -> should be handled by .maybeSingle(), but as a fallback.
  if (error.code === 'PGRST116') {
    return 'The requested profile could not be found.';
  }
  // 23514: Check constraint violation (e.g., invalid status)
  if (error.code === '23514') {
    return 'One or more fields have an invalid value (e.g., status). Please review and try again.';
  }

  return error.message || 'An unexpected error occurred.';
};

/**
 * Fetches the mentor profile for the currently signed-in user.
 * Returns null if the user has no mentor profile yet.
 * @returns {Promise<object|null>} The mentor profile or null.
 */
export const getMyMentorProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    const { data, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error fetching my mentor profile:', handlePostgrestError(error));
    return null;
  }
};

/**
 * Fetches a mentor profile by its unique ID.
 * @param {string} id - The UUID of the mentor.
 * @returns {Promise<object|null>} The mentor profile or null if not found.
 */
export const getMentorById = async (id) => {
  if (!id) return null;

  try {
    const { data, error } = await supabase
      .from('mentors')
      .select('*, profile:profiles(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error fetching mentor by ID (${id}):`, handlePostgrestError(error));
    return null;
  }
};

/**
 * Lists all approved mentors, with pagination.
 * @param {{ page?: number, perPage?: number }} params - Pagination parameters.
 * @returns {Promise<object[]|null>} A list of approved mentors.
 */
export const listApprovedMentors = async ({ page = 1, perPage = 20 } = {}) => {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  try {
    const { data, error } = await supabase
      .from('mentors')
      .select('*, profile:profiles(full_name, avatar_url, headline)')
      .eq('status', 'approved')
      .range(from, to);

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Error listing approved mentors:', handlePostgrestError(error));
    return [];
  }
};

/**
 * Creates or updates a mentor profile.
 * Ensures a valid status is set.
 * @param {object} payload - The mentor data to upsert.
 * @returns {Promise<{data: object|null, error: string|null}>} The upserted mentor data or an error message.
 */
export const upsertMentor = async (payload) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'User not authenticated.' };

  // Ensure only valid columns are sent and status is correctly defaulted.
  const mentorData = {
    user_id: user.id,
    status: payload.status || 'pending', // Default to 'pending' if not provided
    expertise: payload.expertise,
    mentoring_statement: payload.mentoring_statement,
    mentoring_preferences: payload.mentoring_preferences,
    mentoring_capacity_hours_per_month: payload.mentoring_capacity_hours_per_month || 0,
    mentoring_experience_years: payload.mentoring_experience_years || 0,
    max_mentees: payload.max_mentees || 0,
    mentoring_experience_description: payload.mentoring_experience_description,
  };

  try {
    // RLS-friendly flow: check if a mentor row exists for this user. If yes, UPDATE; else INSERT.
    const { data: existing, error: selErr } = await supabase
      .from('mentors')
      .select('id, user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (selErr) throw selErr;

    if (existing) {
      // UPDATE path (allowed by mentors_update policy when user owns the row)
      const { data, error } = await supabase
        .from('mentors')
        .update(mentorData)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    } else {
      // INSERT path (allowed by mentors_insert policy only if no existing row)
      const { data, error } = await supabase
        .from('mentors')
        .insert([mentorData])
        .select()
        .single();
      if (error) throw error;
      return { data, error: null };
    }
  } catch (error) {
    logger.error('Error saving mentor profile (insert/update):', error);
    return { data: null, error: handlePostgrestError(error) };
  }
};
