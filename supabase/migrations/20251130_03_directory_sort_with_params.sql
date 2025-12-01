-- Migration: Directory sort with parameters (name / graduation, asc / desc)
-- Date: 2025-11-30
-- Description:
--   Add a 5-argument get_directory_profiles_secure(p_search, p_limit, p_offset, p_sort_field, p_sort_dir)
--   that supports global A–Z / Z–A and Graduation (Newest/Oldest) sorting in the DB.
--   Keep a 3-argument wrapper for backward compatibility.

-- 1) New 5-arg function with sort parameters
CREATE OR REPLACE FUNCTION public.get_directory_profiles_secure(
  p_search      text,
  p_limit       integer,
  p_offset      integer,
  p_sort_field  text,
  p_sort_dir    text
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
  v_role       text    := public.get_user_role();
  v_is_admin   boolean := public.app_is_admin();
  v_sort_field text    := lower(coalesce(nullif(p_sort_field, ''), 'name'));
  v_sort_dir   text    := case
                             when lower(p_sort_dir) in ('asc','desc') then lower(p_sort_dir)
                             else 'asc'
                           end;
BEGIN
  -- Employers: do not show people directory at all
  IF v_role = 'employer' THEN
    RETURN;
  END IF;

  -- ADMIN / SUPER_ADMIN
  IF v_is_admin THEN

    IF v_sort_field = 'graduation_year' THEN
      -- Sort by graduation year globally (Newest/Oldest), tie-breaker by first name
      IF v_sort_dir = 'desc' THEN
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
          counted.graduation_year DESC,
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      ELSE
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
          counted.graduation_year ASC,
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      END IF;

    ELSE
      -- Sort by name globally (A–Z / Z–A) using first_name as primary, fallback full_name
      IF v_sort_dir = 'desc' THEN
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
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) DESC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') DESC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      ELSE
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
      END IF;
    END IF;

  ELSE
    -- NORMAL USERS: only active, visible profiles

    IF v_sort_field = 'graduation_year' THEN
      IF v_sort_dir = 'desc' THEN
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
          counted.graduation_year DESC,
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      ELSE
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
          counted.graduation_year ASC,
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) ASC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') ASC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      END IF;

    ELSE
      IF v_sort_dir = 'desc' THEN
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
          COALESCE(NULLIF(trim(counted.first_name), ''), NULLIF(trim(counted.full_name), '')) DESC,
          COALESCE(NULLIF(trim(counted.full_name), ''), '') DESC
        LIMIT COALESCE(p_limit, 50)
        OFFSET COALESCE(p_offset, 0);
      ELSE
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
    END IF;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_directory_profiles_secure(text, integer, integer, text, text) IS
'Get directory profiles for secure view with sort parameters (name/graduation_year + asc/desc).';

-- 2) Backward compatible 3-arg wrapper that defaults to name A–Z
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
) LANGUAGE sql SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT *
  FROM public.get_directory_profiles_secure(
    p_search,
    p_limit,
    p_offset,
    'name',
    'asc'
  );
$$;
