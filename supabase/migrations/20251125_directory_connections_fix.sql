-- Directory & connections fixes: visibility, roles, and admin access

-- 1) Enrich directory_profiles_base with role/approval/visibility flags
CREATE OR REPLACE VIEW public.directory_profiles_base AS
SELECT
  p.id,
  p.first_name,
  p.last_name,
  p.graduation_year,
  COALESCE(deg.label, p.degree_program, p.degree) AS degree_program,
  COALESCE(dept.name, p.department)               AS department,
  COALESCE(NULLIF(p.current_job_title, ''), NULLIF(p.job_title, '')) AS current_job_title,
  COALESCE(NULLIF(p.company_name, ''), NULLIF(p.current_company, ''), NULLIF(p.company, '')) AS company_name,
  COALESCE(
    NULLIF(p.location, ''),
    NULLIF(TRIM(
      COALESCE(p.location_city, '') ||
      CASE WHEN (p.location_city <> '' AND p.location_country <> '') THEN ', ' ELSE '' END ||
      COALESCE(p.location_country, '')
    ), '')
  ) AS location,
  p.avatar_url,
  (p.role = 'employer'::public.app_role_enum) AS is_employer,
  p.role,
  p.approval_status,
  COALESCE(p.is_deleted, false)        AS is_deleted,
  COALESCE(p.is_active, true)          AS is_active,
  COALESCE(p.show_in_directory, true)  AS show_in_directory
FROM public.profiles p
LEFT JOIN public.degrees deg     ON deg.code = p.degree_code
LEFT JOIN public.departments dept ON dept.id = p.department_id;


-- 2) Harden get_directory_profiles to enforce visibility for non-admins
CREATE OR REPLACE FUNCTION public.get_directory_profiles()
RETURNS SETOF public.directory_profiles_base
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role     text    := public.get_user_role();
  v_is_admin boolean := public.app_is_admin();
BEGIN
  -- Employers should not see the people directory
  IF v_role = 'employer' THEN
    RETURN;
  END IF;

  IF v_is_admin THEN
    -- Admins see all profiles, including deleted/rejected/unapproved
    RETURN QUERY
      SELECT * FROM public.directory_profiles_base;
  ELSE
    -- Non-admins: only active, visible, approved profiles and no employers
    RETURN QUERY
      SELECT *
      FROM public.directory_profiles_base
      WHERE
        is_employer = false
        AND show_in_directory = true
        AND is_deleted = false
        AND is_active = true
        AND approval_status = 'approved'::public.profile_approval_status;
  END IF;
END
$$;


-- 3) Keep function ownership and grants consistent
ALTER FUNCTION public.get_directory_profiles() OWNER TO postgres;
GRANT ALL ON TABLE public.directory_profiles_base TO anon;
GRANT ALL ON TABLE public.directory_profiles_base TO authenticated;
GRANT ALL ON TABLE public.directory_profiles_base TO service_role;
GRANT ALL ON FUNCTION public.get_directory_profiles() TO anon;
GRANT ALL ON FUNCTION public.get_directory_profiles() TO authenticated;
GRANT ALL ON FUNCTION public.get_directory_profiles() TO service_role;
