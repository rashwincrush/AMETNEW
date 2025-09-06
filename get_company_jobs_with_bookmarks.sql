CREATE OR REPLACE FUNCTION get_company_jobs_with_bookmarks(
  p_company_id UUID,
  p_search_query TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'created_at',
  p_sort_order TEXT DEFAULT 'desc',
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
) RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_query TEXT;
  v_is_bookmarked_query TEXT;
BEGIN
  -- Get current authenticated user ID
  v_user_id := auth.uid();

  -- Create the query to fetch jobs from specified company
  v_query := '
    SELECT 
      j.*,
      c.name as company_name,
      c.logo_url as company_logo_url,
      COALESCE(a.count, 0) as applicant_count,
      EXISTS(SELECT 1 FROM job_bookmarks jb WHERE jb.job_id = j.id AND jb.user_id = $1) as is_bookmarked,
      COUNT(*) OVER() as total_count
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    LEFT JOIN (
      SELECT job_id, COUNT(*) as count
      FROM job_applications
      GROUP BY job_id
    ) a ON a.job_id = j.id
    WHERE j.company_id = $2
  ';

  -- Add search query condition if provided
  IF p_search_query IS NOT NULL AND p_search_query <> '' THEN
    v_query := v_query || ' AND (
      j.title ILIKE ''%' || p_search_query || '%'' OR
      j.description ILIKE ''%' || p_search_query || '%'' OR
      j.location ILIKE ''%' || p_search_query || '%'' OR
      c.name ILIKE ''%' || p_search_query || '%''
    )';
  END IF;

  -- Add sorting
  v_query := v_query || ' ORDER BY ' || p_sort_by || ' ' || p_sort_order;

  -- Add pagination
  v_query := v_query || ' LIMIT ' || p_limit || ' OFFSET ' || p_offset;

  -- Execute the query and return results
  RETURN QUERY EXECUTE v_query USING v_user_id, p_company_id;
END;
$$;
