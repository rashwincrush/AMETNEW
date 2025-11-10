import { supabase } from '../utils/supabase';

export type Notification = {
  id: string;
  recipient_id: string;
  type:
    | 'system'
    | 'connection'
    | 'message'
    | 'event'
    | 'event_created'
    | 'event_published'
    | 'event_updated'
    | 'job'
    | 'job_posted'
    | 'job_approved'
    | 'job_applied'
    | 'application'
    | 'application_status'
    | 'mentorship'
    | 'group'
    | 'alert';
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, any> | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
};

export async function fetchNotifications({ limit = 30, cursor }: { limit?: number; cursor?: string }) {
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

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Notification[];
}

export async function markOneRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function markAllRead() {
  const { error } = await supabase.rpc('mark_all_my_notifications_as_read');
  if (error) throw error;
}

export function subscribeMyNotifications(
  userId: string,
  onChange: (payload: any) => void
) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
      onChange
    )
    .subscribe();
}
