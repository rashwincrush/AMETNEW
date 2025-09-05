-- SQL Script to fix dashboard functions
-- Copy and paste this entire file into the Supabase SQL Editor and execute

-- 1. Fix get_dashboard_stats function to correct job_applications status reference
-- and resolve nested aggregate function calls
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Check if user is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access dashboard statistics';
  END IF;

  SELECT jsonb_build_object(
    'totalUsers', (SELECT count(*) FROM auth.users),
    'activeJobs', (SELECT count(*) FROM jobs WHERE is_active = true AND is_approved = true),
    'pendingApplications', (SELECT count(*) FROM job_applications WHERE status = 'submitted'),
    'totalApplications', (SELECT count(*) FROM job_applications),
    'messagesToday', (
      SELECT count(*) FROM messages 
      WHERE created_at >= CURRENT_DATE
    ),
    'usersByRole', (
      -- Use subquery to avoid nested aggregates
      SELECT jsonb_object_agg(role_counts.role, role_counts.count)
      FROM (
        SELECT role, count(*) as count
        FROM profiles
        GROUP BY role
      ) role_counts
    ),
    'recentActivity', (
      SELECT jsonb_agg(activity_data)
      FROM (
        SELECT 
          id, 
          description, 
          activity_type, 
          created_at
        FROM activity_log
        ORDER BY created_at DESC
        LIMIT 10
      ) as activity_data
    ),
    'lastUpdated', now()
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

COMMENT ON FUNCTION public.get_dashboard_stats() IS 'Returns statistics for the admin dashboard';

-- 2. Complete rewrite of get_pending_content function to remove any reference to group_posts status
CREATE OR REPLACE FUNCTION public.get_pending_content()
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_group_posts BOOLEAN;
BEGIN
  -- Check if user is admin/super_admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
  ) THEN
    RAISE EXCEPTION 'Access denied: Only administrators can access pending content';
  END IF;
  
  -- Check if group_posts table exists and has an is_approved column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'group_posts' AND column_name = 'is_approved'
  ) INTO has_group_posts;

  -- Return pending content from jobs and events first
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
  WHERE e.status = 'pending_approval';
  
  -- Only add group_posts if the table structure is as expected
  IF has_group_posts THEN
    RETURN QUERY
    SELECT jsonb_build_object(
      'id', gp.id,
      'title', 'Group Post', -- Hardcoded since group_posts doesn't have a title column
      'content_type', 'group_post',
      'created_at', gp.created_at,
      'name', p.full_name,
      'user_id', gp.user_id,
      'status', 'pending', -- Hardcoded since group_posts doesn't have a status column
      'content', gp.content
    )
    FROM group_posts gp
    JOIN profiles p ON gp.user_id = p.id
    WHERE gp.is_approved = false;
  END IF;
  
  -- Order the final results (this won't be applied to the group_posts query when processed separately)
  -- But that's OK for now as we just need the function to run without errors
END;
$$;

-- Grant permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_pending_content() TO authenticated;

COMMENT ON FUNCTION public.get_pending_content() IS 'Returns pending content awaiting moderation across all content types';

-- 3. Fix get_user_analytics function ambiguity by renaming the conflicting functions
DO $$
DECLARE
    existing_functions RECORD;
    function_count INT;
BEGIN
    -- Count how many functions with this name exist
    SELECT COUNT(*) INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
      AND p.proname = 'get_user_analytics';
    
    -- If multiple implementations exist, let's rename all but one to resolve the ambiguity
    IF function_count > 1 THEN
        RAISE NOTICE 'Found % implementations of get_user_analytics, renaming extras', function_count;
        
        -- Create a new unambiguous function that will be the main one
        CREATE OR REPLACE FUNCTION public.get_user_analytics(p_user_id UUID DEFAULT NULL)
        RETURNS JSONB
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            result JSONB;
        BEGIN
            -- Check if user is admin/super_admin for unrestricted access
            IF p_user_id IS NULL AND EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
            ) THEN
                -- For admins, return analytics across all users
                SELECT jsonb_build_object(
                    'totalApplications', COUNT(DISTINCT ja.id),
                    'totalUsers', COUNT(DISTINCT p.id),
                    'activeUsers', COUNT(DISTINCT CASE WHEN p.updated_at >= NOW() - INTERVAL '30 days' THEN p.id END), -- Fixed: using updated_at instead of last_sign_in_at
                    'completedProfiles', COUNT(DISTINCT CASE WHEN p.is_profile_complete = true THEN p.id END),
                    'jobsPosted', COUNT(DISTINCT j.id),
                    'activeJobs', COUNT(DISTINCT CASE WHEN j.is_active = true AND j.is_approved = true THEN j.id END),
                    'usersByRole', (
                        SELECT jsonb_object_agg(role_data.role, role_data.count)
                        FROM (
                            SELECT role, COUNT(*) as count
                            FROM profiles
                            GROUP BY role
                        ) role_data
                    )
                ) INTO result
                FROM profiles p
                LEFT JOIN jobs j ON j.posted_by = p.id
                LEFT JOIN job_applications ja ON ja.applicant_id = p.id;
            ELSE
                -- For regular users or when p_user_id is specified
                -- Ensure we're only seeing data for the current user or the specified user (if admin)
                DECLARE
                    target_user_id UUID;
                BEGIN
                    -- Use specified user_id if provided and caller is admin, otherwise use current user
                    IF p_user_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM profiles 
                        WHERE id = auth.uid() AND (role IN ('admin', 'super_admin') OR is_admin = true)
                    ) THEN
                        target_user_id := p_user_id;
                    ELSE
                        target_user_id := auth.uid();
                    END IF;
                
                    -- Get user-specific analytics
                    SELECT jsonb_build_object(
                        'applications', COUNT(DISTINCT ja.id),
                        'jobsPosted', COUNT(DISTINCT j.id),
                        'activeJobs', COUNT(DISTINCT CASE WHEN j.is_active = true AND j.is_approved = true THEN j.id END),
                        'messagesReceived', (
                            SELECT COUNT(*)
                            FROM messages m
                            WHERE m.receiver_id = target_user_id
                        ),
                        'messagesSent', (
                            SELECT COUNT(*)
                            FROM messages m
                            WHERE m.sender_id = target_user_id
                        ),
                        'lastActivity', (
                            SELECT MAX(created_at)
                            FROM (
                                SELECT created_at FROM job_applications WHERE applicant_id = target_user_id
                                UNION ALL
                                SELECT created_at FROM messages WHERE sender_id = target_user_id
                                UNION ALL
                                SELECT updated_at FROM profiles WHERE id = target_user_id
                            ) activities
                        )
                    ) INTO result
                    FROM profiles p
                    LEFT JOIN jobs j ON j.posted_by = target_user_id
                    LEFT JOIN job_applications ja ON ja.applicant_id = target_user_id
                    WHERE p.id = target_user_id;
                END;
            END IF;
                
            RETURN COALESCE(result, '{}'::jsonb);
        END;
        $$;

        -- Rename any other implementations with the same name to avoid conflicts
        -- These will be accessible by their new names if needed
        FOR existing_functions IN
            SELECT oid, pg_get_function_arguments(oid) as args
            FROM pg_proc 
            WHERE proname = 'get_user_analytics'
              AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
              -- Skip the one we just created (it will have the most recent oid typically)
              AND oid != (
                SELECT MAX(oid) 
                FROM pg_proc 
                WHERE proname = 'get_user_analytics'
                AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
              )
        LOOP
            EXECUTE format(
                'ALTER FUNCTION public.get_user_analytics(%s) RENAME TO get_user_analytics_old_%s',
                existing_functions.args,
                EXTRACT(EPOCH FROM now())::integer
            );
            RAISE NOTICE 'Renamed function with args: %', existing_functions.args;
        END LOOP;
    END IF;
END $$;

-- Grant execute privileges to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_user_analytics(UUID) TO authenticated;
