/**
 * @deprecated This JS hook is deprecated. Use the TS version from hooks/useNotifications.ts instead.
 * This file re-exports from the TS implementation for backwards compatibility.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabase';
import { 
  markAllRead, 
  markOneRead, 
  markOneUnread, 
  subscribeMyNotifications, 
  ALLOWED_TYPES,
  getBellUnreadCount
} from '../api/notifications.ts';
import { useAuth } from '../contexts/AuthContext';

export function useNotifications() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filterTab, setFilterTab] = useState('unread'); // now default to unread-only view
  const [typeFilter, setTypeFilter] = useState(new Set());
  const [cursor, setCursor] = useState(undefined);

  const key = useMemo(() => ['notifications', user?.id, { filterTab, types: Array.from(typeFilter).sort().join(','), cursor }], [user?.id, filterTab, typeFilter, cursor]);

  // Load user notification preferences (in_app_enabled). Missing rows => enabled.
  const prefsQuery = useQuery({
    queryKey: ['notif_prefs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Prefer RLS-safe view; fallback to base table with alias if needed
      let { data, error } = await supabase
        .from('v_notification_prefs')
        .select('type,in_app_enabled')
        .eq('user_id', user.id);
      if (error) {
        // Fallback: some stacks may not have the view but expose base table with different column names
        const fb = await supabase
          .from('notification_preferences')
          .select('notification_type,in_app_enabled')
          .eq('user_id', user.id);
        if (fb.error) throw error; // throw original error if fallback also fails
        data = (fb.data || []).map((r) => ({ type: r.notification_type, in_app_enabled: r.in_app_enabled }));
      }
      if (error) throw error;
      const map = {};
      (data || []).forEach((r) => { map[r.type] = !!r.in_app_enabled; });
      return map; // type -> boolean
    },
    staleTime: 60_000,
  });

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      let base = supabase
        .from('bell_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { descending: true })
        .limit(30);

      if (filterTab === 'unread') base = base.eq('is_read', false);
      if (filterTab === 'read') base = base.eq('is_read', true);
      if (typeFilter.size > 0) base = base.in('type', Array.from(typeFilter));
      if (cursor) base = base.lt('created_at', cursor);

      const { data, error } = await base;
      if (error) throw error;
      // Filter: allowed types AND user prefs (default true if missing)
      const prefs = prefsQuery.data || {};
      return (data || []).filter((n) => ALLOWED_TYPES.has(n.type) && (prefs[n.type] !== false));
    },
    keepPreviousData: true,
  });

  // Always enforce newest-first ordering client-side for safety
  const items = (query.data || []).slice().sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return tb - ta;
  });
  const unreadCount = items.filter((n) => !n.is_read).length;

  // realtime subscription
  const subRef = useRef(null);
  const debounceRef = useRef(null);
  useEffect(() => {
    if (!user?.id) return;
    
    // Clean up any existing subscription first
    if (subRef.current) {
      supabase.removeChannel(subRef.current);
      subRef.current = null;
    }
    
    // Create new subscription - subscribeMyNotifications returns a channel
    subRef.current = subscribeMyNotifications(user.id, () => {
      // Debounce invalidation to avoid thrashing on rapid events
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        qc.invalidateQueries({ queryKey: ['notifications', user.id] });
      }, 300);
    });
    
    return () => {
      if (subRef.current) {
        supabase.removeChannel(subRef.current);
        subRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [user?.id, qc]);

  // pagination: load more
  const loadMore = () => {
    if (!items.length) return;
    const last = items[items.length - 1];
    setCursor(last.created_at);
  };

  const toggleType = (t) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const markOne = async (id, toRead = true) => {
    if (toRead) await markOneRead(id);
    else await markOneUnread(id);
    await qc.invalidateQueries({ queryKey: ['notifications', user?.id] });
  };

  const markAll = async () => {
    // Optimistic: set all items to read immediately in cache
    const queryKeyBase = ['notifications', user?.id];
    const allKeys = qc.getQueryCache().findAll({ queryKey: queryKeyBase });
    const prevStates = [];
    allKeys.forEach((q) => {
      const prev = qc.getQueryData(q.queryKey);
      prevStates.push([q.queryKey, prev]);
      if (Array.isArray(prev)) {
        qc.setQueryData(q.queryKey, prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() })));
      }
    });
    try {
      await markAllRead();
    } catch (e) {
      // Rollback on failure
      prevStates.forEach(([k, v]) => qc.setQueryData(k, v));
      throw e;
    } finally {
      // Ensure refetch to align with server
      qc.invalidateQueries({ queryKey: queryKeyBase });
    }
  };

  return {
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
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

/**
 * RPC-based unread count for bell badge
 * Uses the canonical get_unread_notification_count RPC via TS API
 * @deprecated Use useBellUnreadCount from hooks/useNotifications.ts instead
 */
export function useBellUnreadCount() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['bell-unread-count', user?.id],
    enabled: !!user?.id,
    queryFn: getBellUnreadCount, // Uses canonical RPC
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000, // Refetch every minute
  });

  // Subscribe to realtime updates
  const subRef = useRef(null);
  useEffect(() => {
    if (!user?.id) return;

    // Clean up any existing subscription first
    if (subRef.current) {
      supabase.removeChannel(subRef.current);
      subRef.current = null;
    }

    subRef.current = subscribeMyNotifications(user.id, () => {
      qc.invalidateQueries({ queryKey: ['bell-unread-count', user.id] });
    });

    return () => {
      if (subRef.current) {
        supabase.removeChannel(subRef.current);
        subRef.current = null;
      }
    };
  }, [user?.id, qc]);

  return {
    count: query.data || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
