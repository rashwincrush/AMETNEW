-- Add dashboard stats function for admin dashboard
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
    'pendingApplications', (SELECT count(*) FROM job_applications WHERE status = 'pending'),
    'totalApplications', (SELECT count(*) FROM job_applications),
    'messagesToday', (
      SELECT count(*) FROM messages 
      WHERE created_at >= CURRENT_DATE
    ),
    'usersByRole', (
      SELECT jsonb_object_agg(
        role, 
        count(*)
      )
      FROM profiles
      GROUP BY role
    ),
    'recentActivity', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', activity.id,
          'description', activity.description,
          'activityType', activity.activity_type,
          'createdAt', activity.created_at
        )
      )
      FROM (
        SELECT 
          id, 
          description, 
          activity_type, 
          created_at
        FROM activity_log
        ORDER BY created_at DESC
        LIMIT 10
      ) activity
    ),
    'lastUpdated', now()
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

COMMENT ON FUNCTION public.get_dashboard_stats() IS 'Returns statistics for the admin dashboard';

-- Create activity_log table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'activity_log') THEN
    CREATE TABLE public.activity_log (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      description text NOT NULL,
      activity_type text NOT NULL,
      user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now() NOT NULL,
      metadata jsonb DEFAULT '{}'::jsonb
    );

    -- Add RLS policies
    ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
    
    -- Only admins can select
    CREATE POLICY activity_log_select_policy ON public.activity_log 
      FOR SELECT 
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = auth.uid() AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
        )
      );
      
    -- Insert policy for authenticated users
    CREATE POLICY activity_log_insert_policy ON public.activity_log 
      FOR INSERT 
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END
$$;
