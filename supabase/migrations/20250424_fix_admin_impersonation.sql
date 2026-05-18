-- GAP 5: Admin User Impersonation
-- Creates impersonation sessions table and RPCs for admin debugging

-- Step 1: Create admin_impersonation_sessions table
CREATE TABLE IF NOT EXISTS public.admin_impersonation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID NOT NULL REFERENCES auth.users(id),
  session_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '2 hours',
  ended_at TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_admin_id ON public.admin_impersonation_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_target_user_id ON public.admin_impersonation_sessions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_token ON public.admin_impersonation_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_impersonation_sessions_active ON public.admin_impersonation_sessions(ended_at) WHERE ended_at IS NULL;

-- Comments
COMMENT ON TABLE public.admin_impersonation_sessions IS 'Tracks admin impersonation sessions for debugging and support';
COMMENT ON COLUMN public.admin_impersonation_sessions.session_token IS 'Unique token for this impersonation session';

-- Step 2: RLS Policies for admin_impersonation_sessions
ALTER TABLE public.admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can insert
CREATE POLICY IF NOT EXISTS "admin_impersonation_sessions_insert_admin"
  ON public.admin_impersonation_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admins can only see their own sessions
CREATE POLICY IF NOT EXISTS "admin_impersonation_sessions_select_own"
  ON public.admin_impersonation_sessions
  FOR SELECT
  TO authenticated
  USING (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- Admins can only update their own sessions
CREATE POLICY IF NOT EXISTS "admin_impersonation_sessions_update_own"
  ON public.admin_impersonation_sessions
  FOR UPDATE
  TO authenticated
  USING (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'super_admin')
    )
  );

-- Step 3: RPC to start impersonation
CREATE OR REPLACE FUNCTION public.start_impersonation(
  p_target_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_is_admin BOOLEAN;
  v_session_token TEXT;
  v_session_id UUID;
  v_target_email TEXT;
  v_target_name TEXT;
BEGIN
  -- Verify caller is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = v_admin_id AND p.role IN ('admin', 'super_admin')
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only admins can impersonate users');
  END IF;

  -- Cannot impersonate yourself
  IF v_admin_id = p_target_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot impersonate yourself');
  END IF;

  -- Get target user info for logging
  SELECT u.email, COALESCE(p.full_name, p.first_name || ' ' || p.last_name)
  INTO v_target_email, v_target_name
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE u.id = p_target_user_id;

  IF v_target_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target user not found');
  END IF;

  -- End any existing active sessions for this admin
  UPDATE public.admin_impersonation_sessions
  SET ended_at = NOW()
  WHERE admin_id = v_admin_id AND ended_at IS NULL;

  -- Create new session
  INSERT INTO public.admin_impersonation_sessions (
    admin_id,
    target_user_id,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    v_admin_id,
    p_target_user_id,
    p_ip_address,
    p_user_agent,
    jsonb_build_object(
      'target_email', v_target_email,
      'target_name', v_target_name,
      'started_by', 'admin_interface'
    )
  )
  RETURNING id, session_token INTO v_session_id, v_session_token;

  -- Log to activity_logs
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (v_admin_id, 'impersonation_started', jsonb_build_object(
    'session_id', v_session_id,
    'target_user_id', p_target_user_id,
    'target_email', v_target_email,
    'target_name', v_target_name
  ));

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'session_token', v_session_token,
    'expires_at', NOW() + INTERVAL '2 hours',
    'target_user', jsonb_build_object(
      'id', p_target_user_id,
      'email', v_target_email,
      'name', v_target_name
    )
  );
END;
$$;

GRANT ALL ON FUNCTION public.start_impersonation(UUID, TEXT, TEXT) TO authenticated;

-- Step 4: RPC to end impersonation
CREATE OR REPLACE FUNCTION public.end_impersonation(p_session_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_session_id UUID;
  v_target_user_id UUID;
BEGIN
  -- Find and update the session
  UPDATE public.admin_impersonation_sessions
  SET ended_at = NOW()
  WHERE session_token = p_session_token
    AND admin_id = v_admin_id
    AND ended_at IS NULL
  RETURNING id, target_user_id INTO v_session_id, v_target_user_id;

  IF v_session_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session not found or already ended');
  END IF;

  -- Log to activity_logs
  INSERT INTO public.activity_logs (user_id, action, details)
  VALUES (v_admin_id, 'impersonation_ended', jsonb_build_object(
    'session_id', v_session_id,
    'target_user_id', v_target_user_id
  ));

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Impersonation session ended'
  );
END;
$$;

GRANT ALL ON FUNCTION public.end_impersonation(TEXT) TO authenticated;

-- Step 5: RPC to get active impersonation session for current admin
CREATE OR REPLACE FUNCTION public.get_active_impersonation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_session RECORD;
BEGIN
  SELECT 
    ais.id,
    ais.session_token,
    ais.target_user_id,
    ais.started_at,
    ais.expires_at,
    ais.metadata
  INTO v_session
  FROM public.admin_impersonation_sessions ais
  WHERE ais.admin_id = v_admin_id
    AND ais.ended_at IS NULL
    AND ais.expires_at > NOW()
  ORDER BY ais.started_at DESC
  LIMIT 1;

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('active', false);
  END IF;

  RETURN jsonb_build_object(
    'active', true,
    'session', jsonb_build_object(
      'id', v_session.id,
      'session_token', v_session.session_token,
      'target_user_id', v_session.target_user_id,
      'target_name', v_session.metadata->>'target_name',
      'target_email', v_session.metadata->>'target_email',
      'started_at', v_session.started_at,
      'expires_at', v_session.expires_at
    )
  );
END;
$$;

GRANT ALL ON FUNCTION public.get_active_impersonation() TO authenticated;

-- Step 6: RPC to validate impersonation token (for use in frontend auth context)
CREATE OR REPLACE FUNCTION public.validate_impersonation_token(p_session_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_session RECORD;
BEGIN
  SELECT 
    ais.id,
    ais.admin_id,
    ais.target_user_id,
    ais.expires_at,
    ais.metadata
  INTO v_session
  FROM public.admin_impersonation_sessions ais
  WHERE ais.session_token = p_session_token
    AND ais.ended_at IS NULL
    AND ais.expires_at > NOW();

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired session token');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'session_id', v_session.id,
    'admin_id', v_session.admin_id,
    'target_user_id', v_session.target_user_id,
    'target_name', v_session.metadata->>'target_name',
    'target_email', v_session.metadata->>'target_email',
    'expires_at', v_session.expires_at
  );
END;
$$;

GRANT ALL ON FUNCTION public.validate_impersonation_token(TEXT) TO authenticated;

-- Step 7: Cleanup function for expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_impersonation_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Mark expired sessions as ended
  UPDATE public.admin_impersonation_sessions
  SET ended_at = NOW()
  WHERE ended_at IS NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Log cleanup
  IF v_count > 0 THEN
    INSERT INTO public.activity_logs (user_id, action, details)
    VALUES (NULL, 'impersonation_sessions_cleaned', jsonb_build_object('expired_count', v_count));
  END IF;

  RETURN v_count;
END;
$$;

GRANT ALL ON FUNCTION public.cleanup_expired_impersonation_sessions() TO service_role;

-- Migration complete
