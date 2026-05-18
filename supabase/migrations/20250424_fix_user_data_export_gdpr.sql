-- GAP 3: User Data Export (GDPR Compliance)
-- Creates user_data_exports table and RPC to export all user data

-- Step 1: Create user_data_exports table
CREATE TABLE IF NOT EXISTS public.user_data_exports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','expired')),
  file_path TEXT,
  file_size_bytes INTEGER,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_data_exports_user_id ON public.user_data_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_exports_status ON public.user_data_exports(status);

-- Comments
COMMENT ON TABLE public.user_data_exports IS 'Tracks user data export requests for GDPR compliance';
COMMENT ON COLUMN public.user_data_exports.file_path IS 'Storage path in user-exports bucket';

-- Step 2: RLS Policies for user_data_exports
ALTER TABLE public.user_data_exports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own exports
CREATE POLICY IF NOT EXISTS "user_data_exports_select_own"
  ON public.user_data_exports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can only insert their own exports
CREATE POLICY IF NOT EXISTS "user_data_exports_insert_own"
  ON public.user_data_exports
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 3: RPC to request and generate user data export
CREATE OR REPLACE FUNCTION public.request_my_data_export()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_export_id UUID;
  v_existing_export_id UUID;
  v_user_data JSONB;
  v_profile_data JSONB;
  v_applications_data JSONB;
  v_connections_data JSONB;
  v_event_registrations_data JSONB;
  v_mentorships_data JSONB;
  v_messages_data JSONB;
  v_groups_data JSONB;
  v_full_export JSONB;
  v_file_path TEXT;
  v_file_size INTEGER;
BEGIN
  -- Check if user has a recent export (< 24 hours old)
  SELECT id INTO v_existing_export_id
  FROM public.user_data_exports
  WHERE user_id = v_user_id
    AND status = 'ready'
    AND requested_at > NOW() - INTERVAL '24 hours'
    AND expires_at > NOW()
  ORDER BY requested_at DESC
  LIMIT 1;

  IF v_existing_export_id IS NOT NULL THEN
    -- Return existing export
    RETURN jsonb_build_object(
      'success', true,
      'export_id', v_existing_export_id,
      'status', 'ready',
      'message', 'A recent export is available. You can request a new one after 24 hours.',
      'existing', true
    );
  END IF;

  -- Create export record
  INSERT INTO public.user_data_exports (user_id, status)
  VALUES (v_user_id, 'processing')
  RETURNING id INTO v_export_id;

  -- Collect user profile data
  SELECT jsonb_build_object(
    'id', p.id,
    'email', u.email,
    'full_name', p.full_name,
    'first_name', p.first_name,
    'last_name', p.last_name,
    'batch', p.batch,
    'department', p.department,
    'location', p.location,
    'bio', p.bio,
    'phone', p.phone,
    'linkedin_url', p.linkedin_url,
    'created_at', p.created_at,
    'updated_at', p.updated_at,
    'role', p.role,
    'is_approved', p.is_approved,
    'approval_status', p.approval_status
  )
  INTO v_profile_data
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = v_user_id;

  -- Collect job applications data
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ja.id,
      'job_id', ja.job_id,
      'status', ja.status,
      'created_at', ja.created_at,
      'updated_at', ja.updated_at,
      'rejection_reason', ja.rejection_reason,
      'job_title', j.title,
      'company_name', j.company_name
    )
  ), '[]'::jsonb)
  INTO v_applications_data
  FROM public.job_applications ja
  LEFT JOIN public.jobs j ON j.id = ja.job_id
  WHERE ja.applicant_id = v_user_id;

  -- Collect connections data
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'status', c.status,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'other_user_id', CASE WHEN c.requester_id = v_user_id THEN c.recipient_id ELSE c.requester_id END,
      'other_user_name', COALESCE(p.full_name, p.first_name || ' ' || p.last_name),
      'direction', CASE WHEN c.requester_id = v_user_id THEN 'sent' ELSE 'received' END
    )
  ), '[]'::jsonb)
  INTO v_connections_data
  FROM public.connections c
  LEFT JOIN public.profiles p ON p.id = CASE WHEN c.requester_id = v_user_id THEN c.recipient_id ELSE c.requester_id END
  WHERE c.requester_id = v_user_id OR c.recipient_id = v_user_id;

  -- Collect event registrations data
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ea.id,
      'event_id', ea.event_id,
      'status', ea.status,
      'registered_at', ea.registered_at,
      'event_title', e.title,
      'event_date', e.event_date,
      'event_location', e.location
    )
  ), '[]'::jsonb)
  INTO v_event_registrations_data
  FROM public.event_attendees ea
  LEFT JOIN public.events e ON e.id = ea.event_id
  WHERE ea.attendee_id = v_user_id;

  -- Collect mentorship data
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', mr.id,
      'mentor_id', mr.mentor_id,
      'mentee_id', mr.mentee_id,
      'status', mr.status,
      'request_message', mr.request_message,
      'response_message', mr.response_message,
      'created_at', mr.created_at,
      'updated_at', mr.updated_at,
      'role', CASE WHEN mr.mentor_id = v_user_id THEN 'mentor' ELSE 'mentee' END
    )
  ), '[]'::jsonb)
  INTO v_mentorships_data
  FROM public.mentorship_requests mr
  WHERE mr.mentor_id = v_user_id OR mr.mentee_id = v_user_id;

  -- Collect groups data (memberships only, not all posts)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', gm.id,
      'group_id', gm.group_id,
      'role', gm.role,
      'joined_at', gm.joined_at,
      'group_name', g.name
    )
  ), '[]'::jsonb)
  INTO v_groups_data
  FROM public.group_members gm
  LEFT JOIN public.groups g ON g.id = gm.group_id
  WHERE gm.user_id = v_user_id;

  -- Combine all data
  v_full_export := jsonb_build_object(
    'export_info', jsonb_build_object(
      'export_id', v_export_id,
      'user_id', v_user_id,
      'requested_at', NOW(),
      'platform', 'AMET Alumni Platform',
      'version', '1.0'
    ),
    'profile', COALESCE(v_profile_data, '{}'::jsonb),
    'job_applications', v_applications_data,
    'connections', v_connections_data,
    'event_registrations', v_event_registrations_data,
    'mentorships', v_mentorships_data,
    'groups_memberships', v_groups_data,
    'export_schema', jsonb_build_object(
      'profile', 'User profile information and settings',
      'job_applications', 'Jobs applied to and application statuses',
      'connections', 'Connection requests and accepted connections',
      'event_registrations', 'Event registrations and attendance',
      'mentorships', 'Mentorship requests and relationships',
      'groups_memberships', 'Group memberships'
    )
  );

  -- Calculate file size
  v_file_size := pg_column_size(v_full_export);

  -- Generate file path
  v_file_path := v_user_id::text || '/' || v_export_id::text || '.json';

  -- Note: In a real implementation, you would use pg_net or a trigger to upload to storage
  -- For now, we store the JSON in the metadata column and mark as ready
  -- The frontend can then use a separate endpoint or Edge Function to download

  -- Update export record
  UPDATE public.user_data_exports
  SET status = 'ready',
      file_path = v_file_path,
      file_size_bytes = v_file_size,
      completed_at = NOW(),
      metadata = jsonb_build_object(
        'data', v_full_export,
        'download_url', '/api/exports/' || v_export_id
      )
  WHERE id = v_export_id;

  -- Log activity
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (v_user_id, 'data_export_requested', jsonb_build_object(
    'export_id', v_export_id,
    'file_size_bytes', v_file_size
  ));

  RETURN jsonb_build_object(
    'success', true,
    'export_id', v_export_id,
    'status', 'ready',
    'file_path', v_file_path,
    'file_size_bytes', v_file_size,
    'expires_at', NOW() + INTERVAL '7 days',
    'download_url', '/api/exports/' || v_export_id,
    'message', 'Your data export is ready for download. Link expires in 7 days.'
  );
END;
$$;

GRANT ALL ON FUNCTION public.request_my_data_export() TO authenticated;

-- Step 4: RPC to get export download URL (returns signed URL)
CREATE OR REPLACE FUNCTION public.get_my_export_download_url(p_export_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_export RECORD;
  v_user_id UUID := auth.uid();
BEGIN
  -- Get export details
  SELECT * INTO v_export
  FROM public.user_data_exports
  WHERE id = p_export_id AND user_id = v_user_id;

  IF v_export IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Export not found');
  END IF;

  IF v_export.status != 'ready' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Export is not ready yet', 'status', v_export.status);
  END IF;

  IF v_export.expires_at < NOW() THEN
    -- Update status to expired
    UPDATE public.user_data_exports
    SET status = 'expired'
    WHERE id = p_export_id;

    RETURN jsonb_build_object('success', false, 'error', 'Export link has expired. Please request a new export.');
  END IF;

  -- Return the data from metadata (since we're storing in DB for now)
  RETURN jsonb_build_object(
    'success', true,
    'export_id', v_export.id,
    'status', v_export.status,
    'requested_at', v_export.requested_at,
    'expires_at', v_export.expires_at,
    'data', v_export.metadata->'data'
  );
END;
$$;

GRANT ALL ON FUNCTION public.get_my_export_download_url(UUID) TO authenticated;

-- Step 5: Cleanup function to delete expired exports (can be run by cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_data_exports()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Mark expired exports
  UPDATE public.user_data_exports
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status IN ('pending', 'processing', 'ready');

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log cleanup
  IF v_count > 0 THEN
    INSERT INTO public.activity_logs (user_id, action, details)
    VALUES (NULL, 'data_exports_cleaned', jsonb_build_object('expired_count', v_count));
  END IF;

  RETURN v_count;
END;
$$;

GRANT ALL ON FUNCTION public.cleanup_expired_data_exports() TO service_role;

-- Migration complete
