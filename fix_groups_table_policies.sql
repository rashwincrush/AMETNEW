-- Fix for infinite recursion in groups policies
-- Drop any problematic policies on the groups table
DROP POLICY IF EXISTS "Private groups are viewable by members." ON public.groups;

-- Replace with non-recursive policies
-- Policy for public groups (no recursion)
CREATE POLICY "Public groups are viewable by everyone" ON public.groups
FOR SELECT USING (is_private = false);

-- Policy for private groups (avoids recursion by using IN instead of EXISTS)
CREATE POLICY "Private groups are viewable by members" ON public.groups
FOR SELECT USING (
  id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid()
  )
);

-- Policy for group creators (no recursion)
CREATE POLICY "Group creators can view their groups" ON public.groups
FOR SELECT USING (created_by = auth.uid());
