import { supabase } from '../utils/supabase';

const inflight = new Map();
const sleep = (n) => new Promise((r) => setTimeout(r, n));
const isUuid = (s) => !!s && /^[0-9a-f-]{36}$/i.test(s);

export async function ensureDmThreadWith(otherUserId) {
  if (!otherUserId) throw new Error('otherUserId required');
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const me = userData?.user?.id;
  if (!me) throw new Error('Not authenticated');
  if (!isUuid(me) || !isUuid(otherUserId) || me === otherUserId) throw new Error('invalid-peer');

  if (inflight.has(otherUserId)) return inflight.get(otherUserId);

  const run = async () => {
    const call = async () => {
      const { data, error } = await supabase.rpc('get_or_create_dm_thread', {
        p_user1: me,
        p_user2: otherUserId,
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

export async function sendDmMessage(threadId, body, repair) {
  if (!threadId) throw new Error('threadId required');
  const { data, error } = await supabase.rpc('send_dm_message', {
    p_thread_id: threadId,
    p_body: body,
  });
  if (!error) return typeof data === 'string' ? data : data?.id;

  // Retry once if Not a participant and repair callback is provided
  if (error?.message && /Not a participant/i.test(error.message) && typeof repair === 'function') {
    const fixedThreadId = await repair();
    const { data: data2, error: err2 } = await supabase.rpc('send_dm_message', {
      p_thread_id: fixedThreadId || threadId,
      p_body: body,
    });
    if (err2) throw err2;
    return typeof data2 === 'string' ? data2 : data2?.id;
  }

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

export async function fetchThreadMessages(threadId) {
  const { data, error } = await supabase
    .from('dm_messages')
    .select('id, thread_id, sender_id, body, created_at, client_id')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
