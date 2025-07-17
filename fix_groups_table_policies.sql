-- Fix for infinite recursion in groups policies and make script idempotent.

-- Drop existing policies to ensure the script is re-runnable
DROP POLICY IF EXISTS "Public groups are viewable by everyone" ON public.groups;
DROP POLICY IF EXISTS "Private groups are viewable by members" ON public.groups;
DROP POLICY IF EXISTS "Group creators can view their groups" ON public.groups;

-- Create non-recursive policies

-- Policy for public groups
CREATE POLICY "Public groups are viewable by everyone" ON public.groups
FOR SELECT USING (is_private = false);

-- Policy for private groups (avoids recursion)
CREATE POLICY "Private groups are viewable by members" ON public.groups
FOR SELECT USING (
  id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid()
  )
);

-- Policy for group creators
CREATE POLICY "Group creators can view their groups" ON public.groups
FOR SELECT USING (created_by = auth.uid());
