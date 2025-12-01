-- Migration: Directory sort by first name (not last name)
-- Date: 2025-11-30
-- Description:
--   Align get_directory_profiles_secure ordering with UI expectations.
--   Use first_name as the primary sort key (with sensible fallbacks),
--   and do not sort by last_name at all.

CREATE OR REPLACE FUNCTION public.get_directory_profiles_secure(
  p_search text,
  p_limit integer,
  p_offset integer
) RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  full_name text,
  graduation_year integer,
  degree_program text,
  department text,
  current_job_title text,
  company_name text,
  location text,
  location_city text,
  location_country text,
  avatar_url text,
  role text,
  approval_status text,
  is_active boolean,
  is_deleted boolean,
  show_in_directory boolean,
  total_count bigint
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role     text    := public.get_user_role();
  v_is_admin boolean := public.app_is_admin();
BEGIN
  -- Employers: do not show people directory at all
  IF v_role = 'employer' THEN
    RETURN;
  END IF;

  -- We define a consistent, first-name-driven ordering expression:
  --   1) primary: trimmed first_name (if present)
  --   2) fallback: trimmed full_name (if present)
  --   3) this avoids sorting by last_name entirely

  IF v_is_admin THEN
    -- ADMIN / SUPER_ADMIN: see everything the view exposes
    RETURN QUERY
    SELECT *
    FROM (
      SELECT
        d.id,
        d.first_name,
        d.last_name,
        d.full_name,
        d.graduation_year,
        d.degree_program,
        d.department,
        d.current_job_title,
        d.company_name,
        d.location,
        d.location_city,
        d.location_country,
        d.avatar_url,
        d.role::text,
        d.approval_status::text,
        d.is_active,
        d.is_deleted,
        d.show_in_directory,
        COUNT(*) OVER () AS total_count
      FROM public.directory_profiles_public AS d
      WHERE
        COALESCE(p_search, '') = ''
        OR d.full_name ILIKE '%' || p_search || '%'
        OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
             ILIKE '%' || p_search || '%'
    ) counted
    ORDER BY
      COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
      COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
    LIMIT COALESCE(p_limit, 50)
    OFFSET COALESCE(p_offset, 0);

  ELSE
    -- NORMAL USERS: only active, visible profiles
    RETURN QUERY
    SELECT *
    FROM (
      SELECT
        d.id,
        d.first_name,
        d.last_name,
        d.full_name,
        d.graduation_year,
        d.degree_program,
        d.department,
        d.current_job_title,
        d.company_name,
        d.location,
        d.location_city,
        d.location_country,
        d.avatar_url,
        d.role::text,
        d.approval_status::text,
        d.is_active,
        d.is_deleted,
        d.show_in_directory,
        COUNT(*) OVER () AS total_count
      FROM public.directory_profiles_public AS d
      WHERE
        d.is_deleted = false
        AND d.is_active = true
        AND d.show_in_directory = true
        AND (
          COALESCE(p_search, '') = ''
          OR d.full_name ILIKE '%' || p_search || '%'
          OR (COALESCE(d.first_name, '') || ' ' || COALESCE(d.last_name, ''))
               ILIKE '%' || p_search || '%'
        )
    ) counted
    ORDER BY
      COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
      COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
    LIMIT COALESCE(p_limit, 50)
    OFFSET COALESCE(p_offset, 0);
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_directory_profiles_secure(text, integer, integer) IS
'Get directory profiles for secure view, ordered by first name (then full_name), never by last_name.';
