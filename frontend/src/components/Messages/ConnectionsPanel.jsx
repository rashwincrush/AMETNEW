// frontend/src/components/Messages/ConnectionsPanel.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useConnectionsPanel from '../../hooks/useConnectionsPanel';

const Avatar = ({ url, name }) => {
  const initial = (name || 'A').trim().charAt(0).toUpperCase();
  if (!url) {
    return (
      <div className="h-10 w-10 rounded-full bg-ocean-100 flex items-center justify-center">
        <span className="text-ocean-600 font-medium">{initial}</span>
      </div>
    );
  }
  return <img src={url} alt={name || 'avatar'} className="h-10 w-10 rounded-full object-cover" />;
};

function Row({ peer, onAccept, onReject, onCancel, onMessage }) {
  const name = peer?.full_name || `${peer?.first_name || ''} ${peer?.last_name || ''}`.trim() || (peer?.email || '').split('@')[0] || 'Alumni';
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg bg-white">
      <div className="flex items-center gap-3">
        <Avatar url={peer?.avatar_url} name={name} />
        <div>
          <div className="text-sm font-medium text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">
            {[peer?.degree_program, peer?.department, peer?.graduation_year].filter(Boolean).join(' • ')}
          </div>
          <div className="text-xs text-gray-500">
            {[peer?.current_job_title, peer?.company_name].filter(Boolean).join(' at ')}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onAccept && (
          <button className="px-2 py-1 text-xs rounded bg-green-600 text-white" onClick={onAccept}>Accept</button>
        )}
        {onReject && (
          <button className="px-2 py-1 text-xs rounded bg-red-600 text-white" onClick={onReject}>Reject</button>
        )}
        {onCancel && (
          <button className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700" onClick={onCancel}>Cancel</button>
        )}
        {onMessage && (
          <button className="px-2 py-1 text-xs rounded bg-ocean-600 text-white" onClick={onMessage}>Message</button>
        )}
      </div>
    </div>
  );
}

export default function ConnectionsPanel({ currentUserId, initialTab = 'received' }) {
  const navigate = useNavigate();
  const { loading, lists, counts, actions } = useConnectionsPanel(currentUserId);
  const [active, setActive] = React.useState(initialTab);

  const emptyText = useMemo(() => ({
    received: 'No incoming requests',
    sent: 'No sent requests',
    accepted: 'No connections yet',
  }), []);

  const onMessage = (id) => navigate(`/messages?peer=${id}`);

  const data = active === 'received' ? lists.received : active === 'sent' ? lists.sent : lists.accepted;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <button className={`px-3 py-1 rounded-full border ${active==='received' ? 'bg-ocean-50 border-ocean-300 text-ocean-700' : 'bg-white border-gray-300 text-gray-700'}`} onClick={() => setActive('received')}>Requests Received ({counts.received})</button>
        <button className={`px-3 py-1 rounded-full border ${active==='sent' ? 'bg-ocean-50 border-ocean-300 text-ocean-700' : 'bg-white border-gray-300 text-gray-700'}`} onClick={() => setActive('sent')}>Requests Sent ({counts.sent})</button>
        <button className={`px-3 py-1 rounded-full border ${active==='accepted' ? 'bg-ocean-50 border-ocean-300 text-ocean-700' : 'bg-white border-gray-300 text-gray-700'}`} onClick={() => setActive('accepted')}>My Connections ({counts.accepted})</button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (Array.isArray(data) && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((p) => (
            <Row
              key={p.id}
              peer={p}
              onAccept={active==='received' ? (()=>actions.accept(p.id)) : undefined}
              onReject={active==='received' ? (()=>actions.reject(p.id)) : undefined}
              onCancel={active==='sent' ? (()=>actions.cancel(p.id)) : undefined}
              onMessage={active==='accepted' ? (()=>onMessage(p.id)) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">{emptyText[active]}</div>
      ))}
    </div>
  );
}
