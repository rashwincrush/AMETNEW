import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import toast from 'react-hot-toast';

export const AllowedStatuses = new Set(['pending','accepted','connected','declined','rejected']);

export function useConnections(currentUserId, visibleProfileIds = []) {
  const [byProfile, setByProfile] = useState(new Map());
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!currentUserId || !Array.isArray(visibleProfileIds) || visibleProfileIds.length === 0) return;
    setLoading(true);
    try {
      // fetch edges where I am requester or recipient and the other id is in the current page
      let q = supabase
        .from('connections')
        .select('id, requester_id, recipient_id, status, created_at, updated_at')
        .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
        .in('requester_id', [currentUserId, ...visibleProfileIds])
        .in('recipient_id', [currentUserId, ...visibleProfileIds]);

      const { data, error } = await q;
      if (error) throw error;

      const map = new Map();
      for (const row of data || []) {
        const otherId = row.requester_id === currentUserId ? row.recipient_id : row.requester_id;
        if (!visibleProfileIds.includes(otherId)) continue;
        map.set(otherId, row);
      }
      setByProfile(map);
    } catch (e) {
      console.error('useConnections.load error', e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, JSON.stringify(visibleProfileIds)]);

  useEffect(() => { load(); }, [load]);

  // ---- Mutations ----
  const connect = useCallback(async (targetProfileId) => {
    if (!currentUserId || targetProfileId === currentUserId) return;

    const prev = byProfile.get(targetProfileId);
    const optimistic = { id: null, requester_id: currentUserId, recipient_id: targetProfileId, status: 'pending' };
    setByProfile(new Map(byProfile).set(targetProfileId, optimistic));

    const { data, error } = await supabase
      .from('connections')
      .insert([{ requester_id: currentUserId, recipient_id: targetProfileId, status: 'pending' }])
      .select()
      .single();

    if (error) {
      const map = new Map(byProfile);
      if (prev) map.set(targetProfileId, prev); else map.delete(targetProfileId);
      setByProfile(map);
      toast.error(error.message || 'Could not send request');
      return;
    }

    setByProfile(new Map(byProfile).set(targetProfileId, data));
    toast.success('Request sent');
  }, [byProfile, currentUserId]);

  const accept = useCallback(async (targetProfileId) => {
    const row = byProfile.get(targetProfileId);
    if (!row || row.status !== 'pending' || row.recipient_id !== currentUserId) return;

    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .eq('id', row.id)
      .select()
      .single();

    if (error) return toast.error(error.message || 'Accept failed');
    setByProfile(new Map(byProfile).set(targetProfileId, data));
    toast.success('Connection accepted');
  }, [byProfile, currentUserId]);

  const decline = useCallback(async (targetProfileId) => {
    const row = byProfile.get(targetProfileId);
    if (!row || row.status !== 'pending' || row.recipient_id !== currentUserId) return;

    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'declined' })
      .eq('id', row.id)
      .select()
      .single();

    if (error) return toast.error(error.message || 'Decline failed');
    setByProfile(new Map(byProfile).set(targetProfileId, data));
    toast('Request declined');
  }, [byProfile, currentUserId]);

  const cancel = useCallback(async (targetProfileId) => {
    const row = byProfile.get(targetProfileId);
    if (!row || row.status !== 'pending' || row.requester_id !== currentUserId) return;

    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', row.id);

    if (error) return toast.error(error.message || 'Cancel failed');

    const map = new Map(byProfile);
    map.delete(targetProfileId);
    setByProfile(map);
    toast('Request canceled');
  }, [byProfile, currentUserId]);

  const removeConnection = useCallback(async (targetProfileId) => {
    const row = byProfile.get(targetProfileId);
    if (!row || !['accepted','connected'].includes(row.status)) return;

    // Prefer RPC if present
    try {
      const { error } = await supabase.rpc('remove_connection', { p_user: currentUserId, p_other: targetProfileId });
      if (error) throw error;
    } catch (_) {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', row.id);
      if (error) return toast.error(error.message || 'Remove failed');
    }

    const map = new Map(byProfile);
    map.delete(targetProfileId);
    setByProfile(map);
    toast('Connection removed');
  }, [byProfile, currentUserId]);

  return {
    loading,
    byProfile,
    reload: load,
    actions: { connect, accept, decline, cancel, removeConnection },
  };
}
