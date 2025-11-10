-- Expired jobs RPCs
-- Admin: all expired jobs
-- Employer: my expired jobs (by ownership)

-- Drop existing to be idempotent in dev
drop function if exists public.get_expired_jobs_admin(int, int, text);
drop function if exists public.get_my_expired_jobs(int, int, text);

create or replace function public.get_expired_jobs_admin(
  p_limit int default 50,
  p_offset int default 0,
  p_search text default null
)
returns table (
  id uuid,
  title text,
  description text,
  company_id uuid,
  company_name text,
  company_logo_url text,
  location text,
  job_type text,
  experience_level text,
  department text,
  application_deadline timestamptz,
  deadline timestamptz,
  expires_at timestamptz,
  status text,
  is_active boolean,
  is_approved boolean,
  posted_by uuid,
  created_by uuid,
  created_at timestamptz
) language sql security definer as $$
with base as (
  select 
    j.id,
    j.title,
    j.description,
    j.company_id,
    coalesce(c.name, j.company_name) as company_name,
    c.logo_url as company_logo_url,
    j.location,
    j.job_type,
    j.experience_level,
    j.department,
    j.application_deadline,
    j.deadline,
    j.expires_at,
    j.status,
    j.is_active,
    j.is_approved,
    j.posted_by,
    j.created_by,
    j.created_at
  from public.jobs j
  left join public.companies c on c.id = j.company_id
  where (
    (j.application_deadline is not null and j.application_deadline < now()) or
    (j.deadline is not null and j.deadline < now()) or
    (j.expires_at is not null and j.expires_at < now())
  )
  and (
    p_search is null or p_search = '' or
    j.title ilike ('%'||p_search||'%') or
    coalesce(c.name, j.company_name, '') ilike ('%'||p_search||'%')
  )
)
select *
from base
order by created_at desc
offset greatest(p_offset,0)
limit greatest(p_limit,1);
$$;

grant execute on function public.get_expired_jobs_admin(int, int, text) to anon, authenticated, service_role;

create or replace function public.get_my_expired_jobs(
  p_limit int default 50,
  p_offset int default 0,
  p_search text default null
)
returns table (
  id uuid,
  title text,
  description text,
  company_id uuid,
  company_name text,
  company_logo_url text,
  location text,
  job_type text,
  experience_level text,
  department text,
  application_deadline timestamptz,
  deadline timestamptz,
  expires_at timestamptz,
  status text,
  is_active boolean,
  is_approved boolean,
  posted_by uuid,
  created_by uuid,
  created_at timestamptz
) language sql security definer set search_path = public as $$
with mine as (
  select 
    j.id,
    j.title,
    j.description,
    j.company_id,
    coalesce(c.name, j.company_name) as company_name,
    c.logo_url as company_logo_url,
    j.location,
    j.job_type,
    j.experience_level,
    j.department,
    j.application_deadline,
    j.deadline,
    j.expires_at,
    j.status,
    j.is_active,
    j.is_approved,
    j.posted_by,
    j.created_by,
    j.created_at
  from public.jobs j
  left join public.companies c on c.id = j.company_id
  where (
    j.posted_by = auth.uid()
    or j.created_by = auth.uid()
    or j.user_id = auth.uid()
    or exists (
      select 1 from public.companies c2 where c2.id = j.company_id and c2.created_by = auth.uid()
    )
  )
  and (
    (j.application_deadline is not null and j.application_deadline < now()) or
    (j.deadline is not null and j.deadline < now()) or
    (j.expires_at is not null and j.expires_at < now())
  )
  and (
    p_search is null or p_search = '' or
    j.title ilike ('%'||p_search||'%') or
    coalesce(c.name, j.company_name, '') ilike ('%'||p_search||'%')
  )
)
select *
from mine
order by created_at desc
offset greatest(p_offset,0)
limit greatest(p_limit,1);
$$;

grant execute on function public.get_my_expired_jobs(int, int, text) to authenticated, service_role;
