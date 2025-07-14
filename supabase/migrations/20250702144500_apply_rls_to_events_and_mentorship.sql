-- RLS Policies for Events and Mentorship
-- This script continues the process of securing the application by applying RLS to the events and mentorship tables.

-- Step 1: Secure the 'events' table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view events.
CREATE POLICY "Allow public read access to events" ON public.events
  FOR SELECT
  USING (true);

-- Policy: Admins and Super Admins can create events.
CREATE POLICY "Allow admins to create events" ON public.events
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'super_admin'));

-- Policy: The user who created the event or an admin can update it.
-- Assumes a 'created_by' column exists on the 'events' table referencing auth.users(id).
CREATE POLICY "Allow authorized users to update events" ON public.events
  FOR UPDATE
  USING (
    (auth.uid() = created_by) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: The user who created the event or an admin can delete it.
CREATE POLICY "Allow authorized users to delete events" ON public.events
  FOR DELETE
  USING (
    (auth.uid() = created_by) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );


-- Step 2: Secure the 'mentors' table
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all mentor profiles.
CREATE POLICY "Allow authenticated users to view mentor profiles" ON public.mentors
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Users can create their own mentor profile.
CREATE POLICY "Allow users to create their own mentor profile" ON public.mentors
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own mentor profile.
CREATE POLICY "Allow users to update their own mentor profile" ON public.mentors
  FOR UPDATE
  USING (user_id = auth.uid());


-- Step 3: Secure the 'mentee_profiles' table
ALTER TABLE public.mentee_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own mentee profile. Admins can view all.
CREATE POLICY "Allow users and admins to view mentee profiles" ON public.mentee_profiles
  FOR SELECT
  USING (
    (user_id = auth.uid()) OR (get_user_role(auth.uid()) IN ('admin', 'super_admin'))
  );

-- Policy: Users can create their own mentee profile.
CREATE POLICY "Allow users to create their own mentee profile" ON public.mentee_profiles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own mentee profile.
CREATE POLICY "Allow users to update their own mentee profile" ON public.mentee_profiles
  FOR UPDATE
  USING (user_id = auth.uid());

-- End of script
