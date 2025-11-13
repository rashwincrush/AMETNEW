import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { supabase } from '../utils/supabase';
import { fetchNotifications, markAllRead, markOneRead, subscribeMyNotifications, BellNotification } from '../api/notifications';
import { useAuth } from '../contexts/AuthContext';

dayjs.extend(relativeTime);

export type NotificationFilterTab = 'all' | 'unread' | 'read';

export function useNotifications() {
  const { user } = useAuth() as any;
  const qc = useQueryClient();
  const [filterTab, setFilterTab] = useState<NotificationFilterTab>('all');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  // Query key excludes filters because filtering is done client-side
  const key = useMemo(() => ['notifications', user?.id, { cursor }], [user?.id, cursor]);

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      // Strict newest-first from bell_notifications via API helper
      const rows = await fetchNotifications({ limit: 30, cursor });
      return rows as BellNotification[];
    },
  });

  const all = (query.data || []) as BellNotification[];

  // Apply tab filter in memory
  const byTab = useMemo(() => {
    if (filterTab === 'unread') return all.filter((n) => !n.is_read);
    if (filterTab === 'read') return all.filter((n) => n.is_read);
    return all;
  }, [all, filterTab]);

  // Apply type filter in memory
  const items = useMemo(() => {
    if (!typeFilter || typeFilter.size === 0) return byTab;
    return byTab.filter((n) => typeFilter.has(n.type));
  }, [byTab, typeFilter]);

  // unread count derived from all loaded
  const unreadCount = useMemo(() => all.filter((n) => !n.is_read).length, [all]);

  // realtime
  const subRef = useRef<any>(null);
  useEffect(() => {
    if (!user) return;
    subRef.current = subscribeMyNotifications(user.id, () => {
      qc.invalidateQueries({ queryKey: ['notifications', user.id] });
    });
    return () => {
      if (subRef.current) supabase.removeChannel(subRef.current);
    };
  }, [user?.id]);

  // pagination: load more
  const loadMore = async () => {
    const current = all;
    if (current.length === 0) return;
    const last = current[current.length - 1];
    setCursor(last.created_at);
  };

  const toggleType = (t: string) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const markOne = async (id: string, toRead = true) => {
    if (toRead) await markOneRead(id);
    else {
      const { error } = await supabase.from('notifications').update({ is_read: false, read_at: null }).eq('id', id);
      if (error) throw error;
    }
    await qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  const markAll = async () => {
    await markAllRead();
    await qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  return {
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as any,
    unreadCount,
    filterTab,
    setFilterTab,
    typeFilter,
    toggleType,
    loadMore,
    markOne,
    markAll,
  };
}

// Optional: RPC-based unread count for bell badge
export function useBellUnreadCount() {
  const { user } = useAuth() as any;
  return useQuery({
    queryKey: ['bell-unread-count', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_bell_unread_count');
      if (error) throw error;
      const n = typeof data === 'number' ? data : 0;
      return n as number;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}
