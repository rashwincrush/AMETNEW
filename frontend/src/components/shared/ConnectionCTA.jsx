import React, { useState } from 'react';
import { TextPill } from './Chips';
import { idempotentConnect, cancelPending, acceptPending, declinePending, removeConnection } from '../../utils/connections';
import { MessageButton, RemoveButton } from './Buttons';

// scope: 'directory' | 'profile'
// currentTab: 'all' | 'received' | 'sent' | 'connected' (optional outside Directory)
export default function ConnectionCTA({ meId, peerId, rel, currentTab = 'all', scope = 'directory', onChanged, onMessage }) {
  const [busy, setBusy] = useState(false);
  const [overrideRel, setOverrideRel] = useState(null); // used to force immediate fallback after remove
  const safe = (fn) => async () => {
    if (!meId || !peerId || busy) return;
    setBusy(true);
    try { await fn(); onChanged?.(); } finally { setBusy(false); }
  };

  const doConnect = async () => {
    if (!meId || !peerId || busy) return;
    setBusy(true);
    try {
      await idempotentConnect(meId, peerId, { status: effStatus, pending_side: effSide });
      onChanged?.();
      // Optimistically reflect as pending(sent)
      setOverrideRel({ status: 'pending', pending_side: 'sent' });
    } catch (e) {
      // Treat conflict/duplicate as already pending (outgoing)
      const statusCode = e?.status || e?.code;
      if (statusCode === 409 || statusCode === '23505') {
        setOverrideRel({ status: 'pending', pending_side: 'sent' });
      }
    } finally {
      setBusy(false);
    }
  };
  const doCancel = safe(() => cancelPending(meId, peerId));
  const doAccept = safe(() => acceptPending(meId, peerId));
  const doDecline = safe(() => declinePending(meId, peerId));
  const doRemove = safe(async () => {
    await removeConnection(meId, peerId);
    // Immediately reflect as disconnected in UI
    setOverrideRel({ status: null, pending_side: null });
  });

  const effStatus = (overrideRel?.status ?? rel?.status) ?? null;
  const effSide = (overrideRel?.pending_side ?? rel?.pending_side) ?? null;

  const isConnected = (s) => ['accepted', 'connected'].includes(s);
  const nullishOrReset = !effStatus || ['declined', 'removed'].includes(effStatus);

  const showAcceptDecline = scope !== 'directory' && (currentTab === 'received' || (effStatus === 'pending' && effSide === 'received'));
  const showRequestSent = currentTab === 'sent' || (effStatus === 'pending' && effSide === 'sent');
  const showMessage = currentTab === 'connected' || isConnected(effStatus);
  const showConnect = ((scope === 'profile') || (currentTab === 'all')) && nullishOrReset;

  return (
    <div className="space-y-2 w-full max-w-[180px]">
      {showAcceptDecline && (
        <div className="flex gap-2">
          <button onClick={doAccept} disabled={!meId || busy} className="btn-ocean flex-1 py-1.5 rounded-md text-sm disabled:opacity-50">Accept</button>
          <button onClick={doDecline} disabled={!meId || busy} className="btn-outline flex-1 py-1.5 rounded-md text-sm disabled:opacity-50">Decline</button>
        </div>
      )}

      {showRequestSent && (
        <>
          <TextPill>Request sent</TextPill>
          <button onClick={doCancel} disabled={!meId || busy} className="btn-outline w-full py-1.5 rounded-md text-sm disabled:opacity-50">Cancel</button>
        </>
      )}

      {showMessage && (
        <div className="flex gap-2">
          {scope === 'profile' ? (
            <>
              <MessageButton onClick={onMessage} disabled={!meId} />
              <RemoveButton onClick={doRemove} disabled={!meId} loading={busy} />
            </>
          ) : (
            <button onClick={onMessage} disabled={!meId} className="btn-ocean flex-1 py-1.5 rounded-md text-sm disabled:opacity-50">Message</button>
          )}
        </div>
      )}

      {showConnect && (
        <button onClick={doConnect} disabled={!meId || busy} className="btn-ocean w-full py-1.5 rounded-md text-sm disabled:opacity-50">Connect</button>
      )}
    </div>
  );
}
