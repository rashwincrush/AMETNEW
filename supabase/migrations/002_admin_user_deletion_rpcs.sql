-- 002_admin_user_deletion_rpcs.sql
-- Adds soft delete/purge flags and implements admin user deletion RPCs.

-- 1) Ensure profiles has required columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_data_purged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS purged_at timestamptz;

-- 2) Core purge function used by Edge Function (service role) and admin wrapper.
--    IMPORTANT: This function intentionally does NOT enforce auth.uid() checks.
--    It is restricted to the service_role via GRANT below. Admin wrapper will handle
--    role checks for interactive/admin UI usage.
CREATE OR REPLACE FUNCTION public.purge_user_data(uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _exists int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'uid is required');
  END IF;

  -- Best-effort deletes/anonymization across known tables. Each block guards missing tables.
  -- Conversations and messaging
  BEGIN
    DELETE FROM conversation_participants WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM messages WHERE sender_id = uid OR recipient_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Social/Connections
  BEGIN
    DELETE FROM connections WHERE requester_id = uid OR recipient_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Notifications
  BEGIN
    DELETE FROM notification_preferences WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM notifications WHERE profile_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Jobs related
  BEGIN
    DELETE FROM bookmarked_jobs WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM job_alerts WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM job_applications WHERE applicant_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM job_listings WHERE creator_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM jobs WHERE posted_by = uid OR user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Events related
  BEGIN
    DELETE FROM event_feedback WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM event_attendees WHERE attendee_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM events WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Achievements, activity logs, content moderation
  BEGIN
    DELETE FROM achievements WHERE profile_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM activity_logs WHERE profile_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM content_approvals WHERE creator_id = uid OR reviewer_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM content_moderation WHERE moderator_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Mentorship structures
  BEGIN
    DELETE FROM mentorship_sessions WHERE created_by = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM mentorship_relationships WHERE mentor_id = uid OR mentee_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM mentorship_requests WHERE mentor_id = uid OR mentee_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM mentee_profiles WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM mentor_profiles WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM mentees WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM mentors WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Resume/education
  BEGIN
    DELETE FROM resume_profiles WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM education_history WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Groups (if present in schema)
  BEGIN
    DELETE FROM group_members WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Posts/Comments (if present)
  BEGIN
    DELETE FROM comments WHERE user_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN
    DELETE FROM posts WHERE author_id = uid;
  EXCEPTION WHEN undefined_table THEN NULL; END;

  -- Finally anonymize and mark profile as purged
  UPDATE profiles
  SET
    email = 'purged_' || id || '@purged.user',
    full_name = 'Deleted User',
    avatar_url = NULL,
    phone = NULL,
    phone_number = NULL,
    linkedin_url = NULL,
    github_url = NULL,
    twitter_url = NULL,
    website = NULL,
    website_url = NULL,
    social_links = NULL,
    bio = NULL,
    biography = NULL,
    location = NULL,
    current_position = NULL,
    current_company = NULL,
    job_title = NULL,
    updated_at = NOW(),
    is_deleted = TRUE,
    is_data_purged = TRUE,
    purged_at = NOW(),
    alumni_verification_status = 'deleted'
  WHERE id = uid;

  RETURN jsonb_build_object('success', true, 'user_id', uid);
END;
$$;

-- Restrict direct execution to service role only
REVOKE ALL ON FUNCTION public.purge_user_data(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_user_data(uuid) TO service_role;

-- 3) Admin soft delete RPC used by frontend, with permission checks and logging
CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(target uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  caller_role text;
  target_role text;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT role INTO caller_role FROM profiles WHERE id = caller_id;
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  IF target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'target is required');
  END IF;

  IF target = caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot delete your own account');
  END IF;

  SELECT role INTO target_role FROM profiles WHERE id = target;
  IF target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF target_role IN ('admin', 'super_admin') AND caller_role <> 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only super_admin can delete admin/super_admin users');
  END IF;

  UPDATE profiles
  SET
    is_deleted = TRUE,
    deleted_at = NOW(),
    alumni_verification_status = 'deleted',
    email = 'deleted_' || id || '@deleted.user',
    full_name = 'Deleted User',
    updated_at = NOW()
  WHERE id = target;

  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
  VALUES (caller_id, 'soft_delete_user', 'user', target, 'Soft-deleted user via RPC');

  RETURN jsonb_build_object('success', true, 'user_id', target);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(uuid) TO authenticated;

-- 4) Admin purge wrapper with permission checks and logging; calls core purge
CREATE OR REPLACE FUNCTION public.admin_purge_user_data(target uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  caller_role text;
  target_role text;
  purge_result jsonb;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;

  SELECT role INTO caller_role FROM profiles WHERE id = caller_id;
  IF caller_role NOT IN ('admin', 'super_admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  IF target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'target is required');
  END IF;

  IF target = caller_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot purge your own account');
  END IF;

  SELECT role INTO target_role FROM profiles WHERE id = target;
  IF target_role IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF target_role IN ('admin', 'super_admin') AND caller_role <> 'super_admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only super_admin can purge admin/super_admin users');
  END IF;

  -- Execute the core purge (service-level) function
  purge_result := purge_user_data(target);

  -- Log the action
  INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, description)
  VALUES (caller_id, 'purge_user_data', 'user', target, 'Purged user-owned data via RPC');

  RETURN COALESCE(purge_result, jsonb_build_object('success', true, 'user_id', target));
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_purge_user_data(uuid) TO authenticated;

-- 5) Compatibility: The Edge Function calls purge_user_data(uid => ...)
--    Already provided by the core function above.
