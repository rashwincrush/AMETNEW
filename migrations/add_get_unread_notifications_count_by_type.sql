-- Function to count unread notifications for a user grouped by type
CREATE OR REPLACE FUNCTION public.get_unread_notifications_count_by_type()
RETURNS TABLE(notification_type text, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        type as notification_type,
        COUNT(*) as count
    FROM 
        public.notifications
    WHERE 
        profile_id = auth.uid()
        AND is_read = false
    GROUP BY 
        type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_unread_notifications_count_by_type() TO authenticated;

-- Comment explaining function usage
COMMENT ON FUNCTION public.get_unread_notifications_count_by_type() IS 'Gets the count of unread notifications grouped by type for the currently authenticated user.';
