import React from 'react';

export default function ChipBar({ counts, active, onChange, showEmployers = false }) {
  const Chip = ({ id, label, count }) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      aria-pressed={active === id}
      title={`${label}${typeof count === 'number' ? ` (${count})` : ''}`}
      className={`min-h-[40px] px-4 py-2 rounded-full border font-medium text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 ${
        active === id 
          ? 'bg-ocean-50 border-ocean-400 text-ocean-800 shadow-sm' 
          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
      }`}
    >
      {label} {typeof count === 'number' ? <span className="text-slate-500">({count})</span> : ''}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-3 items-center py-3">
      <Chip id="all" label="All" count={counts?.all ?? undefined} />
      <Chip id="received" label="Requests Received" count={counts?.received ?? 0} />
      <Chip id="sent" label="Requests Sent" count={counts?.sent ?? 0} />
      <Chip id="connected" label="My Connections" count={counts?.connected ?? 0} />
      {showEmployers && (
        <Chip id="employers" label="Employers" count={counts?.employers ?? 0} />
      )}
    </div>
  );
}
