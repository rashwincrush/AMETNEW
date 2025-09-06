CREATE OR REPLACE FUNCTION get_or_create_conversation(user_1_id uuid, user_2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id uuid;
BEGIN
  -- Try to find an existing 1-on-1 conversation
  SELECT c.id INTO conversation_id
  FROM conversations c
  JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
  JOIN conversation_participants cp2 ON c.id = cp2.conversation_id
  WHERE cp1.user_id = user_1_id AND cp2.user_id = user_2_id
  AND (SELECT COUNT(*) FROM conversation_participants cp WHERE cp.conversation_id = c.id) = 2;

  -- If no conversation is found, create a new one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (last_message_at)
    VALUES (NOW()) RETURNING id INTO conversation_id;

    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, user_1_id), (conversation_id, user_2_id);
  END IF;

  RETURN conversation_id;
END;
$$;
