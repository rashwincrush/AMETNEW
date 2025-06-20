-- Fix for message querying and add missing RPC functions

-- 1. Create the missing get_or_create_conversation RPC function
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Check if conversation exists
  SELECT id INTO conversation_id
  FROM conversations
  WHERE (participant_1 = user1_id AND participant_2 = user2_id)
     OR (participant_1 = user2_id AND participant_2 = user1_id);
  
  -- If not exists, create it
  IF conversation_id IS NULL THEN
    INSERT INTO conversations(participant_1, participant_2, last_message_at)
    VALUES (user1_id, user2_id, NOW())
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$;

-- 2. Create a simplified function to get unread message count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(conv_id UUID, user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  count_val INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO count_val
  FROM messages
  WHERE conversation_id = conv_id
    AND sender_id != user_id
    AND read_at IS NULL;
  
  RETURN count_val;
END;
$$;

-- 3. Add policy for messages deletion (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'messages' 
    AND policyname = 'Users can delete their own messages'
  ) THEN
    CREATE POLICY "Users can delete their own messages"
      ON public.messages
      FOR DELETE
      USING (auth.uid() = sender_id);
  END IF;
END
$$;

-- 4. Make sure WebSocket subscriptions work with RLS
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations, public.messages;

-- 5. Set up proper indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_conversation_read
ON public.messages (conversation_id, sender_id, read_at);

CREATE INDEX IF NOT EXISTS idx_messages_sender_conversation
ON public.messages (sender_id, conversation_id, created_at DESC);

-- 6. Fix up the conversations table for proper tracking
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT DEFAULT NULL;
