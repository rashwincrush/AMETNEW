import { supabase } from '../utils/supabase';

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
  return data || [];
}

export async function fetchJobById(jobId) {
  const { data, error } = await supabase
    .from('v_jobs_feed_inr')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) throw error;
  return data;
}
