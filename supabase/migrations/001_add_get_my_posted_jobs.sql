CREATE OR REPLACE FUNCTION get_my_posted_jobs()
RETURNS TABLE(id uuid, title text, company_name text, company_logo_url text, is_bookmarked boolean, total_count bigint, is_approved boolean, is_active boolean, created_at timestamptz) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.title,
    c.name as company_name,
    c.logo_url as company_logo_url,
    (SELECT EXISTS (SELECT 1 FROM job_bookmarks jb WHERE jb.job_id = j.id AND jb.user_id = auth.uid())) as is_bookmarked,
    (SELECT count(*) FROM jobs WHERE user_id = auth.uid()) as total_count,
    j.is_approved,
    j.is_active,
    j.created_at
  FROM
    jobs j
  JOIN
    companies c ON j.company_id = c.id
  WHERE
    j.user_id = auth.uid()
  ORDER BY
    j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
