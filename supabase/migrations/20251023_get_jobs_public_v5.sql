-- get_jobs_public_v5: server-driven filters and accurate paging for public job listings
-- Safe: does not change schema; adds RPC and helpful indexes if missing

-- Helpful indexes (no-ops if they already exist)
create index if not exists idx_jobs_created_at on jobs (created_at desc);
create index if not exists idx_jobs_department on jobs (department);
create index if not exists idx_jobs_job_type on jobs (job_type);
create index if not exists idx_jobs_exp_level on jobs (experience_level);
create index if not exists idx_jobs_industry on jobs (industry);
create index if not exists idx_jobs_is_active_approved on jobs (is_active, is_approved);

-- Drop and recreate to keep idempotent during local dev; in prod ensure versioning
drop function if exists public.get_jobs_public_v5(
  text, text, text, int, int, text, text, text, text, text, int, int, int
);

create or replace function public.get_jobs_public_v5(
  p_search_query text default null,
  p_sort_by text default 'created_at',
  p_sort_order text default 'desc',
  p_limit int default 12,
  p_offset int default 0,
  p_department text default null,
  p_job_type text default null,
  p_experience_level text default null,
  p_location text default null,
  p_industry text default null,
  p_salary_min int default null,
  p_salary_max int default null,
  p_posted_since_days int default null
)
returns table (
  id uuid,
  title text,
  description text,
  company_id uuid,
  company_name text,
  company_logo_url text,
  application_url text,
  external_url text,
  apply_url text,
  source_type text,
  application_deadline timestamp with time zone,
  deadline timestamp with time zone,
  status text,
  department text,
  job_type text,
  experience_level text,
  industry text,
  location text,
  salary_min int,
  salary_max int,
  skills text[],
  is_active boolean,
  is_approved boolean,
  created_at timestamp with time zone,
  total_count bigint
) language sql security definer as $$
with base as (
  select 
    j.id,
    j.title,
    j.description,
    j.company_id,
    coalesce(c.name, j.company_name) as company_name,
    coalesce(c.logo_url, j.company_logo_url) as company_logo_url,
    j.application_url,
    j.external_url,
    j.apply_url,
    case when coalesce(j.apply_url, j.application_url, j.external_url) is not null then 
      case 
        when j.apply_url is not null or j.application_url is not null then 'in_app'
        else 'quick_link'
      end
    else null end as source_type,
    j.application_deadline,
    j.deadline,
    j.status,
    j.department,
    j.job_type,
    j.experience_level,
    j.industry,
    j.location,
    j.salary_min,
    j.salary_max,
    j.skills,
    j.is_active,
    j.is_approved,
    j.created_at
  from jobs j
  left join companies c on c.id = j.company_id
  where j.is_active = true
    and j.is_approved = true
    and coalesce(j.is_rejected, false) = false
    and j.status = 'active'
    and (p_department is null or j.department = p_department)
    and (p_job_type is null or j.job_type = p_job_type)
    and (p_experience_level is null or j.experience_level = p_experience_level)
    and (p_location is null or j.location ilike ('%' || p_location || '%'))
    and (p_industry is null or j.industry = p_industry)
    and (
      (p_salary_min is null and p_salary_max is null) or
      ((j.salary_min is not null or j.salary_max is not null) and (
        (p_salary_min is null or coalesce(j.salary_max, j.salary_min) >= p_salary_min) and
        (p_salary_max is null or coalesce(j.salary_min, j.salary_max) <= p_salary_max)
      ))
    )
    and (
      p_posted_since_days is null or
      j.created_at >= (now() - make_interval(days => p_posted_since_days))
    )
    and (
      p_search_query is null or (
        j.title ilike ('%' || p_search_query || '%') or
        j.description ilike ('%' || p_search_query || '%') or
        coalesce(c.name, j.company_name) ilike ('%' || p_search_query || '%') or
        j.location ilike ('%' || p_search_query || '%')
      )
    )
), counted as (
  select b.*, count(*) over() as total_count from base b
)
select * from counted
order by 
  case when p_sort_by in ('created_at') and p_sort_order = 'asc' then created_at end asc nulls last,
  case when p_sort_by in ('created_at') and p_sort_order = 'desc' then created_at end desc nulls last,
  case when p_sort_by in ('title') and p_sort_order = 'asc' then title end asc nulls last,
  case when p_sort_by in ('title') and p_sort_order = 'desc' then title end desc nulls last,
  case when p_sort_by in ('deadline') and p_sort_order = 'asc' then application_deadline end asc nulls last,
  case when p_sort_by in ('deadline') and p_sort_order = 'desc' then application_deadline end desc nulls last
offset p_offset
limit p_limit;
$$;

-- Grant execute to anon/authenticated roles as required by your RLS setup
grant execute on function public.get_jobs_public_v5(
  text, text, text, int, int, text, text, text, text, text, int, int, int
) to anon, authenticated, service_role;
