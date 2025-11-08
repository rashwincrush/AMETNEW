-- Create enriched applications RPC with owner/admin checks
-- Returns applicant_name/email and resume provenance flags

create or replace function public.get_applications_for_job_v2(
  p_job_id uuid,
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  id uuid,
  job_id uuid,
  applicant_id uuid,
  applicant_name text,
  applicant_email text,
  status text,
  resume_url text,
  resume_from_profile boolean,
  resume_uploaded_at timestamptz,
  matches_primary boolean,
  created_at timestamptz,
  total_count int
)
language sql
security definer
set search_path = public
as $$
with my as (
  select auth.uid() as uid
),
job_row as (
  select j.id, j.created_by, j.posted_by, j.company_id, c.created_by as company_owner
  from jobs j
  left join companies c on c.id = j.company_id
  where j.id = p_job_id
),
admin_ok as (
  -- Determine admin via profiles.role ('admin' | 'super_admin')
  select exists (
    select 1
    from profiles p, my
    where p.id = my.uid
      and p.role in ('admin','super_admin')
  ) as is_admin
),
owner_ok as (
  select exists (
    select 1 from job_row jr, my
    where (jr.created_by = my.uid or jr.posted_by = my.uid or jr.company_owner = my.uid)
  ) as is_owner
),
allow as (
  select (select is_admin from admin_ok) or (select is_owner from owner_ok) as ok
)
select
  ja.id,
  ja.job_id,
  ja.applicant_id,
  -- Build applicant display
  coalesce(p.full_name, p.name, nullif(trim(concat(coalesce(p.first_name,''),' ',coalesce(p.last_name,''))), ''), split_part(p.email,'@',1), 'Applicant') as applicant_name,
  p.email as applicant_email,
  ja.status,
  ja.resume_url,
  (ur.id is not null) as resume_from_profile,
  ur.uploaded_at as resume_uploaded_at,
  (primary_u.file_url is not null and ja.resume_url = primary_u.file_url) as matches_primary,
  ja.created_at,
  count(*) over() as total_count
from job_applications ja
join job_row jr on jr.id = ja.job_id
left join profiles p on p.id = ja.applicant_id
left join user_resumes ur
  on ur.user_id = ja.applicant_id and ur.file_url = ja.resume_url
left join user_resumes primary_u
  on primary_u.user_id = ja.applicant_id and primary_u.is_primary is true
where (select ok from allow)
  and ja.job_id = p_job_id
order by ja.created_at desc
limit greatest(p_limit, 0)
offset greatest(p_offset, 0);
$$;

-- Revoke public execute and grant to authenticated
revoke all on function public.get_applications_for_job_v2(uuid,int,int) from public;
grant execute on function public.get_applications_for_job_v2(uuid,int,int) to authenticated;
