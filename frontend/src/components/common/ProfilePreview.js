import React from 'react';
import { useProfileById } from '../../hooks/useProfileById';
import { getDisplayName } from '../../utils/displayName';

export default function ProfilePreview({ userId, user = null, size = 48, className = '' }) {
  const { profile, isLoading } = useProfileById(userId);
  const name = getDisplayName(profile, user);
  const avatar = profile?.avatar_url || '/default-avatar.svg';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {isLoading ? (
        <div className="rounded-full bg-gray-200 animate-pulse" style={{ width: size, height: size }} />
      ) : (
        <img
          src={avatar}
          alt={name || 'avatar'}
          className="rounded-full object-cover"
          style={{ width: size, height: size }}
          onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.svg'; }}
        />
      )}
      <span className="truncate text-sm font-medium">{isLoading ? '—' : name}</span>
    </div>
  );
}
