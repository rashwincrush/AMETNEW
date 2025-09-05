-- Drop the existing function first to ensure a clean replacement
DROP FUNCTION IF EXISTS public.get_pending_content();

-- Create a completely new implementation without any reference to gp.status
CREATE OR REPLACE FUNCTION public.get_pending_content()
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access pending content';
  END IF;

  -- Return pending content from jobs and events only
  -- We'll separately handle group_posts to avoid any column reference issues
  RETURN QUERY
  
  -- First part: Pending jobs
  SELECT jsonb_build_object(
    'id', j.id,
    'title', j.title,
    'content_type', 'job',
    'created_at', j.created_at,
    'name', p.full_name,
    'user_id', j.posted_by,
    'status', 'pending',
    'content', j.description
  )
  FROM jobs j
  JOIN profiles p ON j.posted_by = p.id
  WHERE j.is_approved = false AND j.is_active = true
  
  UNION ALL
  
  -- Second part: Pending events
  SELECT jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'content_type', 'event',
    'created_at', e.created_at,
    'name', p.full_name,
    'user_id', e.created_by,
    'status', e.status,
    'content', e.description
  )
  FROM events e
  JOIN profiles p ON e.created_by = p.id
  WHERE e.status = 'pending_approval'
  
  UNION ALL
  
  -- Third part: Group posts with careful column selection
  -- Removing any reference to problematic columns like status or title
  SELECT jsonb_build_object(
    'id', gp.id,
    'title', 'Group Post',  -- Hardcoded title
    'content_type', 'group_post',
    'created_at', gp.created_at,
    'name', p.full_name,
    'user_id', gp.user_id,
    'status', 'pending',    -- Hardcoded status
    'content', gp.content
  )
  FROM group_posts gp
  JOIN profiles p ON gp.user_id = p.id
  -- Using is_approved boolean flag instead of status column
  WHERE gp.is_approved = false
  
  ORDER BY (value->>'created_at')::timestamptz DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pending_content() TO authenticated;

COMMENT ON FUNCTION public.get_pending_content() IS 'Returns pending content awaiting moderation across all content types';
