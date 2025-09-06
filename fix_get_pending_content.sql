-- COMPLETE FIX FOR get_pending_content FUNCTION
-- This completely removes any references to group_posts.status column
-- and separates each content type to avoid any cross-table reference issues

-- First drop the existing function to ensure a clean slate
DROP FUNCTION IF EXISTS public.get_pending_content();

-- Create our corrected function
CREATE OR REPLACE FUNCTION public.get_pending_content()
RETURNS TABLE(data jsonb) 
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

  -- Pending jobs
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', j.id,
    'title', j.title,
    'content_type', 'job',
    'created_at', j.created_at,
    'name', p.full_name,
    'user_id', j.posted_by,
    'status', 'pending',
    'content', j.description
  ) AS data
  FROM jobs j
  JOIN profiles p ON j.posted_by = p.id
  WHERE j.is_approved = false AND j.is_active = true;
  
  -- Pending events
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'content_type', 'event',
    'created_at', e.created_at,
    'name', p.full_name,
    'user_id', e.created_by,
    'status', e.status,
    'content', e.description
  ) AS data
  FROM events e
  JOIN profiles p ON e.created_by = p.id
  WHERE e.status = 'pending_approval';
  
  -- Pending group posts - Handle separately to avoid column reference issues
  RETURN QUERY
  SELECT jsonb_build_object(
    'id', gp.id,
    'title', 'Group Post', -- Hardcoded title
    'content_type', 'group_post',
    'created_at', gp.created_at,
    'name', p.full_name,
    'user_id', gp.user_id,
    'status', 'pending', -- Hardcoded status
    'content', gp.content
  ) AS data
  FROM group_posts gp
  JOIN profiles p ON gp.user_id = p.id
  WHERE gp.is_approved = false
  ORDER BY gp.created_at DESC;

END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_pending_content() TO authenticated;

COMMENT ON FUNCTION public.get_pending_content() IS 'Returns pending content awaiting moderation across all content types';
