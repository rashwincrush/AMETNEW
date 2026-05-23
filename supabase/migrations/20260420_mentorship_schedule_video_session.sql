-- RPC function to schedule a video session for mentorship
-- This function stores the scheduling details in the database
-- The actual Google Calendar API call will be made via Edge Function

begin;

-- Function to schedule a video session
CREATE OR REPLACE FUNCTION public.schedule_mentorship_video_session(
  p_mentorship_request_id UUID,
  p_scheduled_start_time TIMESTAMPTZ,
  p_scheduled_end_time TIMESTAMPTZ,
  p_timezone TEXT DEFAULT 'Asia/Kolkata'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID := auth.uid();
  v_mentorship_request RECORD;
  v_mentor_email TEXT;
  v_mentee_email TEXT;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_mentorship_request_id IS NULL THEN
    RAISE EXCEPTION 'mentorship_request_id is required';
  END IF;

  IF p_scheduled_start_time IS NULL THEN
    RAISE EXCEPTION 'scheduled_start_time is required';
  END IF;

  IF p_scheduled_end_time IS NULL THEN
    RAISE EXCEPTION 'scheduled_end_time is required';
  END IF;

  IF p_scheduled_end_time <= p_scheduled_start_time THEN
    RAISE EXCEPTION 'scheduled_end_time must be after scheduled_start_time';
  END IF;

  -- Get mentorship request details
  SELECT mr.*, 
         m.email as mentor_email,
         me.email as mentee_email
  INTO v_mentorship_request
  FROM public.mentorship_requests mr
  JOIN public.profiles m ON mr.mentor_id = m.id
  JOIN public.profiles me ON mr.mentee_id = me.id
  WHERE mr.id = p_mentorship_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mentorship_request_not_found';
  END IF;

  -- Check if user is authorized (must be mentor or mentee)
  IF v_current_user_id NOT IN (v_mentorship_request.mentor_id, v_mentorship_request.mentee_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Check if mentorship request is approved
  IF v_mentorship_request.status != 'approved' THEN
    RAISE EXCEPTION 'mentorship_request_must_be_approved';
  END IF;

  -- Update mentorship request with scheduling details
  UPDATE public.mentorship_requests
  SET 
    scheduled_start_time = p_scheduled_start_time,
    scheduled_end_time = p_scheduled_end_time,
    is_video_session_scheduled = true,
    updated_at = now()
  WHERE id = p_mentorship_request_id;

  -- Return success with details for Google Calendar API call
  SELECT jsonb_build_object(
    'success', true,
    'mentorship_request_id', p_mentorship_request_id,
    'mentor_email', v_mentorship_request.mentor_email,
    'mentee_email', v_mentorship_request.mentee_email,
    'scheduled_start_time', p_scheduled_start_time,
    'scheduled_end_time', p_scheduled_end_time,
    'timezone', p_timezone,
    'message', 'Video session scheduled successfully. Call Google Calendar API to create event with Meet link.'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Function to update mentorship request with Google Meet details
CREATE OR REPLACE FUNCTION public.update_mentorship_google_meet_details(
  p_mentorship_request_id UUID,
  p_google_meet_link TEXT,
  p_google_calendar_event_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id UUID := auth.uid();
  v_mentorship_request RECORD;
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_mentorship_request_id IS NULL THEN
    RAISE EXCEPTION 'mentorship_request_id is required';
  END IF;

  IF p_google_meet_link IS NULL THEN
    RAISE EXCEPTION 'google_meet_link is required';
  END IF;

  -- Get mentorship request details
  SELECT * INTO v_mentorship_request
  FROM public.mentorship_requests
  WHERE id = p_mentorship_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mentorship_request_not_found';
  END IF;

  -- Check if user is authorized (must be mentor or mentee)
  IF v_current_user_id NOT IN (v_mentorship_request.mentor_id, v_mentorship_request.mentee_id) THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Update mentorship request with Google Meet details
  UPDATE public.mentorship_requests
  SET 
    google_meet_link = p_google_meet_link,
    google_calendar_event_id = p_google_calendar_event_id,
    updated_at = now()
  WHERE id = p_mentorship_request_id;

  -- Return success
  SELECT jsonb_build_object(
    'success', true,
    'mentorship_request_id', p_mentorship_request_id,
    'google_meet_link', p_google_meet_link,
    'google_calendar_event_id', p_google_calendar_event_id,
    'message', 'Google Meet details updated successfully'
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.schedule_mentorship_video_session TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_mentorship_google_meet_details TO authenticated;

commit;
