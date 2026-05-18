-- ============================================================================
-- RPC: get_alert_performance_stats
-- Description: Returns performance stats for a user's job alerts
-- Returns: Table of stats per alert (total matching jobs, jobs this week, avg match score)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_alert_performance_stats(p_user_id UUID)
RETURNS TABLE (
  alert_id UUID,
  total_jobs BIGINT,
  jobs_this_week BIGINT,
  avg_match_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ja.id AS alert_id,
    COUNT(j.id)::BIGINT AS total_jobs,
    COUNT(CASE WHEN j.created_at >= NOW() - INTERVAL '7 days' THEN 1 END)::BIGINT AS jobs_this_week,
    ROUND(AVG(
      CASE 
        WHEN j.id IS NOT NULL THEN 
          -- Simple matching score based on keyword overlap
          COALESCE(
            (
              SELECT COUNT(*) * 20  -- 20 points per matching keyword (max 100)
              FROM UNNEST(ja.keywords) AS alert_keyword
              WHERE alert_keyword ILIKE ANY(
                SELECT '%' || keyword || '%'
                FROM UNNEST(
                  ARRAY[
                    COALESCE(j.title, ''),
                    COALESCE(j.description, ''),
                    COALESCE(j.company_name, ''),
                    COALESCE(j.industry, '')
                  ]
                ) AS keyword
                WHERE keyword != ''
              )
            ),
            0
          )
        ELSE 0
      END
    ), 0)::NUMERIC AS avg_match_score
  FROM job_alerts ja
  LEFT JOIN jobs j ON (
    -- Match by keywords in title/description
    (ja.keywords IS NULL OR ja.keywords = '{}' OR 
     EXISTS (
       SELECT 1 FROM UNNEST(ja.keywords) k
       WHERE j.title ILIKE '%' || k || '%'
          OR j.description ILIKE '%' || k || '%'
     )
    )
    -- Match by location
    AND (ja.location IS NULL OR ja.location = '' OR 
         j.location ILIKE '%' || ja.location || '%'
    )
    -- Match by job type
    AND (ja.job_type IS NULL OR ja.job_type = '' OR 
         j.job_type = ja.job_type
    )
    -- Only approved and open jobs
    AND j.status = 'approved'
    AND j.is_active = true
    -- Only jobs created after the alert was created
    AND j.created_at >= ja.created_at
  )
  WHERE ja.user_id = p_user_id
    AND ja.is_active = true
  GROUP BY ja.id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_alert_performance_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_alert_performance_stats(UUID) TO service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_alert_performance_stats(UUID) IS 
  'Returns performance statistics for a user job alerts including total matching jobs, jobs this week, and average match score';
