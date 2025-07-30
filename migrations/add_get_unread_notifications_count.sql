-- Function to count unread notifications for a user
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count()
RETURNS INTEGER AS $$
DECLARE
    count INTEGER;
    uid UUID;
BEGIN
    -- Get the current user ID from auth.uid()
    uid := auth.uid();
    
    -- Count unread notifications for the current user
    SELECT COUNT(*)
    INTO count
    FROM public.notifications
    WHERE profile_id = uid
    AND is_read = false;
    
    RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count() TO authenticated;

-- Comment explaining function usage
COMMENT ON FUNCTION public.get_unread_notifications_count() IS 'Gets the count of unread notifications for the currently authenticated user.';
