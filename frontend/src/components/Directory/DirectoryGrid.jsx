import React from 'react';
import DirectoryCardSplit from './DirectoryCardSplit';

export default function DirectoryGrid({ items = [], meId, currentTab = 'all', onChanged, compact = false, loading = false }) {
  const Skeleton = () => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-16 w-16 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-6 bg-slate-100 rounded" />
        <div className="h-6 bg-slate-100 rounded w-5/6" />
      </div>
      <div className="mt-3 pt-3 border-t border-slate-100 flex gap-2">
        <div className="h-8 bg-slate-200 rounded w-28" />
        <div className="h-8 bg-slate-200 rounded w-24" />
      </div>
    </div>
  );

  if (loading) {
    const count = Math.max(6, items.length || 0);
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={`sk-${i}`} />
        ))}
      </div>
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
        <p>No profiles to show.</p>
        <p className="mt-1 text-sm">Try adjusting your filters or search criteria.</p>
      </div>
    );
  }

  // Fixed grid with exactly 3 cards per row on larger screens
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
      {items.map((profile) => (
        <DirectoryCardSplit
          key={profile.id}
          profile={profile}
          meId={meId}
          currentTab={currentTab}
          onChanged={onChanged}
        />
      ))}
    </div>
  );
}
