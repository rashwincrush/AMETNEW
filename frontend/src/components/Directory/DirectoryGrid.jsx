import React, { useMemo } from 'react';
import DirectoryCard from './DirectoryCard';
import { useConnections } from '../../hooks/useConnections';

export default function DirectoryGrid({ items = [], meId, onChanged, compact = false }) {
  const visibleIds = useMemo(() => Array.isArray(items) ? items.map((p) => p.id) : [], [items]);
  const connectionsApi = useConnections(meId, visibleIds);

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">No profiles to show.</div>
    );
  }

  const gridCls = compact
    ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <div className={gridCls}>
      {items.map((p) => (
        <DirectoryCard key={p.id} meId={meId} profile={p} onChanged={onChanged} compact={compact} connectionsApi={connectionsApi} />
      ))}
    </div>
  );
}
