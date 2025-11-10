import { supabase } from '../utils/supabase';

// Allowed types per spec
export const ALLOWED_TYPES = new Set([
  'system','connection','message',
  'event','event_created','event_published','event_updated',
  'job','job_posted','job_approved','job_applied',
  'application','application_status',
  'mentorship','group','alert',
]);

export async function fetchNotifications({ limit = 30, cursor } = {}) {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('recipient_id', user.id)
    .order('is_read', { ascending: true })
    .order('created_at', { descending: true })
    .limit(limit);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).filter(n => ALLOWED_TYPES.has(n.type));
}

export async function markOneRead(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markOneUnread(id) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: false, read_at: null })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllRead() {
  // Preferred RPC per spec
  const { error } = await supabase.rpc('mark_all_my_notifications_as_read');
  if (error) {
    // Fallback: client-side update for current user
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) throw error;
    const { error: updErr } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_id', user.id)
      .eq('is_read', false);
    if (updErr) throw updErr;
  }
}

export function subscribeMyNotifications(userId, onChange) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
      onChange
    )
    .subscribe();
}
