-- Triggers for real-time messaging system

-- Add message_type column to messages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'messages'
                AND column_name = 'message_type') 
  THEN
    ALTER TABLE public.messages ADD COLUMN message_type VARCHAR(20) DEFAULT 'text';
  END IF;
END $$;

-- Add attachment_url column to messages if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'messages'
                AND column_name = 'attachment_url') 
  THEN
    ALTER TABLE public.messages ADD COLUMN attachment_url TEXT;
  END IF;
END $$;

-- Create a function to update the last_message_at timestamp in the conversations table
CREATE OR REPLACE FUNCTION update_conversation_last_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation's last_message_at timestamp
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to run the function after inserting a new message
DROP TRIGGER IF EXISTS update_conversation_timestamp ON public.messages;
CREATE TRIGGER update_conversation_timestamp
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message_timestamp();

-- Create a function to notify participants when a new message is received
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  participant_1_id UUID;
  participant_2_id UUID;
BEGIN
  -- Get the conversation participants
  SELECT participant_1, participant_2 INTO participant_1_id, participant_2_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;
  
  -- Update unread count for the other participant (not the sender)
  -- This is used for notification badges
  IF participant_1_id = NEW.sender_id THEN
    -- Sender is participant 1, notify participant 2
    PERFORM pg_notify(
      'new_message',
      json_build_object(
        'user_id', participant_2_id,
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      )::text
    );
  ELSE
    -- Sender is participant 2, notify participant 1
    PERFORM pg_notify(
      'new_message',
      json_build_object(
        'user_id', participant_1_id,
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'message_id', NEW.id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for the notification function
DROP TRIGGER IF EXISTS message_notification ON public.messages;
CREATE TRIGGER message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION notify_new_message();

-- Create storage bucket for message attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'message_attachments', 'message_attachments', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'message_attachments'
);

-- Set up storage policy for message attachments
DO $$ 
BEGIN
  -- Delete any existing policies first to avoid conflicts
  BEGIN
    DROP POLICY IF EXISTS "Message attachment access policy" ON storage.objects;
  EXCEPTION
    WHEN undefined_object THEN
      -- Policy doesn't exist, do nothing
  END;

  -- Create policy for all authenticated users to read message attachments
  CREATE POLICY "Message attachment access policy"
    ON storage.objects FOR ALL
    USING (bucket_id = 'message_attachments')
    WITH CHECK (bucket_id = 'message_attachments');
END $$;
