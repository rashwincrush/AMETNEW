import { supabase } from '../utils/supabase';

const inflight = new Map();
const sleep = (n) => new Promise((r) => setTimeout(r, n));
const isUuid = (s) => !!s && /^[0-9a-f-]{36}$/i.test(s);

export async function ensureDmThreadWith(otherUserId, metadata = {}) {
  if (!otherUserId) throw new Error('otherUserId required');
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const me = userData?.user?.id;
  if (!me) throw new Error('Not authenticated');
  if (!isUuid(me) || !isUuid(otherUserId) || me === otherUserId) throw new Error('invalid-peer');

  if (inflight.has(otherUserId)) return inflight.get(otherUserId);

  const run = async () => {
    const call = async () => {
      // NOTE: The Supabase function ensure_dm_thread_with currently only accepts
      // a single argument (p_other). We keep the metadata parameter in the JS
      // API for potential future use, but we do NOT send it to the RPC to avoid
      // signature mismatches (PGRST202 errors).
      const { data, error } = await supabase.rpc('ensure_dm_thread_with', {
        p_other: otherUserId,
      });
      if (error) throw error;
      if (!isUuid(data)) throw new Error('bad-thread-id');
      return data;
    };

    try {
      return await call();
    } catch (e) {
      const code = e?.code || '';
      const msg = String(e?.message || '');
      if (code === '404' || code === '400' || /not\s*found/i.test(msg)) {
        await sleep(500 + Math.random() * 1000);
        return await call();
      }
      throw e;
    }
  };

  const p = run().finally(() => inflight.delete(otherUserId));
  inflight.set(otherUserId, p);
  return p;
}

export async function sendDmMessage(threadId, body, metadata = null) {
  if (!threadId) throw new Error('threadId required');
  
  // Build RPC parameters
  const params = {
    p_thread_id: threadId,
    p_body: body,
  };
  
  // Add metadata for file attachments if provided
  if (metadata) {
    params.p_message_type = metadata.message_type || 'text';
    if (metadata.attachment_url) params.p_attachment_url = metadata.attachment_url;
    if (metadata.file_name) params.p_file_name = metadata.file_name;
    if (metadata.file_size) params.p_file_size = metadata.file_size;
    if (metadata.mime_type) params.p_mime_type = metadata.mime_type;
  }
  
  const { data, error } = await supabase.rpc('send_dm_message', params);
  if (!error) return typeof data === 'string' ? data : data?.id;

  throw error;
}

export async function fetchMyThreads() {
  const { data, error } = await supabase
    .from('v_my_dm_threads')
    .select('*')
    .order('thread_id', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function findMyThreadById(threadId) {
  if (!threadId) return null;
  const threads = await fetchMyThreads();
  return (threads || []).find((t) => String(t.thread_id) === String(threadId)) || null;
}

export async function findMyThreadByOtherUserId(otherUserId) {
  if (!otherUserId) return null;
  const threads = await fetchMyThreads();
  return (threads || []).find((t) => String(t.other_user_id) === String(otherUserId)) || null;
}

export function mapDmErrorToMessage(error) {
  const fallback = 'Something went wrong while sending your message. Please try again.';
  if (!error) return fallback;
  const msg = String(error.message || '').toLowerCase();

  if (msg.includes('not a participant')) {
    return 'You cannot send messages in this conversation.';
  }
  if (msg.includes('are_connected') || msg.includes('connection required')) {
    return 'You must be connected to this user to send messages.';
  }
  if (msg.includes('fully approved')) {
    return 'Your account must be approved before you can send messages.';
  }

  return fallback;
}

export async function fetchThreadMessages(threadId, options = {}) {
  const { since } = options || {};
  let query = supabase
    .from('dm_messages')
    .select(`
      id, 
      thread_id, 
      sender_id, 
      body, 
      created_at, 
      client_id,
      message_type,
      attachment_url,
      file_name,
      file_size,
      mime_type
    `)
    .eq('thread_id', threadId);

  if (since) {
    query = query.gte('created_at', since);
  }

  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
