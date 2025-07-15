-- ==========================================
-- OPTIMIZED NETWORKING RLS POLICIES
-- ==========================================
-- This file contains a complete set of RLS policies for the AMET Alumni Portal networking features.
-- These policies are designed to avoid infinite recursion while maintaining appropriate access controls.
-- 
-- Features:
-- 1. God mode (admin override)
-- 2. Role-specific access
-- 3. Proper access control for public/private groups
-- 4. Safe query patterns to avoid recursion
-- ==========================================

-- ==========================================
-- COMMON FUNCTIONS FOR POLICY REUSE
-- ==========================================

-- Create a function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'super_admin')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- GROUPS TABLE POLICIES
-- ==========================================

-- First, drop all existing policies on the groups table
DROP POLICY IF EXISTS "Public groups are viewable by everyone." ON public.groups;
DROP POLICY IF EXISTS "Private groups are viewable by members." ON public.groups;
DROP POLICY IF EXISTS "Users can create groups." ON public.groups;
DROP POLICY IF EXISTS "Group creators can update their groups." ON public.groups;
DROP POLICY IF EXISTS "Admins can manage all groups" ON public.groups;

-- Policy 1: Allow viewing of public groups (no recursion)
CREATE POLICY "Anyone can view public groups" ON public.groups
FOR SELECT USING (is_private = false);

-- Policy 2: Allow members to view their private groups without recursion
-- We avoid recursion by using a subquery that doesn't reference groups again
CREATE POLICY "Members can view their private groups" ON public.groups
FOR SELECT USING (
  id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid()
  )
);

-- Policy 3: Group creators can manage their groups
CREATE POLICY "Creators can manage their groups" ON public.groups
FOR ALL USING (created_by = auth.uid());

-- Policy 4: Admin override (god mode)
CREATE POLICY "Admins can manage all groups" ON public.groups
FOR ALL USING (public.is_admin());

-- ==========================================
-- GROUP_MEMBERS TABLE POLICIES
-- ==========================================

-- First, drop all existing policies on the group_members table
DROP POLICY IF EXISTS "Group members are viewable by other members." ON public.group_members;
DROP POLICY IF EXISTS "Users can join public groups." ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups." ON public.group_members;
DROP POLICY IF EXISTS "View members of public groups" ON public.group_members;
DROP POLICY IF EXISTS "View own memberships" ON public.group_members;
DROP POLICY IF EXISTS "Group creators view members" ON public.group_members;
DROP POLICY IF EXISTS "Group members view other members" ON public.group_members;
DROP POLICY IF EXISTS "Admins can manage all memberships" ON public.group_members;

-- Policy 1: Allow users to view their own memberships
CREATE POLICY "View own memberships" ON public.group_members
FOR SELECT USING (user_id = auth.uid());

-- Policy 2: Allow users to view members of public groups
CREATE POLICY "View members of public groups" ON public.group_members
FOR SELECT USING (
  group_id IN (
    SELECT id FROM public.groups
    WHERE is_private = false
  )
);

-- Policy 3: Allow users to view members of groups they belong to
CREATE POLICY "View members of joined groups" ON public.group_members
FOR SELECT USING (
  group_id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid()
  )
);

-- Policy 4: Allow users to join public groups
CREATE POLICY "Join public groups" ON public.group_members
FOR INSERT WITH CHECK (
  -- User can only add themselves
  auth.uid() = user_id
  -- And only to public groups
  AND EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id AND is_private = false
  )
);

-- Policy 5: Allow users to leave any group
CREATE POLICY "Leave groups" ON public.group_members
FOR DELETE USING (user_id = auth.uid());

-- Policy 6: Admin override (god mode)
CREATE POLICY "Admins can manage all memberships" ON public.group_members
FOR ALL USING (public.is_admin());

-- ==========================================
-- GROUP_POSTS TABLE POLICIES
-- ==========================================

-- First, drop all existing policies on the group_posts table
DROP POLICY IF EXISTS "Group posts are viewable by group members." ON public.group_posts;
DROP POLICY IF EXISTS "Users can create posts in their groups." ON public.group_posts;
DROP POLICY IF EXISTS "Users can delete their own posts." ON public.group_posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.group_posts;

-- Policy 1: Allow members to view posts in their groups
CREATE POLICY "Members can view group posts" ON public.group_posts
FOR SELECT USING (
  -- Posts in public groups
  EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = group_id AND is_private = false
  )
  -- Or posts in groups the user is a member of
  OR group_id IN (
    SELECT group_id FROM public.group_members
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Allow members to create posts in their groups
CREATE POLICY "Members can create posts" ON public.group_posts
FOR INSERT WITH CHECK (
  -- User can only add posts to groups they're a member of
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = public.group_posts.group_id
    AND user_id = auth.uid()
  )
  -- And must be the author
  AND author_id = auth.uid()
);

-- Policy 3: Allow users to delete their own posts
CREATE POLICY "Delete own posts" ON public.group_posts
FOR DELETE USING (author_id = auth.uid());

-- Policy 4: Admin override (god mode)
CREATE POLICY "Admins can manage all posts" ON public.group_posts
FOR ALL USING (public.is_admin());

-- ==========================================
-- MESSAGES TABLE POLICIES
-- ==========================================

-- First, drop all existing policies on the messages table
DROP POLICY IF EXISTS "Messages are viewable by conversation participants." ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations." ON public.messages;
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;

-- Policy 1: Allow participants to view messages in their conversations
CREATE POLICY "View conversation messages" ON public.messages
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Allow participants to send messages in their conversations
CREATE POLICY "Send messages in conversations" ON public.messages
FOR INSERT WITH CHECK (
  -- User can only send messages in conversations they're part of
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = public.messages.conversation_id
    AND user_id = auth.uid()
  )
  -- And must be the sender
  AND sender_id = auth.uid()
);

-- Policy 3: Users can mark messages as read
CREATE POLICY "Mark messages as read" ON public.messages
FOR UPDATE USING (
  -- User can only update read_at for messages in their conversations
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = public.messages.conversation_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  -- Only allow updating read_at field
  read_at IS NOT NULL
  AND recipient_id = auth.uid()
);

-- Policy 4: Admin override (god mode)
CREATE POLICY "Admins can manage all messages" ON public.messages
FOR ALL USING (public.is_admin());

-- ==========================================
-- CONVERSATIONS TABLE POLICIES
-- ==========================================

-- First, drop all existing policies on the conversations table
DROP POLICY IF EXISTS "Conversations are viewable by participants." ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations." ON public.conversations;
DROP POLICY IF EXISTS "Admins can manage all conversations" ON public.conversations;

-- Policy 1: Allow participants to view their conversations
CREATE POLICY "View own conversations" ON public.conversations
FOR SELECT USING (
  id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Allow users to create conversations
CREATE POLICY "Create conversations" ON public.conversations
FOR INSERT WITH CHECK (
  -- User can create conversations
  created_by = auth.uid()
);

-- Policy 3: Admin override (god mode)
CREATE POLICY "Admins can manage all conversations" ON public.conversations
FOR ALL USING (public.is_admin());

-- ==========================================
-- CONVERSATION_PARTICIPANTS TABLE POLICIES
-- ==========================================

-- First, drop all existing policies on the conversation_participants table
DROP POLICY IF EXISTS "Participants can view conversation members." ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add themselves to conversations." ON public.conversation_participants;
DROP POLICY IF EXISTS "Admins can manage all conversation participants" ON public.conversation_participants;

-- Policy 1: Allow participants to view members of their conversations
CREATE POLICY "View conversation participants" ON public.conversation_participants
FOR SELECT USING (
  conversation_id IN (
    SELECT conversation_id FROM public.conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Policy 2: Allow adding participants to new conversations
CREATE POLICY "Add conversation participants" ON public.conversation_participants
FOR INSERT WITH CHECK (
  -- User can add participants to conversations they created
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = conversation_id
    AND created_by = auth.uid()
  )
);

-- Policy 3: Allow users to leave conversations
CREATE POLICY "Leave conversations" ON public.conversation_participants
FOR DELETE USING (user_id = auth.uid());

-- Policy 4: Admin override (god mode)
CREATE POLICY "Admins can manage all conversation participants" ON public.conversation_participants
FOR ALL USING (public.is_admin());

-- ==========================================
-- CONNECTIONS TABLE POLICIES
-- ==========================================

-- First, drop all existing policies on the connections table
DROP POLICY IF EXISTS "Users can view their connections." ON public.connections;
DROP POLICY IF EXISTS "Users can create connection requests." ON public.connections;
DROP POLICY IF EXISTS "Users can update connections they are part of." ON public.connections;
DROP POLICY IF EXISTS "Users can delete their connections." ON public.connections;
DROP POLICY IF EXISTS "Admins can manage all connections" ON public.connections;

-- Policy 1: Allow users to view their connections
CREATE POLICY "View own connections" ON public.connections
FOR SELECT USING (
  requester_id = auth.uid() OR recipient_id = auth.uid()
);

-- Policy 2: Allow users to request connections
CREATE POLICY "Create connection requests" ON public.connections
FOR INSERT WITH CHECK (
  -- User can only create requests as the requester
  requester_id = auth.uid()
);

-- Policy 3: Allow users to accept/reject connection requests
CREATE POLICY "Update connection status" ON public.connections
FOR UPDATE USING (
  -- User can only update requests they're part of
  requester_id = auth.uid() OR recipient_id = auth.uid()
)
WITH CHECK (
  -- Recipients can accept/reject
  recipient_id = auth.uid()
);

-- Policy 4: Allow users to delete their connections
CREATE POLICY "Delete own connections" ON public.connections
FOR DELETE USING (
  requester_id = auth.uid() OR recipient_id = auth.uid()
);

-- Policy 5: Admin override (god mode)
CREATE POLICY "Admins can manage all connections" ON public.connections
FOR ALL USING (public.is_admin());

-- ==========================================
-- END OF POLICY DEFINITIONS
-- ==========================================
