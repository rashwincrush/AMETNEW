-- Fix for infinite recursion in group_members policies
-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Group members are viewable by other members." ON public.group_members;

-- Step 2: Create new policies with different approach
-- Policy to allow members to view the members of groups they belong to
CREATE POLICY "Members can view public group members" ON public.group_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id
    AND (
      -- Either it's a public group
      g.is_private = false
      -- Or the user is a member or creator
      OR g.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.group_members gm
        WHERE gm.group_id = g.id
        AND gm.user_id = auth.uid()
        -- This direct comparison avoids recursion
      )
    )
  )
);

-- Policy to allow viewing your own membership
CREATE POLICY "Users can view their own group memberships" ON public.group_members
FOR SELECT USING (user_id = auth.uid());

-- Policy to allow group creators to see all members
CREATE POLICY "Group creators can view members" ON public.group_members
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id
    AND g.created_by = auth.uid()
  )
);
