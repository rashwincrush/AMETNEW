CREATE OR REPLACE VIEW public.public_profiles_view AS
SELECT
  id,
  -- email, -- Intentionally hiding email from public view for privacy
  first_name,
  last_name,
  full_name,
  avatar_url,
  graduation_year,
  degree_program,
  current_job_title,
  company_name,
  current_location AS location, -- Renaming for consistency
  social_links,
  headline,
  is_mentor,
  is_employer
FROM public.profiles
WHERE is_verified = true
  AND privacy_settings->>'show_in_directory' = 'true';
