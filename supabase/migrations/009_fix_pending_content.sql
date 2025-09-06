-- Fix get_pending_content function to use user_id column instead of created_by for group_posts
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

  -- Return pending content from various tables
  RETURN QUERY
  -- Pending jobs
  SELECT jsonb_build_object(
    'id', j.id,
    'title', j.title,
    'content_type', 'job',
    'created_at', j.created_at,
    'name', p.full_name,
    'user_id', j.posted_by,
    'status', CASE WHEN j.is_approved THEN 'approved' WHEN NOT j.is_active THEN 'inactive' ELSE 'pending' END,
    'content', j.description
  )
  FROM jobs j
  JOIN profiles p ON j.posted_by = p.id
  WHERE j.is_approved = false AND j.is_active = true
  
  UNION ALL
  
  -- Pending events
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
  
  -- Pending group posts - Fix: use user_id instead of created_by
  SELECT jsonb_build_object(
    'id', gp.id,
    'title', COALESCE(gp.title, 'Group Post'),
    'content_type', 'group_post',
    'created_at', gp.created_at,
    'name', p.full_name,
    'user_id', gp.user_id,
    'status', gp.status,
    'content', gp.content
  )
  FROM group_posts gp
  JOIN profiles p ON gp.user_id = p.id
  WHERE gp.status = 'pending_approval'
  
  ORDER BY (value->>'created_at')::timestamptz DESC;
END;
$$;

-- Grant permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_pending_content() TO authenticated;

COMMENT ON FUNCTION public.get_pending_content() IS 'Returns pending content awaiting moderation across all content types';
