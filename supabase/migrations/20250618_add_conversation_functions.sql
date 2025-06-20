-- SQL functions for conversation handling in Alumni Management System

-- Function to get conversations for a specific user with participant details
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP,
  participant_id UUID,
  participant_name TEXT,
  participant_avatar TEXT,
  is_online BOOLEAN,
  unread_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.last_message_at,
    c.created_at,
    CASE
      WHEN c.participant_1 = p_user_id THEN c.participant_2
      ELSE c.participant_1
    END AS participant_id,
    CASE
      WHEN c.participant_1 = p_user_id THEN p2.full_name
      ELSE p1.full_name
    END AS participant_name,
    CASE
      WHEN c.participant_1 = p_user_id THEN p2.avatar_url
      ELSE p1.avatar_url
    END AS participant_avatar,
    CASE
      WHEN c.participant_1 = p_user_id THEN COALESCE(p2.is_online, FALSE)
      ELSE COALESCE(p1.is_online, FALSE)
    END AS is_online,
    COUNT(m.id) FILTER (WHERE m.sender_id != p_user_id AND m.read_at IS NULL) AS unread_count
  FROM
    conversations c
    JOIN profiles p1 ON c.participant_1 = p1.id
    JOIN profiles p2 ON c.participant_2 = p2.id
    LEFT JOIN messages m ON m.conversation_id = c.id AND m.read_at IS NULL AND m.sender_id != p_user_id
  WHERE
    c.participant_1 = p_user_id OR c.participant_2 = p_user_id
  GROUP BY
    c.id, c.last_message_at, c.created_at, p1.full_name, p2.full_name, p1.avatar_url, p2.avatar_url,
    p1.is_online, p2.is_online
  ORDER BY
    c.last_message_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the latest message in a conversation
CREATE OR REPLACE FUNCTION public.get_latest_message(p_conversation_id UUID)
RETURNS TABLE (
  message_id UUID,
  content TEXT,
  sender_id UUID,
  sender_name TEXT,
  created_at TIMESTAMP,
  message_type VARCHAR,
  attachment_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS message_id,
    m.content,
    m.sender_id,
    p.full_name AS sender_name,
    m.created_at,
    m.message_type,
    m.attachment_url
  FROM
    messages m
    JOIN profiles p ON m.sender_id = p.id
  WHERE
    m.conversation_id = p_conversation_id
  ORDER BY
    m.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all messages in a conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(p_conversation_id UUID, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE 
    conversation_id = p_conversation_id 
    AND sender_id != p_user_id 
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations"
  ON public.conversations
  FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations they are part of"
  ON public.conversations
  FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations
  FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Add RLS policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
    )
  );

CREATE POLICY "Users can update their own messages or mark received messages as read"
  ON public.messages
  FOR UPDATE
  USING (
    auth.uid() = sender_id OR
    (
      EXISTS (
        SELECT 1 FROM conversations c
        WHERE c.id = conversation_id
        AND (auth.uid() = c.participant_1 OR auth.uid() = c.participant_2)
      )
      AND EXISTS (
        SELECT 1 FROM messages m
        WHERE m.id = id
        AND m.sender_id != auth.uid()
      )
    )
  );
