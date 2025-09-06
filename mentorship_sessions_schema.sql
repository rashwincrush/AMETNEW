-- Mentorship Sessions Schema

-- Create table for mentorship sessions
CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentorship_request_id UUID REFERENCES public.mentorship_requests(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  meeting_url TEXT,
  meeting_type TEXT DEFAULT 'video', -- 'video', 'in-person', 'phone', etc.
  meeting_notes TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'canceled', 'rescheduled'
  location TEXT, -- optional location for in-person meetings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS mentorship_sessions_request_id_idx 
ON public.mentorship_sessions(mentorship_request_id);

CREATE INDEX IF NOT EXISTS mentorship_sessions_scheduled_time_idx 
ON public.mentorship_sessions(scheduled_time);

-- Trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_mentorship_sessions_updated_at
BEFORE UPDATE ON public.mentorship_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies for security

-- Enable Row Level Security
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;

-- Policy for viewing sessions (mentors and mentees can see their own sessions)
CREATE POLICY mentorship_sessions_select_policy ON public.mentorship_sessions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM mentorship_requests mr 
    WHERE mr.id = mentorship_sessions.mentorship_request_id 
    AND (mr.mentor_id = auth.uid() OR mr.mentee_id = auth.uid())
  ) OR 
  get_user_role(auth.uid()) IN ('admin', 'super_admin')
);

-- Policy for creating sessions (only mentors or admins can create)
CREATE POLICY mentorship_sessions_insert_policy ON public.mentorship_sessions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM mentorship_requests mr 
    WHERE mr.id = mentorship_request_id 
    AND mr.mentor_id = auth.uid() 
    AND mr.status = 'approved'
  ) OR 
  get_user_role(auth.uid()) IN ('admin', 'super_admin')
);

-- Policy for updating sessions (mentors can update their sessions)
CREATE POLICY mentorship_sessions_update_policy ON public.mentorship_sessions
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM mentorship_requests mr 
    WHERE mr.id = mentorship_sessions.mentorship_request_id 
    AND mr.mentor_id = auth.uid()
  ) OR 
  get_user_role(auth.uid()) IN ('admin', 'super_admin')
);

-- Policy for deleting sessions (only mentors or admins can delete)
CREATE POLICY mentorship_sessions_delete_policy ON public.mentorship_sessions
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM mentorship_requests mr 
    WHERE mr.id = mentorship_sessions.mentorship_request_id 
    AND mr.mentor_id = auth.uid()
  ) OR 
  get_user_role(auth.uid()) IN ('admin', 'super_admin')
);
