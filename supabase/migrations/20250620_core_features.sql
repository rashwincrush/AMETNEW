-- Core Features Database Schema for AMET Alumni Network
-- Date: 2025-06-20

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Jobs Table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  job_type TEXT CHECK (job_type IN ('full-time', 'part-time', 'contract', 'internship', 'remote')),
  posted_by UUID REFERENCES public.profiles(id),
  is_approved BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  application_deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  employer_notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, applicant_id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID NOT NULL,
  sender_id UUID REFERENCES public.profiles(id),
  recipient_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Threads Table
CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  is_archived BOOLEAN DEFAULT false,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread Participants Table (for group messaging support)
CREATE TABLE IF NOT EXISTS public.thread_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_muted BOOLEAN DEFAULT false,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(thread_id, profile_id)
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id),
  activity_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard Stats (Pre-aggregated for performance)
CREATE TABLE IF NOT EXISTS public.dashboard_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_name TEXT NOT NULL,
  stat_value NUMERIC,
  stat_period TEXT CHECK (stat_period IN ('daily', 'weekly', 'monthly', 'yearly', 'all_time')),
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(stat_name, stat_period, date_from)
);

-- RLS Policies

-- Jobs RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employers can create jobs" 
  ON public.jobs 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('employer', 'admin', 'super_admin')));

CREATE POLICY "Anyone can view approved active jobs" 
  ON public.jobs 
  FOR SELECT 
  TO authenticated
  USING (is_approved = true AND is_active = true);

CREATE POLICY "Employers can see their own jobs even if not approved" 
  ON public.jobs 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = posted_by);

CREATE POLICY "Admins can see all jobs" 
  ON public.jobs 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Employers can update their own jobs" 
  ON public.jobs 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = posted_by)
  WITH CHECK (auth.uid() = posted_by);

CREATE POLICY "Admins can update any job" 
  ON public.jobs 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Employers can delete their own jobs" 
  ON public.jobs 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = posted_by);

CREATE POLICY "Admins can delete any job" 
  ON public.jobs 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Job Applications RLS
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can apply for jobs" 
  ON public.job_applications 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Users can see their own applications" 
  ON public.job_applications 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = applicant_id);

CREATE POLICY "Employers can see applications for their jobs" 
  ON public.job_applications 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT j.posted_by 
      FROM public.jobs j 
      WHERE j.id = job_id
    )
  );

CREATE POLICY "Admins can see all applications" 
  ON public.job_applications 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Users can update their own applications" 
  ON public.job_applications 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = applicant_id AND status = 'pending')
  WITH CHECK (auth.uid() = applicant_id AND status = 'pending');

CREATE POLICY "Employers can update application status for their jobs" 
  ON public.job_applications 
  FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT j.posted_by 
      FROM public.jobs j 
      WHERE j.id = job_id
    )
  );

CREATE POLICY "Admins can update any application" 
  ON public.job_applications 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Messages RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send messages" 
  ON public.messages 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can see messages they sent or received" 
  ON public.messages 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can update their own messages" 
  ON public.messages 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Message Threads RLS
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create message threads" 
  ON public.message_threads 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can see threads they're in" 
  ON public.message_threads 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT profile_id 
      FROM public.thread_participants 
      WHERE thread_id = id
    ) OR auth.uid() = created_by
  );

CREATE POLICY "Users can update threads they created" 
  ON public.message_threads 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Thread Participants RLS
ALTER TABLE public.thread_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread creators can add participants" 
  ON public.thread_participants 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by 
      FROM public.message_threads 
      WHERE id = thread_id
    )
  );

CREATE POLICY "Users can see participants in their threads" 
  ON public.thread_participants 
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT profile_id 
      FROM public.thread_participants tp
      WHERE tp.thread_id = thread_id
    ) OR auth.uid() IN (
      SELECT created_by 
      FROM public.message_threads 
      WHERE id = thread_id
    )
  );

CREATE POLICY "Users can update their own participant status" 
  ON public.thread_participants 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Activity Logs RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert logs" 
  ON public.activity_logs 
  FOR INSERT 
  TO authenticated;

CREATE POLICY "Users can see their own activity" 
  ON public.activity_logs 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Admins can see all activity" 
  ON public.activity_logs 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

-- Dashboard Stats RLS
ALTER TABLE public.dashboard_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage dashboard stats" 
  ON public.dashboard_stats 
  FOR ALL 
  TO authenticated
  USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'super_admin')));

CREATE POLICY "Authenticated users can view dashboard stats" 
  ON public.dashboard_stats 
  FOR SELECT 
  TO authenticated;

-- Create functions for updating dashboard stats
CREATE OR REPLACE FUNCTION public.update_dashboard_stats()
RETURNS void AS $$
BEGIN
  -- Total users
  INSERT INTO public.dashboard_stats (stat_name, stat_value, stat_period, date_from, date_to)
  VALUES ('total_users', (SELECT COUNT(*) FROM public.profiles), 'all_time', NULL, NULL)
  ON CONFLICT (stat_name, stat_period, date_from)
  DO UPDATE SET stat_value = (SELECT COUNT(*) FROM public.profiles), last_updated = NOW();
  
  -- Total jobs
  INSERT INTO public.dashboard_stats (stat_name, stat_value, stat_period, date_from, date_to)
  VALUES ('total_jobs', (SELECT COUNT(*) FROM public.jobs), 'all_time', NULL, NULL)
  ON CONFLICT (stat_name, stat_period, date_from)
  DO UPDATE SET stat_value = (SELECT COUNT(*) FROM public.jobs), last_updated = NOW();
  
  -- Active jobs
  INSERT INTO public.dashboard_stats (stat_name, stat_value, stat_period, date_from, date_to)
  VALUES ('active_jobs', (SELECT COUNT(*) FROM public.jobs WHERE is_active = true AND is_approved = true), 'all_time', NULL, NULL)
  ON CONFLICT (stat_name, stat_period, date_from)
  DO UPDATE SET stat_value = (SELECT COUNT(*) FROM public.jobs WHERE is_active = true AND is_approved = true), last_updated = NOW();
  
  -- Job applications
  INSERT INTO public.dashboard_stats (stat_name, stat_value, stat_period, date_from, date_to)
  VALUES ('total_applications', (SELECT COUNT(*) FROM public.job_applications), 'all_time', NULL, NULL)
  ON CONFLICT (stat_name, stat_period, date_from)
  DO UPDATE SET stat_value = (SELECT COUNT(*) FROM public.job_applications), last_updated = NOW();
  
  -- Pending applications
  INSERT INTO public.dashboard_stats (stat_name, stat_value, stat_period, date_from, date_to)
  VALUES ('pending_applications', (SELECT COUNT(*) FROM public.job_applications WHERE status = 'pending'), 'all_time', NULL, NULL)
  ON CONFLICT (stat_name, stat_period, date_from)
  DO UPDATE SET stat_value = (SELECT COUNT(*) FROM public.job_applications WHERE status = 'pending'), last_updated = NOW();
  
  -- Messages sent today
  INSERT INTO public.dashboard_stats (stat_name, stat_value, stat_period, date_from, date_to)
  VALUES ('messages_today', (SELECT COUNT(*) FROM public.messages WHERE DATE(created_at) = CURRENT_DATE), 'daily', CURRENT_DATE, CURRENT_DATE)
  ON CONFLICT (stat_name, stat_period, date_from)
  DO UPDATE SET stat_value = (SELECT COUNT(*) FROM public.messages WHERE DATE(created_at) = CURRENT_DATE), last_updated = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to track job application status changes
CREATE OR REPLACE FUNCTION public.track_job_application_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status <> NEW.status THEN
    INSERT INTO public.activity_logs (profile_id, activity_type, entity_type, entity_id, description, metadata)
    VALUES (
      NEW.reviewed_by, 
      'job_application_status_change', 
      'job_application', 
      NEW.id, 
      'Job application status changed from ' || OLD.status || ' to ' || NEW.status,
      json_build_object(
        'job_id', NEW.job_id,
        'applicant_id', NEW.applicant_id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER job_application_status_change
AFTER UPDATE ON public.job_applications
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.track_job_application_status();
