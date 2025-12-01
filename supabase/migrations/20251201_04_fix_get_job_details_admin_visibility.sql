-- Fix get_job_details admin visibility to use unified get_user_role helper
-- This ensures admins / super_admins can always view job details

CREATE OR REPLACE FUNCTION public.get_job_details(p_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  company_name text,
  company_logo_url text,
  location text,
  job_type text,
  department text,
  experience_level text,
  industry text,
  status text,
  is_active boolean,
  is_approved boolean,
  is_rejected boolean,
  deadline timestamptz,
  application_deadline timestamptz,
  expires_at timestamptz,
  posted_by uuid,
  created_by uuid,
  user_id uuid,
  company_id uuid,
  salary_min bigint,
  salary_max bigint,
  salary_range text,
  salary_display_inr text,
  skills text[],
  requirements text,
  application_url text,
  apply_url text,
  external_url text,
  source_type text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
  SELECT
    j.id,
    j.title,
    j.description,
    COALESCE(j.company_name, c.name)    AS company_name,
    COALESCE(j.logo_url,     c.logo_url) AS company_logo_url,
    j.location,
    j.job_type,
    j.department,
    j.experience_level,
    j.industry,
    j.status,
    j.is_active,
    j.is_approved,
    j.is_rejected,
    COALESCE(j.deadline, j.application_deadline) AS deadline,
    j.application_deadline,
    j.expires_at,
    j.posted_by,
    j.created_by,
    j.user_id,
    j.company_id,
    j.salary_min,
    j.salary_max,
    j.salary_range,
    CASE
      WHEN j.salary_min IS NOT NULL AND j.salary_max IS NOT NULL THEN
        '₹' || to_char(j.salary_min, 'FM999,999,999')
        || ' – ₹' || to_char(j.salary_max, 'FM999,999,999')
      WHEN j.salary_min IS NOT NULL THEN
        'From ₹' || to_char(j.salary_min, 'FM999,999,999')
      WHEN j.salary_max IS NOT NULL THEN
        'Up to ₹' || to_char(j.salary_max, 'FM999,999,999')
      ELSE NULL
    END                                 AS salary_display_inr,
    j.skills,
    j.requirements,
    j.application_url,
    j.apply_url,
    j.external_url,
    j.source_type
  FROM public.jobs j
  LEFT JOIN public.companies c ON c.id = j.company_id
  WHERE j.id = p_id
    AND (
      -- Admins can see all (use unified helper, not raw JWT claim)
      get_user_role(auth.uid()) IN ('admin','super_admin')
      -- Job owners
      OR j.posted_by = auth.uid()
      OR j.created_by = auth.uid()
      -- Publicly visible live jobs
      OR (
        COALESCE(j.is_active, true)
        AND j.is_approved
        AND (
          COALESCE(j.deadline, j.application_deadline) IS NULL
          OR COALESCE(j.deadline, j.application_deadline) >= now()
        )
      )
      -- Applicants to this job
      OR EXISTS (
        SELECT 1
        FROM public.job_applications ja
        WHERE ja.job_id = j.id
          AND ja.applicant_id = auth.uid()
      )
    );
$$;
