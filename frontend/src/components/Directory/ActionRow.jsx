import React, { useMemo, useState } from 'react';
import { supabase } from '../../utils/supabase';
import ShareProfileModal from './ShareProfileModal';

export default function ActionRow({ meId, otherId, rel, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const profileUrl = useMemo(() => `${window.location.origin}/directory/${otherId}`, [otherId]);
  const rawStatus = rel?.status ?? null;
  const side = rel?.pending_side ?? null;
  // Treat 'removed' and 'declined' as no active connection (idle)
  const status = (rawStatus === 'removed' || rawStatus === 'declined') ? null : rawStatus;

  const safeRun = async (fn) => {
    try {
      setBusy(true);
      await fn();
    } finally {
      setBusy(false);
      onChanged?.();
    }
  };

  const connect = async () => safeRun(async () => {
    await supabase.from('connections').insert({
      requester_id: meId,
      recipient_id: otherId,
      status: 'pending'
    });
  });

  const cancel = async () => safeRun(async () => {
    // Since side === 'sent', this row must have requester_id = meId and recipient_id = otherId
    await supabase
      .from('connections')
      .delete({ count: 'exact' })
      .match({ requester_id: meId, recipient_id: otherId, status: 'pending' });
  });

  const accept = async () => safeRun(async () => {
    await supabase
      .from('connections')
      .update({ status: 'accepted' })
      .match({ requester_id: otherId, recipient_id: meId, status: 'pending' });
  });

  const decline = async () => safeRun(async () => {
    await supabase
      .from('connections')
      .update({ status: 'declined' })
      .match({ requester_id: otherId, recipient_id: meId, status: 'pending' });
  });

  const remove = async () => safeRun(async () => {
    // Prefer server-side RPC to avoid any RLS/URL quirks
    try {
      const { data, error } = await supabase.rpc('remove_connection', { p_user: meId, p_other: otherId });
      if (error) throw error;
      return;
    } catch (rpcErr) {
      console.warn('remove_connection RPC not available or failed, falling back:', rpcErr?.message || rpcErr);
      // Fallback: Find the exact rows first
      const ids = [];
      const fetchDir = async (rq, rc) => {
        const { data, error } = await supabase
          .from('connections')
          .select('id, status')
          .match({ requester_id: rq, recipient_id: rc });
        if (!error && Array.isArray(data)) {
          data.forEach(r => {
            if (r.status === 'accepted' || r.status === 'connected') ids.push(r.id);
          });
        }
      };
      await fetchDir(meId, otherId);
      await fetchDir(otherId, meId);

      if (ids.length === 0) return;

      // Delete by primary key one-by-one (status enum disallows 'removed')
      for (const id of ids) {
        await supabase
          .from('connections')
          .delete()
          .eq('id', id);
      }
    }
  });

  const message = () => {
    window.location.href = `/messages?peer=${otherId}`;
  };

  const share = async () => {
    setShareOpen(true);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {!status && (
        <button className="btn-ocean px-3 py-1.5 rounded-lg" disabled={busy} onClick={connect}>Connect</button>
      )}

      {status === 'pending' && side === 'sent' && (
        <>
          <button className="btn-ghost px-3 py-1.5 rounded-lg disabled:opacity-50" disabled>Pending…</button>
          <button className="btn-outline px-3 py-1.5 rounded-lg" disabled={busy} onClick={cancel}>Cancel</button>
        </>
      )}

      {status === 'pending' && side === 'received' && (
        <>
          <button className="btn-success px-3 py-1.5 rounded-lg" disabled={busy} onClick={accept}>Accept</button>
          <button className="btn-outline px-3 py-1.5 rounded-lg" disabled={busy} onClick={decline}>Decline</button>
        </>
      )}

      {['accepted','connected'].includes(status) && (
        <>
          <button className="btn-ocean px-3 py-1.5 rounded-lg" onClick={message}>Message</button>
          <button className="btn-outline px-3 py-1.5 rounded-lg" disabled={busy} onClick={remove}>Remove</button>
        </>
      )}

      <button className="btn-ghost px-3 py-1.5 rounded-lg" onClick={share}>Share</button>
      <ShareProfileModal open={shareOpen} onClose={() => setShareOpen(false)} url={profileUrl} />
    </div>
  );
}
