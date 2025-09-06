-- Add function to retrieve pending content for moderation
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
  
  -- Pending group posts
  SELECT jsonb_build_object(
    'id', gp.id,
    'title', COALESCE(gp.title, 'Group Post'),
    'content_type', 'group_post',
    'created_at', gp.created_at,
    'name', p.full_name,
    'user_id', gp.created_by,
    'status', gp.status,
    'content', gp.content
  )
  FROM group_posts gp
  JOIN profiles p ON gp.created_by = p.id
  WHERE gp.status = 'pending_approval'
  
  ORDER BY (value->>'created_at')::timestamptz DESC;
END;
$$;

-- Grant permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_pending_content() TO authenticated;

COMMENT ON FUNCTION public.get_pending_content() IS 'Returns pending content awaiting moderation across all content types';

-- Create moderate_content function for handling content approval/rejection
CREATE OR REPLACE FUNCTION public.moderate_content(
  p_content_id uuid,
  p_content_type text,
  p_action text -- 'approve' or 'reject'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can moderate content';
  END IF;
  
  -- Check valid action
  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid action: Must be "approve" or "reject"';
  END IF;
  
  -- Handle different content types
  CASE p_content_type
    WHEN 'job' THEN
      IF p_action = 'approve' THEN
        UPDATE jobs SET is_approved = true WHERE id = p_content_id;
      ELSE
        UPDATE jobs SET is_active = false WHERE id = p_content_id;
      END IF;
      
    WHEN 'event' THEN
      IF p_action = 'approve' THEN
        UPDATE events SET status = 'active' WHERE id = p_content_id;
      ELSE
        UPDATE events SET status = 'rejected' WHERE id = p_content_id;
      END IF;
      
    WHEN 'group_post' THEN
      IF p_action = 'approve' THEN
        UPDATE group_posts SET status = 'approved' WHERE id = p_content_id;
      ELSE
        UPDATE group_posts SET status = 'rejected' WHERE id = p_content_id;
      END IF;
      
    ELSE
      RAISE EXCEPTION 'Unsupported content type: %', p_content_type;
  END CASE;
  
  -- Log the moderation action
  INSERT INTO public.activity_log (
    description,
    activity_type,
    user_id,
    metadata
  ) VALUES (
    p_action || 'd ' || p_content_type || ' (ID: ' || p_content_id || ')',
    'content_moderation',
    auth.uid(),
    jsonb_build_object(
      'content_id', p_content_id,
      'content_type', p_content_type,
      'action', p_action
    )
  );
END;
$$;

-- Grant permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.moderate_content(uuid, text, text) TO authenticated;

COMMENT ON FUNCTION public.moderate_content(uuid, text, text) IS 'Approves or rejects content and logs the moderation action';
