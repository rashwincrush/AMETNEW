import { supabase } from '../utils/supabase';
import { normalizeJobCompany } from '../utils/jobs';

function normalizeJob(raw) {
  if (!raw) return raw;

  const company = normalizeJobCompany(raw);

  return {
    ...raw,
    company_name: company.name || raw.company_name || '',
    company_logo_url: company.logo_url || raw.company_logo_url || '',
  };
}

export async function fetchJobsFeed() {
  const { data, error } = await supabase
    .from('v_jobs_feed_inr')
    .select([
      'id',
      'title',
      'location',
      'job_type',
      'experience_level',
      'salary_min',
      'salary_max',
      'salary_display_inr',
      'application_url',
      'source_type',
      'company_id',
      'company_name',
      'company_logo_url',
      'applicant_count',
      'created_at',
    ].join(','))
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeJob);
}

export async function fetchJobById(jobId) {
  const { data, error } = await supabase
    .from('v_jobs_feed_inr')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data ? normalizeJob(data) : null;
}

// Expired jobs feeds (admin/employer)
export async function fetchExpiredJobsAdmin({ limit = 50, offset = 0, search = null }) {
  const { data, error } = await supabase.rpc('get_expired_jobs_admin', {
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  });
  if (error) throw error;
  return (data ?? []).map(normalizeJob);
}

export async function fetchMyExpiredJobs({ limit = 50, offset = 0, search = null }) {
  const { data, error } = await supabase.rpc('get_my_expired_jobs', {
    p_limit: limit,
    p_offset: offset,
    p_search: search,
  });
  if (error) throw error;
  return (data ?? []).map(normalizeJob);
}
