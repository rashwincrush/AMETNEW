import React from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { iconForType } from './NotificationIcons';
import type { Notification } from '../../api/notifications';

type Props = { n: Notification; onToggleRead?: (id: string, toRead?: boolean) => void };

export default function NotificationItem({ n, onToggleRead }: Props) {
  const router = useRouter();
  const Icon = iconForType(n.type, n.metadata || undefined);
  const open = () => {
    if (n.link) router.push(n.link);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => e.key === 'Enter' && open()}
      className={`flex items-start gap-3 px-3 py-2 rounded-md cursor-pointer ${!n.is_read ? 'bg-ocean-50' : 'hover:bg-gray-50'}`}
      aria-label={n.title}
    >
      <div className="mt-1">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={`text-sm ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>{n.title}</p>
          <span className="ml-2 shrink-0 text-xs text-gray-500">{dayjs(n.created_at).fromNow()}</span>
        </div>
        {n.message && <p className="text-sm text-gray-600 line-clamp-2">{n.message}</p>}
      </div>
      <div className="flex items-center gap-2">
        {!n.is_read && <span className="w-2 h-2 rounded-full bg-ocean-500" aria-hidden />}
        <div className="relative">
          <button
            type="button"
            className="p-1 text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              onToggleRead?.(n.id, !n.is_read);
            }}
            aria-label={n.is_read ? 'Mark as unread' : 'Mark as read'}
            title={n.is_read ? 'Mark as unread' : 'Mark as read'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
