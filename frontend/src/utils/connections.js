import { supabase } from './supabase';
import toast from 'react-hot-toast';

// Returns latest connection edge between a and b (by updated_at then created_at)
export async function getLatestEdge(a, b) {
  if (!a || !b || a === b) return null;
  const { data, error } = await supabase
    .from('connections')
    .select('id, requester_id, recipient_id, status, created_at, updated_at')
    .or(`and(requester_id.eq.${a},recipient_id.eq.${b}),and(requester_id.eq.${b},recipient_id.eq.${a})`)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

// Fetch simplified relationship from the directory view
export async function fetchRel(meId, otherId) {
  const { data, error } = await supabase
    .from('v_directory_connection_states')
    .select('status,pending_side')
    .eq('other_user_id', otherId)
    .maybeSingle();
  if (error) throw error;
  return data || { status: null, pending_side: null };
}

// Idempotent connect: accepts incoming if present, treats duplicates as success
export async function idempotentConnect(meId, otherId, knownRel) {
  if (!meId || !otherId || meId === otherId) return;
  const rel = knownRel ?? (await fetchRel(meId, otherId));

  // If they already sent us a request, 'Connect' should accept instead
  if (rel?.status === 'pending' && rel?.pending_side === 'received') {
    return acceptPending(meId, otherId);
  }

  // If last same-direction edge was removed/declined, revive it to pending
  const last = await getLatestEdge(meId, otherId);
  const sameDirection = last && last.requester_id === meId && last.recipient_id === otherId;
  if (sameDirection && ['removed', 'declined'].includes(last.status)) {
    await updateEdge(last.id, 'pending');
    return;
  }

  // Already pending/connected/accepted/declined from view → nothing to do
  if (rel?.status) return;

  // Fresh insert
  const { error } = await supabase
    .from('connections')
    .insert({ requester_id: meId, recipient_id: otherId, status: 'pending' });
  if (error) {
    const code = (error?.code || error?.status || error?.message || '').toString().toLowerCase();
    if (code.includes('23505') || code.includes('409') || code.includes('duplicate') || code.includes('conflict')) {
      // Treat duplicate as success (double-clicks / race)
      return;
    }
    throw error;
  }
}

// Deprecated: use idempotentConnect
export async function connectTo(meId, otherId) {
  try {
    await idempotentConnect(meId, otherId);
    toast.success('Connection request sent');
  } catch (error) {
    const code = (error?.code || error?.status || error?.message || '').toString().toLowerCase();
    if (code.includes('23505') || code.includes('409') || code.includes('duplicate') || code.includes('already')) {
      return;
    }
    console.error('connectTo error', error);
    toast.error('Failed to send request');
    throw error;
  }
}

export async function updateEdge(edgeId, status) {
  const { data, error } = await supabase
    .from('connections')
    .update({ status })
    .eq('id', edgeId)
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) throw new Error('No row updated');
}

export async function cancelPending(meId, otherId) {
  const edge = await getLatestEdge(meId, otherId);
  if (edge?.status === 'pending' && edge.requester_id === meId) {
    try {
      await updateEdge(edge.id, 'removed');
      toast.success('Request cancelled');
    } catch (e) {
      console.error('cancelPending error', e);
      toast.error('Failed to cancel request');
      throw e;
    }
  }
}

export async function acceptPending(meId, otherId) {
  const edge = await getLatestEdge(meId, otherId);
  if (edge?.status === 'pending' && edge.recipient_id === meId) {
    try {
      await updateEdge(edge.id, 'accepted');
      toast.success('Connection accepted');
    } catch (e) {
      console.error('acceptPending error', e);
      toast.error('Failed to accept request');
      throw e;
    }
  }
}

export async function declinePending(meId, otherId) {
  const edge = await getLatestEdge(meId, otherId);
  if (edge?.status === 'pending' && edge.recipient_id === meId) {
    try {
      await updateEdge(edge.id, 'declined');
      toast('Request declined', { icon: '👋' });
    } catch (e) {
      console.error('declinePending error', e);
      toast.error('Failed to decline request');
      throw e;
    }
  }
}

export async function removeConnection(meId, otherId) {
  const edge = await getLatestEdge(meId, otherId);
  if (edge && (edge.status === 'accepted' || edge.status === 'connected')) {
    try {
      await updateEdge(edge.id, 'removed');
      toast('Connection removed', { icon: '🗑️' });
    } catch (e) {
      console.error('removeConnection error', e);
      toast.error('Failed to remove connection');
      throw e;
    }
  }
}
