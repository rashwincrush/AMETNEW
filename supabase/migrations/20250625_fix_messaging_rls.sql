-- FINAL RLS FIX FOR MESSAGING - Use this script to fix recursion errors.

-- Step 1: Drop all potentially conflicting policies on messaging-related tables.
DROP POLICY IF EXISTS "Users can access conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Users can view conversations they are in" ON public.conversations;

-- Policies on 'conversation_participants'
DROP POLICY IF EXISTS "Allow insert for new participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Allow read access to own conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert their own participation" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can insert themselves into conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants of conversations they are in" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.conversation_participants;

-- Policies on 'messages'
DROP POLICY IF EXISTS "Allow insert for messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Allow read access to messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in conversations they are in" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in conversations they are in" ON public.messages;

-- Step 2: Create or replace the SECURITY DEFINER helper function.
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid, p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- This function runs with the permissions of the user who defined it (the owner),
  -- bypassing the RLS policies of the calling user. This breaks the recursion.
  RETURN EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = p_conversation_id AND user_id = p_user_id
  );
END;
$function$;

-- Grant execute permissions to the 'authenticated' role
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(UUID, UUID) TO authenticated;

-- Step 3: Create the single, correct set of non-recursive policies.

-- Policies for 'conversations' table
CREATE POLICY "Users can access conversations they participate in" ON public.conversations
  FOR SELECT USING (public.is_conversation_participant(id, auth.uid()));

-- Policies for 'conversation_participants' table
CREATE POLICY "Users can view participants of their conversations" ON public.conversation_participants
  FOR SELECT USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can insert their own participation" ON public.conversation_participants
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policies for 'messages' table
CREATE POLICY "Users can view messages in their conversations" ON public.messages
  FOR SELECT USING (public.is_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Users can insert messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (public.is_conversation_participant(conversation_id, auth.uid()) AND sender_id = auth.uid());

-- End of Script
