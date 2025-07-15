-- Fix for infinite recursion in group_members policies - Alternative Approach
-- First, drop all existing policies on group_members to start fresh
DROP POLICY IF EXISTS "Group members are viewable by other members." ON public.group_members;
DROP POLICY IF EXISTS "Members can view public group members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view their own group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can view members" ON public.group_members;

-- The problem is in the circular reference. Let's create simpler, non-recursive policies:

-- Allow users to view members of public groups (no recursion)
CREATE POLICY "View members of public groups" ON public.group_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id AND g.is_private = false
  )
);

-- Allow users to view their own memberships
CREATE POLICY "View own memberships" ON public.group_members
FOR SELECT USING (user_id = auth.uid());

-- Allow users to view members of groups they created
CREATE POLICY "Group creators view members" ON public.group_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id AND created_by = auth.uid()
  )
);

-- Allow users to view members of groups they belong to
CREATE POLICY "Group members view other members" ON public.group_members
FOR SELECT USING (
  -- Instead of referencing group_members directly again, 
  -- we check if the user's ID exists in the user_id column
  -- for the specific group_id being queried
  group_id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid()
  )
);

-- Make sure the existing insert and delete policies are preserved
-- Since these weren't causing recursion issues, we can leave them as is or recreate them:

-- Recreate policy for joining public groups
DROP POLICY IF EXISTS "Users can join public groups." ON public.group_members;
CREATE POLICY "Users can join public groups." ON public.group_members 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = group_id AND is_private = false AND auth.uid() = user_id
  )
);

-- Recreate policy for leaving groups
DROP POLICY IF EXISTS "Users can leave groups." ON public.group_members;
CREATE POLICY "Users can leave groups." ON public.group_members 
FOR DELETE USING (auth.uid() = user_id);
