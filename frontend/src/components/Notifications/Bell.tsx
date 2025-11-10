import React, { useEffect, useRef, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationsPanel from './NotificationsPanel';
import { useNotifications } from '../../hooks/useNotifications';
import { useRouter } from 'next/router';

export default function Bell() {
  const { unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onRoute = () => setOpen(false);
    router.events.on('routeChangeStart', onRoute);
    return () => { router.events.off('routeChangeStart', onRoute); };
  }, [router]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-label="Open notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 z-50 w-[360px] max-w-[90vw]">
          <NotificationsPanel onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
