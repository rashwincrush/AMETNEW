import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function ActionRow({ meId, otherId, rel, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
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
    // Find the exact rows first
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

    // Update by primary key one-by-one (PostgREST may reject PATCH with in())
    for (const id of ids) {
      await supabase
        .from('connections')
        .update({ status: 'removed' })
        .eq('id', id);
    }
  });

  const message = () => {
    window.location.href = `/messages?peer=${otherId}`;
  };

  const share = async () => {
    const url = `${window.location.origin}/directory/${otherId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'AMET Alumni Profile', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      // Fallback: show prompt so user can copy manually
      window.prompt('Copy profile link', url);
    }
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

      <button className="btn-ghost px-3 py-1.5 rounded-lg" onClick={share}>{copied ? 'Copied' : 'Share'}</button>
    </div>
  );
}
