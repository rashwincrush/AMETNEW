-- First, drop all existing policies on the profiles table
DO $$
DECLARE
   policy_rec RECORD;
BEGIN
   FOR policy_rec IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') 
   LOOP
      EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.profiles', policy_rec.policyname);
   END LOOP;
END
$$;

-- Re-create basic policies without circular references
-- 1. Select: Everyone can view profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT USING (true);

-- 2. Insert: Users can only insert their own profile
CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 3. Update: Users can only update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Delete: Users can only delete their own profile (if needed)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Analyze the profiles table to refresh statistics
ANALYZE public.profiles;
