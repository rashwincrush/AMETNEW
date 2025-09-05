-- Add user analytics function for admin dashboard
CREATE OR REPLACE FUNCTION public.get_user_analytics()
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
    RAISE EXCEPTION 'Access denied: Only administrators can access analytics';
  END IF;

  SELECT jsonb_build_object(
    'registrationsByDate', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', to_char(created_at::date, 'YYYY-MM-DD'),
          'count', count(*)
        )
      )
      FROM auth.users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY created_at::date
      ORDER BY created_at::date
    ),
    'activeUsersByDay', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', to_char(last_sign_in_at::date, 'YYYY-MM-DD'),
          'count', count(*)
        )
      )
      FROM auth.users
      WHERE last_sign_in_at >= NOW() - INTERVAL '30 days'
      GROUP BY last_sign_in_at::date
      ORDER BY last_sign_in_at::date
    ),
    'userGrowth', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'month', to_char(month_date, 'YYYY-MM'),
          'count', user_count
        )
      )
      FROM (
        SELECT 
          date_trunc('month', created_at) as month_date,
          count(*) as user_count
        FROM auth.users
        WHERE created_at >= NOW() - INTERVAL '12 months'
        GROUP BY month_date
        ORDER BY month_date
      ) monthly_growth
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.get_user_analytics() TO authenticated;

COMMENT ON FUNCTION public.get_user_analytics() IS 'Returns analytics data about user registrations and activities for admin dashboard';
