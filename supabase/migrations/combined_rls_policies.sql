-- Comprehensive RLS Policy Application
-- This script applies a baseline of secure RLS policies to critical tables.

-- Step 1: Fix overly permissive policy on 'event_attendees'
-- Drop the old, insecure policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_attendees;

-- Create a new, more secure policy that only allows authenticated users to view attendees.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.event_attendees;
CREATE POLICY "Enable read access for authenticated users" ON public.event_attendees
  FOR SELECT
  TO authenticated
  USING (true);


-- Step 2: Secure the 'profiles' table
-- Enable RLS on the profiles table if not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles.
-- This is a common requirement for a directory.
DROP POLICY IF EXISTS "Allow authenticated users to read all profiles" ON public.profiles;
CREATE POLICY "Allow authenticated users to read all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update their own profile.
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile.
DROP POLICY IF EXISTS "Allow users to insert their own profile" ON public.profiles;
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: Deleting a profile is handled via auth.users triggers.


-- Step 3: Secure the 'jobs' table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view job listings.
DROP POLICY IF EXISTS "Allow public read access to jobs" ON public.jobs;
CREATE POLICY "Allow public read access to jobs" ON public.jobs
  FOR SELECT
  USING (true);

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

-- Policy: Employers and Admins can create jobs.
DROP POLICY IF EXISTS "Allow authorized users to create jobs" ON public.jobs;
CREATE POLICY "Allow authorized users to create jobs" ON public.jobs
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('employer', 'admin', 'super_admin'));

-- Policy: Users can update jobs they created. Admins can update any job.
DROP POLICY IF EXISTS "Allow authorized users to update jobs" ON public.jobs;
CREATE POLICY "Allow authorized users to update jobs" ON public.jobs
  FOR UPDATE
  USING (
    (auth.uid() = user_id) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: Users can delete jobs they created. Admins can delete any job.
DROP POLICY IF EXISTS "Allow authorized users to delete jobs" ON public.jobs;
CREATE POLICY "Allow authorized users to delete jobs" ON public.jobs
  FOR DELETE
  USING (
    (auth.uid() = user_id) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- More policies for other tables will be added in subsequent steps.
-- RLS Policies for Events and Mentorship
-- This script continues the process of securing the application by applying RLS to the events and mentorship tables.

-- Step 1: Secure the 'events' table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view events.
DROP POLICY IF EXISTS "Allow public read access to events" ON public.events;
CREATE POLICY "Allow public read access to events" ON public.events
  FOR SELECT
  USING (true);

-- Policy: Admins and Super Admins can create events.
DROP POLICY IF EXISTS "Allow admins to create events" ON public.events;
CREATE POLICY "Allow admins to create events" ON public.events
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Policy: The user who created the event or an admin can update it.
-- Assumes a 'created_by' column exists on the 'events' table referencing auth.users(id).
DROP POLICY IF EXISTS "Allow authorized users to update events" ON public.events;
CREATE POLICY "Allow authorized users to update events" ON public.events
  FOR UPDATE
  USING (
    (auth.uid() = user_id) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: The user who created the event or an admin can delete it.
DROP POLICY IF EXISTS "Allow authorized users to delete events" ON public.events;
CREATE POLICY "Allow authorized users to delete events" ON public.events
  FOR DELETE
  USING (
    (auth.uid() = user_id) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );


-- Step 2: Secure the 'mentors' table
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all mentor profiles.
DROP POLICY IF EXISTS "Allow authenticated users to view mentor profiles" ON public.mentors;
CREATE POLICY "Allow authenticated users to view mentor profiles" ON public.mentors
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can create their own mentor profile.
DROP POLICY IF EXISTS "Allow users to create their own mentor profile" ON public.mentors;
CREATE POLICY "Allow users to create their own mentor profile" ON public.mentors
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own mentor profile.
DROP POLICY IF EXISTS "Allow users to update their own mentor profile" ON public.mentors;
CREATE POLICY "Allow users to update their own mentor profile" ON public.mentors
  FOR UPDATE
  USING (user_id = auth.uid());


-- Step 3: Secure the 'mentee_profiles' table
ALTER TABLE public.mentee_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own mentee profile. Admins can view all.
DROP POLICY IF EXISTS "Allow users and admins to view mentee profiles" ON public.mentee_profiles;
CREATE POLICY "Allow users and admins to view mentee profiles" ON public.mentee_profiles
  FOR SELECT
  USING (
    (user_id = auth.uid()) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: Users can create their own mentee profile.
DROP POLICY IF EXISTS "Allow users to create their own mentee profile" ON public.mentee_profiles;
CREATE POLICY "Allow users to create their own mentee profile" ON public.mentee_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own mentee profile.
DROP POLICY IF EXISTS "Allow users to update their own mentee profile" ON public.mentee_profiles;
CREATE POLICY "Allow users to update their own mentee profile" ON public.mentee_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- End of script
