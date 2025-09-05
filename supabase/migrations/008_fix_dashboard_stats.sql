-- Fix get_dashboard_stats function to correct job_applications status reference
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
