import React from 'react';
import NotificationItem from './NotificationItem';
import { useNotifications } from '../../hooks/useNotifications';

const TYPES = ['system','connection','message','event','job','application','mentorship','group','alert'];

export default function NotificationsPanel({ onClose }) {
  const {
    items,
    isLoading,
    isFetching,
    error,
    unreadCount,
    filterTab,
    setFilterTab,
    typeFilter,
    toggleType,
    loadMore,
    markOne,
    markAll,
  } = useNotifications();

  return (
    <div className="w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden flex flex-col" role="dialog" aria-label="Notifications">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          <button className="text-sm text-ocean-600 hover:underline" onClick={markAll} aria-label="Mark all as read">Mark all as read</button>
          <button className="text-gray-500" onClick={onClose} aria-label="Close">✕</button>
        </div>
      </div>

      <div className="px-3 pt-2">
        <div className="flex gap-2 text-sm">
          {['all','unread','read'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTab(t)}
              className={`px-3 py-1 rounded-full border ${filterTab===t?'bg-ocean-600 text-white border-ocean-600':'border-gray-300 text-gray-700'}`}
              aria-pressed={filterTab===t}
            >
              {t[0].toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={`px-2 py-1 rounded-full text-xs border ${typeFilter.has(t)?'bg-gray-800 text-white border-gray-800':'border-gray-300 text-gray-700'}`}
              aria-pressed={typeFilter.has(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[70vh] overflow-auto divide-y mt-2" role="list">
        {isLoading && <div className="p-4 text-sm text-gray-500">Loading...</div>}
        {error && <div className="p-4 text-sm text-red-600">Failed to load</div>}
        {!isLoading && items.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-500">
            {(() => {
              const hasTypeFilters = typeFilter && typeFilter.size > 0;
              if (filterTab === 'unread') return hasTypeFilters ? 'No unread notifications for these types.' : 'You are all caught up.';
              if (filterTab === 'read') return hasTypeFilters ? 'No read notifications for these types yet.' : 'No read notifications yet.';
              return hasTypeFilters ? 'No notifications for the selected types.' : 'No notifications yet.';
            })()}
          </div>
        )}
        {items.map((n) => (
          <div key={n.id} role="listitem">
            <NotificationItem n={n} onToggleRead={markOne} />
          </div>
        ))}
        {items.length > 0 && (
          <div className="p-3">
            <button onClick={loadMore} className="w-full text-sm border rounded-md py-2 hover:bg-gray-50">Load more</button>
          </div>
        )}
      </div>
    </div>
  );
}
