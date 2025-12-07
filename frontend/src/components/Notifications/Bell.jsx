import React, { useEffect, useRef, useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import NotificationsPanel from './NotificationsPanel';
import { useBellUnreadCount } from '../../hooks/useNotifications';
import { useLocation } from 'react-router-dom';

export default function Bell() {
  const { count: badgeCount } = useBellUnreadCount();
  const [open, setOpen] = useState(false);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const ref = useRef(null);
  const lastCountRef = useRef(null);
  const timeoutRef = useRef(null);
  const location = useLocation();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Click outside
  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (lastCountRef.current === null) {
      lastCountRef.current = badgeCount;
      return;
    }

    if (badgeCount > lastCountRef.current) {
      setShowNewAlert(true);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setShowNewAlert(false);
      }, 2000);
    }

    lastCountRef.current = badgeCount;

    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [badgeCount]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative p-2 rounded-full hover:bg-gray-100"
        aria-label="Open notifications"
        onClick={() => {
          setOpen((v) => !v);
          setShowNewAlert(false);
        }}
      >
        <BellIcon className="w-6 h-6 text-gray-700" />
        {badgeCount > 0 && badgeCount <= 9 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-ocean-500 border-2 border-white shadow-sm"
            aria-hidden
          />
        )}
        {badgeCount >= 10 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ocean-500 text-white text-[10px] leading-[18px] text-center shadow-sm">
            {badgeCount}
          </span>
        )}
        {showNewAlert && (
          <span
            className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-blue-500 text-white text-[10px] leading-none shadow-sm cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowNewAlert(false);
            }}
          >
            New
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 px-3 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:px-0">
          <div className="mx-auto w-full max-w-md sm:ml-auto sm:mr-0 sm:max-w-[360px]">
            <NotificationsPanel onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
