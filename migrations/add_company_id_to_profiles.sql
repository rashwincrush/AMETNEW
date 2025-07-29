-- Add employer-related fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_employer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_website TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS company_location TEXT;

-- Update the handle_new_user function to include employer fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    created_at,
    role,
    is_verified,
    first_name,
    last_name,
    phone,
    is_employer,
    company_name,
    company_website,
    industry
  )
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', NEW.raw_user_meta_data ->> 'role', 'alumni'),
    false,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    (COALESCE(NEW.raw_user_meta_data ->> 'role', '') = 'employer')::boolean,
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'company_website',
    NEW.raw_user_meta_data ->> 'industry'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add RLS policies for profiles
ALTER TABLE public.profiles 
ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own profile
CREATE POLICY update_own_profile_policy
ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow admins to read all profiles
CREATE POLICY admin_read_all_profiles
ON public.profiles
FOR SELECT TO authenticated
USING (
  (auth.uid() = id) OR 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow employers to post jobs
CREATE POLICY "Employers can post jobs"
ON public.jobs
FOR INSERT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'employer' OR is_employer = true)
  )
);
