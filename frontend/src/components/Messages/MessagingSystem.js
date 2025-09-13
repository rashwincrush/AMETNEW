import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { logActivity } from '../../utils/activityLogger';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { useNotification } from '../../hooks/useNotification';
import useConnectionsPanel from '../../hooks/useConnectionsPanel';
import ConnectionsPanel from './ConnectionsPanel';

const MessagingSystem = () => {
  const { showInfo, showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  // const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  // Track component mount state
  const isMountedRef = useRef(true);
  const errorNotifiedRef = useRef(false);
  const fetchingConvsRef = useRef(false);
  const lastFetchAtRef = useRef(0);
  const convErrNotifiedRef = useRef(false);
  const initRef = useRef(false);

  // Always call hooks at the top level (badge for pending received requests)
  const { counts } = useConnectionsPanel(currentUser?.id);

  // Fetch current user (session + profile) with small retry to handle transient network hiccups
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const fetchCurrentUser = async () => {
      try {
        // Prefer session-based lookup to avoid extra network request
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = session?.user;

        if (user) {
          // Try up to 2 retries for the profile read if a network error occurs
          const fetchProfileWithRetry = async (attempts = 2) => {
            try {
              const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
              if (profileError) throw profileError;
              return profile;
            } catch (e) {
              const isNetFail = (e && (e.name === 'TypeError' || String(e).includes('Failed to fetch')));
              if (isNetFail && attempts > 0) {
                await new Promise(r => setTimeout(r, 300));
                return fetchProfileWithRetry(attempts - 1);
              }
              throw e;
            }
          };

          let profile = null;
          try {
            profile = await fetchProfileWithRetry();
          } catch (pfErr) {
            // Non-fatal: proceed with session user only
            console.warn('Profile fetch failed; proceeding with session user only');
            profile = null;
          }

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
    // Log page view
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

  // Fetch all DM threads for the current user via view v_my_dm_threads
  const fetchUserThreads = useCallback(async () => {
    if (!currentUser) return;
    const now = Date.now();
    if (fetchingConvsRef.current || (now - lastFetchAtRef.current) < 1500) {
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

  // If /messages?peer=<id> is present, try to select that thread or create it
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const peer = params.get('peer');
      if (!peer || !currentUser) return;
      if (!Array.isArray(threads) || threads.length === 0) return;

      const existing = threads.find(t => String(t.other_user_id) === String(peer));
      if (existing) {
        setSelectedThread(existing);
      } else {
        // Fallback: attempt to create/resolve by checking connection and reloading threads
        handleCreateConversation(peer);
      }
    } catch (e) {
      // no-op
    }
  }, [threads, currentUser]);

  // Realtime is handled inside ChatWindow per selected thread

  const handleSelectThread = (thread) => {
    setSelectedThread(thread);
    logActivity({ action: 'dm_open_thread', meta: { threadId: thread?.thread_id }, route: '/messages' });
  };

  const handleCreateConversation = async (targetUserId) => {
    if (!currentUser) {
      showError('You must be logged in to start a conversation.');
      return;
    }

    try {
      setLoading(true);

      // Check if a connection exists with status accepted/connected
      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .select('status')
        .or(
          `and(requester_id.eq.${currentUser.id},recipient_id.eq.${targetUserId}),` +
          `and(requester_id.eq.${targetUserId},recipient_id.eq.${currentUser.id})`
        )
        .in('status', ['accepted','connected'])
        .maybeSingle();

      if (connectionError || !connection) {
        showError('You must connect with this user first before messaging.');
        setLoading(false);
        return;
      }

      // Threads are auto-created by backend trigger; fetch threads and select the one for target user
      await fetchUserThreads();
      const thread = (Array.isArray(threads) ? threads : []).find(t => t.other_user_id === targetUserId);
      if (thread) {
        setSelectedThread(thread);
        showSuccess('Conversation ready.');
      } else {
        // In case trigger is eventual, poll once more
        const { data } = await supabase
          .from('v_my_dm_threads')
          .select('*')
          .eq('other_user_id', targetUserId)
          .maybeSingle();
        if (data) {
          setSelectedThread(data);
          showSuccess('Conversation ready.');
        } else {
          showInfo('Thread will appear shortly after connection is established.');
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
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingSystem;
