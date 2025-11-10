import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { supabase } from '../utils/supabase';
import { Notification, fetchNotifications, markAllRead, markOneRead, subscribeMyNotifications } from '../api/notifications';
import { useAuth } from '../contexts/AuthContext';

dayjs.extend(relativeTime);

export type NotificationFilterTab = 'all' | 'unread' | 'read';

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filterTab, setFilterTab] = useState<NotificationFilterTab>('all');
  const [typeFilter, setTypeFilter] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const key = useMemo(() => ['notifications', user?.id, { filterTab, types: [...typeFilter], cursor }], [user?.id, filterTab, typeFilter, cursor]);

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      // Build dynamic query to support filters
      let base = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user!.id)
        .order('is_read', { ascending: true })
        .order('created_at', { descending: true })
        .limit(30);

      if (filterTab === 'unread') base = base.eq('is_read', false);
      if (filterTab === 'read') base = base.eq('is_read', true);
      if (typeFilter.size > 0) base = base.in('type', [...typeFilter]);
      if (cursor) base = base.lt('created_at', cursor);

      const { data, error } = await base;
      if (error) throw error;
      return (data || []) as Notification[];
    },
    keepPreviousData: true,
  });

  // unread count derived
  const unreadCount = (query.data || []).filter((n) => !n.is_read).length;

  // realtime
  const subRef = useRef<any>();
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
    const current = query.data || [];
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
    items: query.data || [],
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
