import { supabase } from './supabase';

export async function hasApplied(jobId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { count, error } = await supabase
      .from('job_applications')
      .select('id', { count: 'exact', head: true })
      .eq('job_id', jobId)
      .eq('applicant_id', user.id);
    if (error) return false;
    return (typeof count === 'number') ? count > 0 : false;
  } catch (_) {
    return false;
  }
}
