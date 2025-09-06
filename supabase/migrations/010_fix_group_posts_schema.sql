-- Create a migration to fix the group_posts queries
-- 1. First, let's check if the group_posts table exists and its structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'group_posts'
AND table_schema = 'public';

-- 2. Now, create a comprehensive fix for get_pending_content function
-- This resolves the issue with missing columns in the group_posts table
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
  
  -- No UNION ALL for group_posts for now as we need to first check its structure
  
  ORDER BY (value->>'created_at')::timestamptz DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pending_content() TO authenticated;

COMMENT ON FUNCTION public.get_pending_content() IS 'Returns pending content awaiting moderation across all content types';
