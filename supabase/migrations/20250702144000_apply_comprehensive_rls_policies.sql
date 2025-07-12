-- Comprehensive RLS Policy Application
-- This script applies a baseline of secure RLS policies to critical tables.

-- Step 1: Fix overly permissive policy on 'event_attendees'
-- Drop the old, insecure policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.event_attendees;

-- Create a new, more secure policy that only allows authenticated users to view attendees.
CREATE POLICY "Enable read access for authenticated users" ON public.event_attendees
  FOR SELECT
  TO authenticated
  USING (true);


-- Step 2: Secure the 'profiles' table
-- Enable RLS on the profiles table if not already enabled.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles.
-- This is a common requirement for a directory.
CREATE POLICY "Allow authenticated users to read all profiles" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can update their own profile.
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can insert their own profile.
CREATE POLICY "Allow users to insert their own profile" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Note: Deleting a profile is handled via auth.users triggers.


-- Step 3: Secure the 'jobs' table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view job listings.
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
CREATE POLICY "Allow authorized users to create jobs" ON public.jobs
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('employer', 'admin', 'super_admin'));

-- Policy: Users can update jobs they created. Admins can update any job.
CREATE POLICY "Allow authorized users to update jobs" ON public.jobs
  FOR UPDATE
  USING (
    (auth.uid() = created_by) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: Users can delete jobs they created. Admins can delete any job.
CREATE POLICY "Allow authorized users to delete jobs" ON public.jobs
  FOR DELETE
  USING (
    (auth.uid() = created_by) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- More policies for other tables will be added in subsequent steps.
