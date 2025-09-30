import { supabase } from '../../utils/supabase';

type OrderOpt = { ascending?: boolean };
type ListOpt = { status?: string | string[]; order?: OrderOpt };

export async function fetchMenteeRequests(userId: string, opt: ListOpt = {}) {
  let q = supabase
    .from('mentorship_requests')
    .select('id, mentor_id, mentee_id, status, message, goals, created_at')
    .eq('mentee_id', userId)
    .order('created_at', { ascending: opt.order?.ascending ?? false });

  if (opt.status) {
    if (Array.isArray(opt.status)) q = q.in('status', opt.status);
    else q = q.eq('status', opt.status);
  }

  return q;
}

export async function fetchMentorRequests(userId: string, opt: ListOpt = {}) {
  let q = supabase
    .from('mentorship_requests')
    .select('id, mentor_id, mentee_id, status, message, goals, created_at')
    .eq('mentor_id', userId)
    .order('created_at', { ascending: opt.order?.ascending ?? false });

  if (opt.status) {
    if (Array.isArray(opt.status)) q = q.in('status', opt.status);
    else q = q.eq('status', opt.status);
  }

  return q;
}

export async function fetchMentorsAdmin(opt: { status?: 'pending'|'approved'|'rejected'|'all', search?: string }) {
  let q = supabase
    .from('mentors')
    .select(`
      user_id,
      status,
      expertise,
      mentoring_preferences,
      created_at,
      applicant:profiles!mentors_user_id_fkey (id, full_name, email, avatar_url, location, approval_status, is_available_for_mentorship)
    `)
    .order('created_at', { ascending: false });

  if (opt.status && opt.status !== 'all') {
    q = q.eq('status', opt.status);
  }

  return q;
}
