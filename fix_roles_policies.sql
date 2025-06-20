-- First, drop all existing policies on the roles table
DO $$
DECLARE
   policy_rec RECORD;
BEGIN
   FOR policy_rec IN (SELECT policyname FROM pg_policies WHERE tablename = 'roles' AND schemaname = 'public') 
   LOOP
      EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.roles', policy_rec.policyname);
   END LOOP;
END
$$;

-- Re-create basic policies without circular references
-- 1. Select: Everyone can view roles
CREATE POLICY "Roles are viewable by everyone" 
ON public.roles 
FOR SELECT USING (true);

-- 2. Insert: Only super_admin can insert roles
CREATE POLICY "Super admins can create roles" 
ON public.roles 
FOR INSERT 
WITH CHECK (auth.uid() IN (
   SELECT id FROM public.profiles WHERE role = 'super_admin'
));

-- 3. Update: Only super_admin can update roles
CREATE POLICY "Super admins can update roles"
ON public.roles
FOR UPDATE
USING (auth.uid() IN (
   SELECT id FROM public.profiles WHERE role = 'super_admin'
))
WITH CHECK (auth.uid() IN (
   SELECT id FROM public.profiles WHERE role = 'super_admin'
));

-- 4. Delete: Only super_admin can delete roles
CREATE POLICY "Super admins can delete roles"
ON public.roles
FOR DELETE
USING (auth.uid() IN (
   SELECT id FROM public.profiles WHERE role = 'super_admin'
));

-- Analyze the roles table to refresh statistics
ANALYZE public.roles;
