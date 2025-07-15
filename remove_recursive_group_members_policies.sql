-- Break mutual recursion by removing group_members SELECT policies that reference groups

-- Drop policies that reference groups to avoid reciprocal dependency
DROP POLICY IF EXISTS "View members of public groups" ON public.group_members;
DROP POLICY IF EXISTS "Group creators view members" ON public.group_members;

-- Now group_members SELECT is governed by:
-- 1. View own memberships (user_id = auth.uid())
-- 2. Group members view other members (group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()))
-- This allows members to see other members while avoiding references to the groups table.

-- No changes needed for INSERT/DELETE policies, as they do not participate in SELECT recursion.
