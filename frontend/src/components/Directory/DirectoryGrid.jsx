import React from 'react';
import DirectoryCardSplit from './DirectoryCardSplit';

export default function DirectoryGrid({ items = [], meId, currentTab = 'all', onChanged, compact = false, loading = false }) {
  const Skeleton = () => (
    <div 
      className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm animate-pulse" 
      aria-hidden="true"
      role="status"
    >
      {/* Header: Avatar + Name + Identity */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar skeleton - 60px */}
        <div className="h-[60px] w-[60px] flex-shrink-0 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 ring-2 ring-slate-100" />
        
        {/* Name and identity lines */}
        <div className="flex-1 space-y-2 pt-1">
          {/* Name */}
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          {/* Identity line: Degree · Batch */}
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          {/* Role line: position · company */}
          <div className="h-3 bg-slate-100 rounded w-2/3" />
        </div>
      </div>
      
      {/* Chips row - max 3 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <div className="h-7 bg-slate-100 rounded-md w-24" />
        <div className="h-7 bg-slate-100 rounded-md w-20" />
        <div className="h-7 bg-slate-100 rounded-md w-28" />
      </div>
      
      {/* Actions row */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-3 border-t border-slate-100">
        {/* Connection CTA skeleton */}
        <div className="flex-1 h-11 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg" />
        {/* View Profile skeleton */}
        <div className="h-11 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg w-full sm:w-32" />
      </div>
    </div>
  );

  if (loading) {
    const count = Math.max(6, items.length || 0);
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" role="status" aria-label="Loading alumni profiles">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={`sk-${i}`} />
        ))}
        <span className="sr-only">Loading alumni profiles...</span>
      </div>
    );
  }

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-12 sm:p-16 text-center shadow-sm">
        <div className="mx-auto max-w-md">
          {/* Icon */}
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-ocean-100 to-indigo-100 flex items-center justify-center mb-4 shadow-sm">
            <svg className="h-8 w-8 text-ocean-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          {/* Title */}
          <h3 className="text-lg font-bold text-slate-900 mb-2">No alumni found</h3>
          {/* Description */}
          <p className="text-sm text-slate-600 mb-4">
            Try adjusting your filters or search criteria to find more alumni.
          </p>
        </div>
      </div>
    );
  }

  // Responsive grid: 1 col mobile, 2 cols tablet, 3 cols desktop, 4 cols large screens
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
