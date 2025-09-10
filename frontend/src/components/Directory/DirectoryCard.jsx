import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ActionRow from './ActionRow';

const failedAvatarCache = new Set();

function Avatar({ url, name }) {
  const [failed, setFailed] = useState(() => (url ? failedAvatarCache.has(url) : true));
  const initial = useMemo(() => (name ? name.charAt(0).toUpperCase() : '?'), [name]);
  if (!url || failed) {
    return (
      <div className="h-14 w-14 rounded-full bg-ocean-100 flex items-center justify-center">
        <span className="text-ocean-600 font-semibold">{initial}</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name || 'avatar'}
      className="h-14 w-14 rounded-full object-cover"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      width={56}
      height={56}
      onError={() => { if (url) failedAvatarCache.add(url); setFailed(true); }}
    />
  );
}

export default function DirectoryCard({ meId, profile, onChanged, compact = false }) {
  const { id, full_name, avatar_url, graduation_year, headline, rel } = profile || {};

  const cardCls = compact
    ? 'bg-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow'
    : 'bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow';
  const nameCls = compact ? 'text-sm font-semibold text-gray-900 truncate' : 'text-base font-semibold text-gray-900 truncate';
  const subCls = compact ? 'text-xs text-gray-600 mt-0.5 truncate' : 'text-sm text-gray-600 mt-0.5 truncate';

  return (
    <div className={cardCls}>
      <div className="flex items-start gap-3">
        <div className={compact ? 'mt-0.5' : ''}>
          <Avatar url={avatar_url} name={full_name} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className={nameCls}>{full_name}</h3>
              {headline && <p className={subCls}>{headline}</p>}
            </div>
            {graduation_year && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-ocean-50 text-ocean-700 border border-ocean-200">
                Batch {graduation_year}
              </span>
            )}
          </div>

          {/* Primary actions row */}
          <div className="mt-2 flex items-center gap-2">
            <Link
              to={`/directory/${id}`}
              className={compact
                ? 'btn-outline px-2.5 py-1 text-xs rounded-lg'
                : 'btn-outline px-3 py-1.5 text-sm rounded-lg'}
            >
              View Profile
            </Link>
          </div>

          {/* Connection actions */}
          <ActionRow meId={meId} otherId={id} rel={rel} onChanged={onChanged} />
        </div>
      </div>
    </div>
  );
}
