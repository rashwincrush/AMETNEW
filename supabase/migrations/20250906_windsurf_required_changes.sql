-- Windsurf Audit Required DB Changes (Apply in SQL Editor as needed)
-- Date: 2025-09-06
-- This script is idempotent where feasible.

-- ==========================================
-- Module 3A/3B/3C/3D/3E — Events
-- ==========================================
-- Optional performance indexes (support filters/sorting/KPI)
CREATE INDEX IF NOT EXISTS idx_events_start_date
  ON public.events (start_date);

DO $$
BEGIN
  -- Create composite index for approval + visibility depending on column availability
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'approval_status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_approval_published
      ON public.events (approval_status, is_published);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'is_approved'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_events_isapproved_published
      ON public.events (is_approved, is_published);
  END IF;
END$$;

DO $$
BEGIN
  -- Index for attendee status depending on column naming
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_attendees' AND column_name = 'attendance_status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_event_attendees_attendance_status
      ON public.event_attendees (attendance_status);
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'event_attendees' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_event_attendees_status
      ON public.event_attendees (status);
  END IF;
END$$;

-- ==========================================
-- Module 4 — Job Portal
-- ==========================================
-- Enforce a single application per user per job
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'job_applications_job_id_applicant_id_uniq'
  ) THEN
    ALTER TABLE public.job_applications
      ADD CONSTRAINT job_applications_job_id_applicant_id_uniq
      UNIQUE (job_id, applicant_id);
  END IF;
END$$;

-- ==========================================
-- Module 6B — Auto-assign batch group on verification
-- ==========================================
-- Function: tries to find an existing group for the user's batch
CREATE OR REPLACE FUNCTION public.auto_assign_batch_group_for_profile(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_grad_year int;
  v_dept text;
  v_group_id uuid;
BEGIN
  SELECT graduation_year, department INTO v_grad_year, v_dept
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_grad_year IS NULL THEN
    RETURN;
  END IF;

  -- Try names in common patterns
  SELECT id INTO v_group_id FROM public.groups
  WHERE is_approved = true AND (
    name = format('Batch %s %s', v_grad_year::text, COALESCE(v_dept, '')) OR
    name = format('%s %s', COALESCE(v_dept, ''), v_grad_year::text) OR
    name = format('Batch %s', v_grad_year::text)
  )
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_group_id IS NULL THEN
    RETURN; -- No matching group; do nothing (no implicit group creation)
  END IF;

  -- Insert membership if not exists
  INSERT INTO public.group_members (group_id, user_id)
  SELECT v_group_id, p_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = v_group_id AND gm.user_id = p_user_id
  );
END;
$$;

-- Trigger to call the function when a profile is approved
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_assign_batch_group_on_approval'
  ) THEN
    CREATE TRIGGER trg_auto_assign_batch_group_on_approval
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    WHEN (NEW.approval_status = 'approved' AND (OLD.approval_status IS DISTINCT FROM NEW.approval_status))
    EXECUTE FUNCTION public.auto_assign_batch_group_for_profile(NEW.id);
  END IF;
END$$;

-- ==========================================
-- Module 5C — Mentorship (mentor can create programs)
-- ==========================================
-- Enable RLS (safe to run repeatedly)
ALTER TABLE IF EXISTS public.mentorship_programs ENABLE ROW LEVEL SECURITY;

-- Insert policy for mentors and admins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'mentorship_programs' AND policyname = 'mentorship_programs_insert_mentor_or_admin'
  ) THEN
    CREATE POLICY "mentorship_programs_insert_mentor_or_admin" ON public.mentorship_programs
      FOR INSERT TO authenticated
      WITH CHECK (
        get_user_role(auth.uid()) IN ('mentor','admin','super_admin')
      );
  END IF;
END$$;

-- Keep updated_at fresh on updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_mentorship_programs_updated_at'
  ) THEN
    CREATE TRIGGER set_mentorship_programs_updated_at
    BEFORE UPDATE ON public.mentorship_programs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END$$;

-- Storage bucket for resumes (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies to allow authenticated users to upload/read their own files under a per-user folder prefix
-- Read own resumes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes_read_own'
  ) THEN
    CREATE POLICY "resumes_read_own" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'resumes'
        AND name LIKE auth.uid()::text || '/%'
      );
  END IF;
END$$;

-- Insert own resumes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes_insert_own'
  ) THEN
    CREATE POLICY "resumes_insert_own" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'resumes'
        AND name LIKE auth.uid()::text || '/%'
      );
  END IF;
END$$;

-- (Optional) Update/Delete own resumes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes_update_own'
  ) THEN
    CREATE POLICY "resumes_update_own" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'resumes'
        AND name LIKE auth.uid()::text || '/%'
      )
      WITH CHECK (
        bucket_id = 'resumes'
        AND name LIKE auth.uid()::text || '/%'
      );
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes_delete_own'
  ) THEN
    CREATE POLICY "resumes_delete_own" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'resumes'
        AND name LIKE auth.uid()::text || '/%'
      );
  END IF;
END$$;

-- NOTE: MIME/content type restrictions are best enforced app-side and/or via storage hooks.
-- Ensure RLS is enabled (Supabase enables RLS on storage.objects by default).

-- ==========================================
-- Module 5A — Messaging (Preparation)
-- ==========================================
-- If conversations.latest_message_at exists, add an index for sorting.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'latest_message_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_latest_message_at
      ON public.conversations (latest_message_at DESC);
  END IF;
END$$;

-- If conversations.last_message_at exists, add an index for sorting.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'last_message_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at
      ON public.conversations (last_message_at DESC);
  END IF;
END$$;

-- If a messages table exists with created_at and conversation_id, consider an index to support previews.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'conversation_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
      ON public.messages (conversation_id, created_at DESC);
  END IF;
END$$;

-- Unique idempotency key for messages if client_uuid column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'client_uuid'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_messages_client_uuid
      ON public.messages (client_uuid);
  END IF;
END$$;

-- Helpful index for unread count queries
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'messages'
      AND column_name = 'read_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_messages_conversation_read
      ON public.messages (conversation_id, read_at);
  END IF;
END$$;

-- Conversation participants lookup index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversation_participants'
      AND column_name = 'user_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_conv_participants_user
      ON public.conversation_participants (user_id, conversation_id);
  END IF;
END$$;

-- Storage bucket for message attachments (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('message_attachments', 'message_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anonymous/anyone to read objects in public bucket (SELECT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'msg_attach_public_read'
  ) THEN
    CREATE POLICY "msg_attach_public_read" ON storage.objects
      FOR SELECT TO anon, authenticated
      USING (bucket_id = 'message_attachments');
  END IF;
END$$;

-- Allow authenticated users to upload to message_attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'msg_attach_insert_auth'
  ) THEN
    CREATE POLICY "msg_attach_insert_auth" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'message_attachments');
  END IF;
END$$;

-- ==========================================
-- Module 4 — Job Portal (RPC with Department)
-- ==========================================
-- Create a v3 RPC that accepts department and returns JSON { items, total_count }
CREATE OR REPLACE FUNCTION public.get_jobs_with_bookmarks_v3(
  p_search_query text DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc',
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0,
  p_department text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_sort_col text;
  v_sort_dir text;
  q text;
  result json;
BEGIN
  v_sort_col := CASE lower(p_sort_by)
    WHEN 'deadline' THEN 'application_deadline'
    WHEN 'title' THEN 'title'
    ELSE 'created_at'
  END;
  v_sort_dir := CASE lower(p_sort_order) WHEN 'asc' THEN 'ASC' ELSE 'DESC' END;

  q := format($f$
    WITH base AS (
      SELECT j.*, c.name AS company_name, c.logo_url AS company_logo_url,
        COALESCE(a.count,0) AS applicant_count,
        EXISTS(SELECT 1 FROM job_bookmarks jb WHERE jb.job_id = j.id AND jb.user_id = %L) AS is_bookmarked
      FROM public.jobs j
      LEFT JOIN public.companies c ON c.id = j.company_id
      LEFT JOIN (
        SELECT job_id, COUNT(*) AS count FROM public.job_applications GROUP BY job_id
      ) a ON a.job_id = j.id
      WHERE (j.is_approved = true AND (j.is_active IS NULL OR j.is_active = true))
        AND (%L = '' OR j.title ILIKE '%%' || %L || '%%' OR j.description ILIKE '%%' || %L || '%%' OR j.location ILIKE '%%' || %L || '%%' OR c.name ILIKE '%%' || %L || '%%')
        AND (%L = '' OR j.department ILIKE %L)
    )
    SELECT json_build_object(
      'items', (SELECT json_agg(row_to_json(t.*)) FROM (
        SELECT * FROM base ORDER BY %s %s LIMIT $1 OFFSET $2
      ) t),
      'total_count', (SELECT COUNT(*) FROM base)
    );
  $f$,
    v_user_id,
    COALESCE(p_search_query, ''), COALESCE(p_search_query, ''), COALESCE(p_search_query, ''), COALESCE(p_search_query, ''), COALESCE(p_search_query, ''),
    COALESCE(p_department, ''), COALESCE(p_department, ''),
    v_sort_col, v_sort_dir
  );

  EXECUTE q USING p_limit, p_offset INTO result;
  RETURN result;
END;
$$;

-- Allow authenticated clients to call the RPC via PostgREST
GRANT EXECUTE ON FUNCTION public.get_jobs_with_bookmarks_v3(
  text, text, text, integer, integer, text
) TO authenticated;

-- ==========================================
-- Notes
-- - Events modules required no schema changes beyond optional indexes above.
-- - Directory/Profile modules required no schema changes.
-- - Job Portal requires the unique application constraint; resumes bucket policies help enforce access.
-- - Messaging indexes above are guarded and safe to apply only if columns/tables exist.

-- ==========================================
-- Module 4 — Job Portal (RLS: Delete policy, if missing)
-- ==========================================
-- RLS: Delete policy for job owners or admins (handles owner column name)
DO $$
BEGIN
  -- Drop existing policy to ensure correct definition (avoids duplicates/stale versions)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'jobs' AND policyname = 'jobs_delete_owner_or_admin'
  ) THEN
    DROP POLICY "jobs_delete_owner_or_admin" ON public.jobs;
  END IF;

  -- Prefer jobs.user_id when present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'user_id'
  ) THEN
    CREATE POLICY "jobs_delete_owner_or_admin" ON public.jobs
      FOR DELETE TO authenticated
      USING (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
        )
      );
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'posted_by'
  ) THEN
    CREATE POLICY "jobs_delete_owner_or_admin" ON public.jobs
      FOR DELETE TO authenticated
      USING (
        posted_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
        )
      );
  END IF;
END$$;

-- ==========================================
-- Module 5A — Messaging helper RPC (mark as read)
-- ==========================================
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  p_conversation_id uuid,
  p_user_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.messages
    SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_id <> p_user_id
    AND read_at IS NULL;
END;
$$;

-- ==========================================
-- Module 6A — Admin Notifications on Event Create
-- ==========================================
-- Create table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_notifications'
  ) THEN
    CREATE TABLE public.admin_notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz NOT NULL DEFAULT now(),
      notification_type text NOT NULL DEFAULT 'event_created',
      entity_type text NOT NULL,
      entity_id uuid,
      message text,
      created_by uuid,
      is_read boolean NOT NULL DEFAULT false
    );
  END IF;
END$$;

-- Enable RLS and restrict to admin roles
ALTER TABLE IF EXISTS public.admin_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_notifications' AND policyname = 'admin_notifications_select_admins'
  ) THEN
    CREATE POLICY "admin_notifications_select_admins" ON public.admin_notifications
      FOR SELECT TO authenticated
      USING (get_user_role(auth.uid()) IN ('admin','super_admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_notifications' AND policyname = 'admin_notifications_update_admins'
  ) THEN
    CREATE POLICY "admin_notifications_update_admins" ON public.admin_notifications
      FOR UPDATE TO authenticated
      USING (get_user_role(auth.uid()) IN ('admin','super_admin'))
      WITH CHECK (get_user_role(auth.uid()) IN ('admin','super_admin'));
  END IF;
END$$;

-- Allow enqueuing notifications on event create; restrict read/update to admins above
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'admin_notifications' AND policyname = 'admin_notifications_insert_auth'
  ) THEN
    CREATE POLICY "admin_notifications_insert_auth" ON public.admin_notifications
      FOR INSERT TO authenticated
      WITH CHECK (true);
  END IF;
END$$;

-- Trigger function to enqueue notification when an event is created
CREATE OR REPLACE FUNCTION public.notify_admin_on_event_create()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (notification_type, entity_type, entity_id, message, created_by)
  VALUES (
    'event_created',
    'events',
    NEW.id,
    'New event created: ' || COALESCE(NEW.title::text, 'Untitled'),
    COALESCE(NEW.created_by, NEW.user_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the notification function on event creation (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_admin_notify_on_event_insert'
  ) THEN
    CREATE TRIGGER trg_admin_notify_on_event_insert
    AFTER INSERT ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admin_on_event_create();
  END IF;
END$$;



-- ==========================================
-- Module 6C — Activity Logs (Lightweight)
-- ==========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_activity_logs'
  ) THEN
    CREATE TABLE public.user_activity_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamptz NOT NULL DEFAULT now(),
      user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      route text,
      action text NOT NULL,
      meta jsonb,
      ip text,
      ua text
    );
  END IF;
END$$;

ALTER TABLE IF EXISTS public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Insert: authenticated users can insert their own logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_activity_logs' AND policyname = 'ual_insert_own'
  ) THEN
    CREATE POLICY "ual_insert_own" ON public.user_activity_logs
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END$$;

-- Select: only admins can read logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_activity_logs' AND policyname = 'ual_select_admins'
  ) THEN
    CREATE POLICY "ual_select_admins" ON public.user_activity_logs
      FOR SELECT TO authenticated
      USING (get_user_role(auth.uid()) IN ('admin','super_admin'));
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_ual_created_at ON public.user_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ual_action ON public.user_activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_ual_user ON public.user_activity_logs (user_id, created_at DESC);

-- ==========================================
-- Module 6B — Admin Users helper (last_sign_in_at)
-- ==========================================
-- Provide a safe, admin-only function for the Admin UI to read auth.users last_sign_in_at
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE (
  id uuid,
  email text,
  last_sign_in_at timestamptz,
  full_name text,
  role text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT u.id, u.email, u.last_sign_in_at, p.full_name, p.role
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE get_user_role(auth.uid()) IN ('admin','super_admin');
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;

-- ==========================================
-- Module 8 — DB & Migration Hygiene fixes
-- ==========================================
-- Some policies reference profiles.is_hidden. Ensure the column exists.
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- ==========================================
-- Module 9 — Directory/Education History Compatibility
-- ==========================================
-- Add profile_id to education_history so frontend can query by profile_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_history' AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE public.education_history
      ADD COLUMN profile_id uuid;

    -- Backfill from user_id (profiles.id equals auth.uid())
    UPDATE public.education_history
      SET profile_id = user_id
      WHERE profile_id IS NULL;

    -- FK to profiles (set null on delete)
    ALTER TABLE public.education_history
      ADD CONSTRAINT education_history_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

    -- Helpful index for lookups
    CREATE INDEX IF NOT EXISTS idx_education_history_profile_id
      ON public.education_history (profile_id);
  END IF;
END$$;

-- Expose app-expected column names as generated aliases
DO $$
BEGIN
  -- degree (alias of degree_type)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_history' AND column_name = 'degree'
  ) THEN
    ALTER TABLE public.education_history
      ADD COLUMN degree text GENERATED ALWAYS AS (degree_type) STORED;
  END IF;

  -- specialization (alias of major)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'education_history' AND column_name = 'specialization'
  ) THEN
    ALTER TABLE public.education_history
      ADD COLUMN specialization text GENERATED ALWAYS AS (major) STORED;
  END IF;
END$$;

-- ==========================================
-- Module 6C — Activity Logs (Compatibility Additions)
-- ==========================================
-- Ensure columns used by the frontend exist even if table pre-existed
DO $$
BEGIN
  -- Core columns expected by frontend
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_activity_logs'
  ) THEN
    ALTER TABLE public.user_activity_logs
      ADD COLUMN IF NOT EXISTS route text,
      ADD COLUMN IF NOT EXISTS meta jsonb,
      ADD COLUMN IF NOT EXISTS ua text,
      ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

    -- Add canonical columns for compatibility with existing schema
    ALTER TABLE public.user_activity_logs
      ADD COLUMN IF NOT EXISTS metadata jsonb,
      ADD COLUMN IF NOT EXISTS user_agent text;
  END IF;
END$$;

-- Sync alias columns (meta, ua) with canonical (metadata, user_agent)
-- Create function (safe to replace) and idempotent trigger
CREATE OR REPLACE FUNCTION public.user_activity_logs_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Copy alias into canonical when provided
  IF NEW.meta IS NOT NULL THEN
    NEW.metadata := NEW.meta;
  END IF;
  IF NEW.ua IS NOT NULL THEN
    NEW.user_agent := NEW.ua;
  END IF;

  -- Mirror canonical back to alias when alias not provided
  IF NEW.meta IS NULL AND NEW.metadata IS NOT NULL THEN
    NEW.meta := NEW.metadata;
  END IF;
  IF NEW.ua IS NULL AND NEW.user_agent IS NOT NULL THEN
    NEW.ua := NEW.user_agent;
  END IF;

  RETURN NEW;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_activity_logs'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_activity_logs_sync'
  ) THEN
    CREATE TRIGGER trg_user_activity_logs_sync
    BEFORE INSERT OR UPDATE ON public.user_activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.user_activity_logs_sync();
  END IF;
END$$;

-- Additional helpful index for route
CREATE INDEX IF NOT EXISTS idx_ual_route ON public.user_activity_logs (route);
