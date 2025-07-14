-- AMET Alumni Portal - Consolidated Database Schema
-- This file contains the complete database schema for the AMET Alumni Portal,
-- including all tables, functions, triggers, and Row Level Security (RLS) policies.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get a user's role from their profile
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT primary_role INTO user_role FROM public.profiles WHERE id = p_user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to the 'authenticated' role
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  primary_role TEXT,
  bio TEXT,
  avatar_url TEXT,
  graduation_year INTEGER,
  degree TEXT,
  major TEXT,
  location TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  is_virtual BOOLEAN DEFAULT FALSE,
  virtual_meeting_link TEXT,
  max_attendees INTEGER,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- EVENT ATTENDEES TABLE
CREATE TABLE IF NOT EXISTS public.event_attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS on event_attendees
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.event_attendees
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  location TEXT,
  job_type TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  application_url TEXT,
  contact_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on jobs
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  industry TEXT,
  size TEXT,
  founded_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- MENTORS TABLE
CREATE TABLE IF NOT EXISTS public.mentors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expertise TEXT[] NOT NULL,
  mentoring_experience_years INTEGER,
  availability TEXT,
  mentoring_capacity_hours_per_month INTEGER,
  mentoring_preferences TEXT,
  mentoring_statement TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on mentors
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.mentors
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- MENTEE PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.mentee_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  career_goals TEXT,
  areas_seeking_mentorship TEXT[],
  specific_skills_to_develop TEXT[],
  preferred_mentor_characteristics TEXT,
  time_commitment_available TEXT,
  preferred_communication_method TEXT,
  statement_of_expectations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on mentee_profiles
ALTER TABLE public.mentee_profiles ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.mentee_profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- MENTORSHIP REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mentee_id, mentor_id)
);

-- Enable RLS on mentorship_requests
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.mentorship_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- USER RESUMES TABLE
CREATE TABLE IF NOT EXISTS public.user_resumes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_resumes
ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.user_resumes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- PROFILES TABLE POLICIES
-- Policy: Users can view all profiles
CREATE POLICY "Allow authenticated users to read all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- EVENTS TABLE POLICIES
-- Policy: Anyone can view events
CREATE POLICY "Allow public read access to events" ON public.events
  FOR SELECT
  USING (true);

-- Policy: Admins and Super Admins can create events
CREATE POLICY "Allow admins to create events" ON public.events
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Policy: The user who created the event or an admin can update it
CREATE POLICY "Allow authorized users to update events" ON public.events
  FOR UPDATE
  USING (
    (auth.uid() = user_id) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: The user who created the event or an admin can delete it
CREATE POLICY "Allow authorized users to delete events" ON public.events
  FOR DELETE
  USING (
    (auth.uid() = user_id) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- EVENT ATTENDEES TABLE POLICIES
-- Policy: Authenticated users can view attendees
CREATE POLICY "Enable read access for authenticated users" ON public.event_attendees
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can register for events
CREATE POLICY "Enable insert for authenticated users" ON public.event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update their own attendance
CREATE POLICY "Enable update for own attendance" ON public.event_attendees
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own attendance
CREATE POLICY "Enable delete for own attendance" ON public.event_attendees
  FOR DELETE
  USING (auth.uid() = user_id);

-- JOBS TABLE POLICIES
-- Policy: Anyone can view job listings
CREATE POLICY "Allow public read access to jobs" ON public.jobs
  FOR SELECT
  USING (true);

-- Policy: Employers and Admins can create jobs
CREATE POLICY "Allow authorized users to create jobs" ON public.jobs
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('employer', 'admin', 'super_admin'));

-- Policy: Users can update jobs they created. Admins can update any job
CREATE POLICY "Allow authorized users to update jobs" ON public.jobs
  FOR UPDATE
  USING (
    (auth.uid() = user_id) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: Users can delete jobs they created. Admins can delete any job
CREATE POLICY "Allow authorized users to delete jobs" ON public.jobs
  FOR DELETE
  USING (
    (auth.uid() = user_id) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- MENTORS TABLE POLICIES
-- Policy: Authenticated users can view all mentor profiles
CREATE POLICY "Allow authenticated users to view mentor profiles" ON public.mentors
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can create their own mentor profile
CREATE POLICY "Allow users to create their own mentor profile" ON public.mentors
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own mentor profile
CREATE POLICY "Allow users to update their own mentor profile" ON public.mentors
  FOR UPDATE
  USING (user_id = auth.uid());

-- MENTEE PROFILES TABLE POLICIES
-- Policy: Users can view their own mentee profile. Admins can view all
CREATE POLICY "Allow users and admins to view mentee profiles" ON public.mentee_profiles
  FOR SELECT
  USING (
    (user_id = auth.uid()) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: Users can create their own mentee profile
CREATE POLICY "Allow users to create their own mentee profile" ON public.mentee_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own mentee profile
CREATE POLICY "Allow users to update their own mentee profile" ON public.mentee_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- MESSAGES TABLE POLICIES
-- Policy: Users can view messages they sent or received
CREATE POLICY "Allow users to view their own messages" ON public.messages
  FOR SELECT
  USING (auth.uid() IN (sender_id, receiver_id));

-- Policy: Users can send messages
CREATE POLICY "Allow users to send messages" ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can update messages they sent
CREATE POLICY "Allow users to update sent messages" ON public.messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- Policy: Users can delete messages they sent or received
CREATE POLICY "Allow users to delete their messages" ON public.messages
  FOR DELETE
  USING (auth.uid() IN (sender_id, receiver_id));

-- USER RESUMES TABLE POLICIES
-- Policy: Users can view their own resumes
CREATE POLICY "Allow users to view their own resumes" ON public.user_resumes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can upload their own resumes
CREATE POLICY "Allow users to upload their own resumes" ON public.user_resumes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own resumes
CREATE POLICY "Allow users to update their own resumes" ON public.user_resumes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own resumes
CREATE POLICY "Allow users to delete their own resumes" ON public.user_resumes
  FOR DELETE
  USING (auth.uid() = user_id);
