import React from 'react';

export default function ChipBar({ counts, active, onChange }) {
  const Chip = ({ id, label, count }) => (
    <button
      onClick={() => onChange(id)}
      className={`px-3 py-1 rounded-full border ${active===id ? 'bg-ocean-50 border-ocean-300 text-ocean-700' : 'bg-white border-gray-300 text-gray-700'}`}
    >
      {label} {typeof count === 'number' ? `(${count})` : ''}
    </button>
  );

  return (
    <div className="flex gap-2 items-center py-3">
      <Chip id="all" label="All" />
      <Chip id="received" label="Requests Received" count={counts?.received ?? 0} />
      <Chip id="sent" label="Requests Sent" count={counts?.sent ?? 0} />
      <Chip id="connected" label="My Connections" count={counts?.connected ?? 0} />
    </div>
  );
}
