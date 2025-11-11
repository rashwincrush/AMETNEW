import { supabase } from '../utils/supabase';
import { createThread } from '../utils/supabase';

export async function ensureDmThreadWith(otherUserId) {
  if (!otherUserId) throw new Error('otherUserId required');
  try {
    try { await createThread(undefined, otherUserId); } catch (_) {}
    const { data, error } = await supabase
      .from('v_my_dm_threads')
      .select('*')
      .eq('other_user_id', otherUserId)
      .maybeSingle();
    if (error) throw error;
    if (!data?.thread_id) throw new Error('Thread not found');
    return data.thread_id;
  } catch (err) {
    throw err;
  }
}

export async function sendDmMessage(threadId, body, clientId) {
  if (!threadId) throw new Error('threadId required');
  const { data, error } = await supabase.rpc('send_dm_message', {
    p_thread_id: threadId,
    p_body: body,
    p_client_id: clientId,
  });
  if (error) throw error;
  return data?.id;
}

export async function fetchMyThreads() {
  const { data, error } = await supabase
    .from('v_my_dm_threads')
    .select('*')
    .order('thread_id', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchThreadMessages(threadId) {
  const { data, error } = await supabase
    .from('dm_messages')
    .select('id, thread_id, sender_id, body, created_at, client_id')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
