DROP FUNCTION IF EXISTS get_my_posted_jobs();

CREATE OR REPLACE FUNCTION get_my_posted_jobs(
  p_search_query TEXT,
  p_sort_by TEXT,
  p_sort_order TEXT,
  p_limit INT,
  p_offset INT
)
RETURNS TABLE(
  id uuid,
  title TEXT,
  company_name TEXT,
  company_logo_url TEXT,
  is_bookmarked BOOLEAN,
  total_count BIGINT,
  is_approved BOOLEAN,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  WITH user_jobs AS (
    SELECT
      j.id,
      j.title,
      c.name AS company_name,
      c.logo_url AS company_logo_url,
      (SELECT EXISTS (SELECT 1 FROM job_bookmarks jb WHERE jb.job_id = j.id AND jb.user_id = auth.uid())) AS is_bookmarked,
      j.is_approved,
      j.is_active,
      j.created_at
    FROM
      jobs j
    JOIN
      companies c ON j.company_id = c.id
    WHERE
      j.user_id = auth.uid()
      AND (
        p_search_query IS NULL OR p_search_query = '' OR
        j.title ILIKE '%' || p_search_query || '%'
      )
  )
  SELECT
    uj.*,
    (SELECT COUNT(*) FROM user_jobs) AS total_count
  FROM
    user_jobs uj
  ORDER BY
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'desc' THEN uj.created_at END DESC,
    CASE WHEN p_sort_by = 'created_at' AND p_sort_order = 'asc' THEN uj.created_at END ASC,
    CASE WHEN p_sort_by = 'title' AND p_sort_order = 'desc' THEN uj.title END DESC,
    CASE WHEN p_sort_by = 'title' AND p_sort_order = 'asc' THEN uj.title END ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
