import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../utils/supabase';
import { logActivity } from '../../utils/activityLogger';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { createThread } from '../../utils/supabase';
import { useNotification } from '../../hooks/useNotification';
import useConnectionsPanel from '../../hooks/useConnectionsPanel';
import ConnectionsPanel from './ConnectionsPanel';
import { useLocation } from 'react-router-dom';
import { debounce } from '../../utils/debounce';

const MessagingSystem = () => {
  const { showInfo, showSuccess, showError } = useNotification();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  // Track component mount state
  const isMountedRef = useRef(true);
  const errorNotifiedRef = useRef(false);
  const fetchingConvsRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const convErrNotifiedRef = useRef(false);
  const initRef = useRef(false);

  // Always call hooks at the top level (badge for pending received requests)
  const { counts } = useConnectionsPanel(currentUser?.id);

  // Fetch current user (session + profile)
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    // Preselect peer stub from query string so right panel isn't empty
    try {
      const params = new URLSearchParams(window.location.search);
      const peerInit = params.get('peer');
      if (peerInit) {
        setSelectedThread({ other_user_id: peerInit });
      }
    } catch (_) { /* ignore */ }

    const fetchCurrentUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = session?.user;
        if (user) {
          // Try to fetch profile (non-fatal if fails)
          let profile = null;
          try {
            const { data: p, error: perr } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            if (perr) throw perr;
            profile = p;
          } catch (_) { profile = null; }
          setCurrentUser(profile ? { ...user, ...profile } : user);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user profile');
        if (!errorNotifiedRef.current) {
          showError('Failed to load user profile');
          errorNotifiedRef.current = true;
        }
      }
    };
    fetchCurrentUser();
    logActivity({ action: 'messages_page_view', route: '/messages' });
  }, []);

  // Persist tab via query param
  const getTabFromQS = () => {
    const params = new URLSearchParams(window.location.search);
    const t = (params.get('tab') || 'chats').toLowerCase();
    return t === 'connections' ? 'connections' : 'chats';
  };
  const [activeTab, setActiveTab] = useState(getTabFromQS());
  const setTab = useCallback((tab) => {
    const t = tab === 'connections' ? 'connections' : 'chats';
    const params = new URLSearchParams(window.location.search);
    params.set('tab', t);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
    setActiveTab(t);
  }, []);

  useEffect(() => {
    setActiveTab(getTabFromQS());
  }, [window.location.search]);

  // Fetch all DM threads via view v_my_dm_threads
  const fetchUserThreads = useCallback(async () => {
    if (!currentUser) return;
    const now = Date.now();
    if (fetchingConvsRef.current || (now - lastFetchAtRef.current) < 500) {
      return;
    }
    fetchingConvsRef.current = true;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_my_dm_threads')
        .select('*')
        .order('thread_id', { ascending: false });
      if (error) throw error;
      setThreads(Array.isArray(data) ? data : []);
      logActivity({ action: 'dm_threads_list_load', meta: { count: (data || []).length }, route: '/messages' });
    } catch (err) {
      console.error('Error fetching threads:', err);
      setError('Failed to load conversations');
      if (!convErrNotifiedRef.current) {
        showError('Failed to load conversations');
        convErrNotifiedRef.current = true;
        setTimeout(() => { convErrNotifiedRef.current = false; }, 5000);
      }
    } finally {
      setLoading(false);
      fetchingConvsRef.current = false;
      lastFetchAtRef.current = Date.now();
    }
  }, [currentUser, showError]);

  useEffect(() => {
    if (currentUser) {
      fetchUserThreads();
    }
  }, [currentUser, fetchUserThreads]);

  // Debounced refresh
  const debouncedRefresh = useMemo(() => debounce(fetchUserThreads, 350), [fetchUserThreads]);

  // Current thread ids for filtering events
  const threadIds = useMemo(() => (Array.isArray(threads) ? threads.map(t => t.thread_id).filter(Boolean) : []), [threads]);
  const threadIdsKey = useMemo(() => threadIds.join(','), [threadIds]);

  // Global realtime subscriptions with channel registry and batching
  useEffect(() => {
    if (!currentUser?.id) return undefined;

    const createdChannels = [];
    const effectId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const batchSize = 20;

    for (let i = 0; i < threadIds.length; i += batchSize) {
      const batch = threadIds.slice(i, i + batchSize);
      if (batch.length === 0) continue;
      const topic = `dm-inbox:${currentUser.id}:${i / batchSize}:${effectId}`;
      const ch = supabase.channel(topic);
      createdChannels.push(ch);
      const inFilter = `in.(${batch.join(',')})`;

      ch.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=${inFilter}` }, () => debouncedRefresh());
      ch.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dm_threads', filter: `id=${inFilter}` }, () => debouncedRefresh());
      ch.subscribe();
    }

    const partTopic = `dm-participation:${currentUser.id}:${effectId}`;
    const chPart = supabase.channel(partTopic);
    createdChannels.push(chPart);
    chPart.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_participants', filter: `user_id=eq.${currentUser.id}` }, () => debouncedRefresh());
    chPart.subscribe();

    return () => {
      for (const ch of createdChannels) {
        try { ch.unsubscribe(); } catch (e) { void e; }
      }
    };
  }, [currentUser?.id, threadIdsKey, debouncedRefresh]);

  // Refresh on window focus
  useEffect(() => {
    const onFocus = () => { fetchUserThreads(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchUserThreads]);

  // If /messages?peer=<id> present, try to select that thread or create it
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(location.search || window.location.search);
        const thread = params.get('thread');
        const peer = params.get('peer');
        if (!currentUser) return;

        if (thread) {
          if (selectedThread?.thread_id && String(selectedThread.thread_id) === String(thread)) return;
          const { data: found } = await supabase
            .from('v_my_dm_threads')
            .select('*')
            .eq('thread_id', thread)
            .maybeSingle();
          if (found) {
            setSelectedThread(found);
            return;
          }
        }

        if (peer) {
          if (selectedThread?.other_user_id && String(selectedThread.other_user_id) === String(peer)) {
            return;
          }

          const { data: existing } = await supabase
            .from('v_my_dm_threads')
            .select('*')
            .eq('other_user_id', peer)
            .maybeSingle();
          if (existing) {
            setSelectedThread(existing);
            return;
          }
          await handleCreateConversation(peer);
          setSelectedThread((cur) => cur || { other_user_id: peer });
        }
      } catch (_) { /* no-op */ }
    })();
  }, [location.search, currentUser, selectedThread?.thread_id, selectedThread?.other_user_id]);

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    try {
      const params = new URLSearchParams(window.location.search);
      if (thread?.thread_id) params.set('thread', thread.thread_id);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, '', newUrl);
    } catch (_) { /* ignore */ }
    logActivity({ action: 'dm_open_thread', meta: { threadId: thread?.thread_id }, route: '/messages' });
  };

  const handleCreateConversation = async (targetUserId) => {
    if (!currentUser) {
      showError('You must be logged in to start a conversation.');
      return;
    }

    try {
      setLoading(true);
      const { data: threadId, error: threadErr } = await createThread(currentUser.id, targetUserId);
      if (threadErr) {
        console.warn('createThread failed:', threadErr?.message || threadErr);
      }

      await fetchUserThreads();
      const thread = (Array.isArray(threads) ? threads : []).find(t => String(t.other_user_id) === String(targetUserId));
      if (thread) {
        setSelectedThread(thread);
        showSuccess('Conversation ready.');
      } else {
        const { data } = await supabase
          .from('v_my_dm_threads')
          .select('*')
          .eq('other_user_id', targetUserId)
          .maybeSingle();
        if (data) {
          setSelectedThread(data);
          showSuccess('Conversation ready.');
        } else {
          showInfo('Thread will appear shortly or after connection is established.');
        }
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      showError('Unable to start conversation.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button className="mt-4 btn-ocean" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[70vh]">
        {/* Page Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              Messages
              {counts?.received > 0 && (
                <span className="inline-flex items-center justify-center text-xs font-medium rounded-full px-2 py-0.5 bg-red-100 text-red-700">
                  {counts.received}
                </span>
              )}
            </h2>
            <div className="flex gap-2">
              <button
                className={`px-3 py-1 rounded-full border ${activeTab==='chats' ? 'bg-ocean-50 border-ocean-300 text-ocean-700' : 'bg-white border-gray-300 text-gray-700'}`}
                onClick={() => setTab('chats')}
              >
                Chats
              </button>
              <button
                className={`px-3 py-1 rounded-full border ${activeTab==='connections' ? 'bg-ocean-50 border-ocean-300 text-ocean-700' : 'bg-white border-gray-300 text-gray-700'}`}
                onClick={() => setTab('connections')}
              >
                Connections {counts?.received > 0 ? `(${counts.received})` : ''}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'connections' ? (
          <div className="flex">
            <div className="w-full">
              <ConnectionsPanel currentUserId={currentUser?.id} />
            </div>
          </div>
        ) : (
          <div className="flex">
            {/* Sidebar */}
            <div className="w-full md:w-96 lg:w-[26rem] border-r border-gray-200">
              <ConversationList
                threads={threads}
                onSelectThread={handleSelectThread}
                selectedThread={selectedThread}
                currentUser={currentUser}
              />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
              <ChatWindow
                thread={selectedThread}
                currentUser={currentUser}
                onMessageSent={debouncedRefresh}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingSystem;
