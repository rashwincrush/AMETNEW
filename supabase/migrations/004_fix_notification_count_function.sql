-- Drop existing conflicting functions if they exist.
-- We drop all known variants to ensure a clean slate.
DROP FUNCTION IF EXISTS public.get_unread_notifications_count_by_type();
DROP FUNCTION IF EXISTS public.get_unread_notifications_count_by_type(text);

-- Create a single, definitive function to count unread notifications.
-- This version avoids overloading and uses a text filter.
-- An empty string '' for type_filter will count all unread notifications.
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count_by_type(type_filter text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count integer;
  auth_user_id uuid := auth.uid();
BEGIN
  SELECT count(*)
  INTO unread_count
  FROM public.notifications
  WHERE
    recipient_id = auth_user_id AND
    is_read = false AND
    (type_filter = '' OR type = type_filter);

  RETURN unread_count;
END;
$$;

-- Grant permissions to the authenticated role
GRANT EXECUTE
  ON FUNCTION public.get_unread_notifications_count_by_type(text)
  TO authenticated;

-- It's recommended to run `NOTIFY pgrst, 'reload schema';` in the Supabase SQL editor
-- after applying this migration to ensure PostgREST picks up the changes immediately.
