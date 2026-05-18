-- Add Google Calendar and Google Meet integration fields to mentorship_requests table
-- This enables scheduling 1-on-1 mentorship video sessions with automatic Google Meet link generation

begin;

-- Add Google Meet and Calendar fields to mentorship_requests
ALTER TABLE public.mentorship_requests
  ADD COLUMN IF NOT EXISTS google_meet_link TEXT,
  ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_video_session_scheduled BOOLEAN DEFAULT false;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_video_scheduled
  ON public.mentorship_requests(is_video_session_scheduled)
  WHERE is_video_session_scheduled = true;

CREATE INDEX IF NOT EXISTS idx_mentorship_requests_scheduled_time
  ON public.mentorship_requests(scheduled_start_time)
  WHERE scheduled_start_time IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.mentorship_requests.google_meet_link IS 'Google Meet link for video session (generated automatically via Google Calendar API)';
COMMENT ON COLUMN public.mentorship_requests.google_calendar_event_id IS 'Google Calendar event ID for the scheduled session';
COMMENT ON COLUMN public.mentorship_requests.scheduled_start_time IS 'Scheduled start time for video session';
COMMENT ON COLUMN public.mentorship_requests.scheduled_end_time IS 'Scheduled end time for video session';
COMMENT ON COLUMN public.mentorship_requests.is_video_session_scheduled IS 'Flag indicating if a video session has been scheduled';

commit;
