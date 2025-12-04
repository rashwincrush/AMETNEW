# Mentorship DB Changelog

Tracking all mentorship-related database changes made during this refactor.

## 2025-12-04

- **Create `is_mentee_below_program_limit(p_mentee_id uuid) RETURNS boolean`**
  - SECURITY DEFINER SQL helper.
  - Counts distinct mentors from `mentorship_relationships` (active) and `mentorship_requests` (pending/accepted) and returns `COUNT < 5`.

- **Create `is_mentor_selectable(p_mentor_id uuid) RETURNS boolean`**
  - SECURITY DEFINER plpgsql helper.
  - Validates:
    - `profiles`: approved, not deleted, active, `is_available_for_mentorship = true`.
    - `mentors`: row exists with `status = 'approved'`.
    - Capacity: uses `COALESCE(mentors.max_mentees, profiles.max_mentees, 5)` and current active mentees from `mentorship_relationships`.

- **Create `mentorship_mark_user_unavailable(p_user_id uuid) RETURNS void`**
  - SECURITY DEFINER plpgsql.
  - For the given user as mentor:
    - Sets `profiles.is_available_for_mentorship = false`.
    - Sets `mentorship_requests.status = 'cancelled_by_system'` for pending requests.
    - Sets `mentorship_relationships.status = 'terminated'` and `end_date = now()` for active relationships.

- **Create `mentorship_end_all_between(p_other_user_id uuid, p_reason text DEFAULT NULL) RETURNS integer`**
  - SECURITY DEFINER plpgsql.
  - Uses `auth.uid()` as actor.
  - Ends all `mentorship_relationships` where `status = 'active'` and `(mentor_id, mentee_id)` is either direction between actor and `p_other_user_id`.
  - Updates `status = 'terminated'` and `end_date = now()`.
  - Returns number of rows affected.

- **Replace `mentorship_relationship_end(p_relationship_id uuid, p_reason text DEFAULT NULL) RETURNS void`**
  - SECURITY DEFINER plpgsql.
  - Uses `auth.uid()` as actor.
  - Locks the target row in `mentorship_relationships` by `id`.
  - Only allows mentor, mentee, or site admin to end.
  - Only allows transition from `status = 'active'::mentorship_relationship_status`.
  - Sets `status = 'terminated'` and `end_date = now()` for that relationship.

- **Create `mentorship_full_disconnect(p_other_user_id uuid, p_reason text DEFAULT NULL) RETURNS void`**
  - SECURITY DEFINER plpgsql.
  - Uses `auth.uid()` as actor.
  - Calls `mentorship_end_all_between` to terminate all active mentorship relationships between the current user and `p_other_user_id` in both directions.
  - Updates `connections.status = 'removed'` (and `updated_at = now()`) for any connection rows between the pair so that `are_connected`/DM gating will treat them as disconnected.

- **Create `user_block(p_other_user_id uuid, p_reason text DEFAULT NULL) RETURNS void`**
  - SECURITY DEFINER plpgsql.
  - Uses `auth.uid()` as actor.
  - First calls `mentorship_full_disconnect` to end all mentorships and disconnect at the connections layer for the pair.
  - Then updates `connections.status = 'blocked'` (and `updated_at = now()`) for any remaining connection rows between the pair, providing a hard safety/block primitive for DM and mentorship.
