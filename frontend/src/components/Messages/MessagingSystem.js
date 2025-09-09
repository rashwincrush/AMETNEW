import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, onPostgresChangesOnce } from '../../utils/supabase';
import { logActivity } from '../../utils/activityLogger';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { useNotification } from '../../hooks/useNotification';

const MessagingSystem = () => {
  const { showInfo, showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
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

  // Fetch all conversations for the current user
  const fetchUserConversations = useCallback(async () => {
    if (!currentUser) return;
    // Throttle: do not fetch more than once every 1500ms
    const now = Date.now();
    if (fetchingConvsRef.current || (now - lastFetchAtRef.current) < 1500) {
      return;
    }
    fetchingConvsRef.current = true;
    
    try {
      setLoading(true);
      // Prefer RPC if available for efficient conversation fetching
      let convRows;
      try {
        const { data, error } = await supabase
          .rpc('get_user_conversations_v2', { p_user_id: currentUser.id });
        if (error) throw error;
        convRows = data || [];
      } catch (rpcErr) {
        console.warn('RPC get_user_conversations_v2 failed; falling back to manual query', rpcErr);
        // Fallback: find conversations via conversation_participants
        const { data: myConvs, error: convsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, conversation:conversations(last_message_at, created_at)')
          .eq('user_id', currentUser.id);
        if (convsError) throw convsError;
        const seen = new Set();
        convRows = (myConvs || [])
          .filter(r => {
            if (seen.has(r.conversation_id)) return false;
            seen.add(r.conversation_id);
            return true;
          })
          .map(r => ({
            conversation_id: r.conversation_id,
            last_message_at: r.conversation?.last_message_at || null,
          }));
      }

      // Batch fetch other participants for all conversations to avoid N+1
      const convIds = convRows.map(r => r.conversation_id);
      const { data: others } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user:profiles(id, full_name, avatar_url, is_online)')
        .in('conversation_id', convIds)
        .neq('user_id', currentUser.id);

      const otherMap = new Map();
      (others || []).forEach(r => {
        if (!otherMap.has(r.conversation_id)) {
          otherMap.set(r.conversation_id, r.user);
        }
      });

      let formattedConversations = convRows.map((row) => {
        const other = otherMap.get(row.conversation_id) || {};
        return {
          id: row.conversation_id,
          name: other.full_name || 'Unknown User',
          avatar: other.avatar_url || null,
          lastMessageAt: row.last_message_at || row.created_at || null,
          participantId: other.id || null,
          isOnline: !!other.is_online,
          unreadCount: typeof row.unread_count === 'number' ? row.unread_count : 0,
          latestMessage: null,
          latestMessageSender: '',
          isConnected: true, // Assume connected for list; detailed check deferred
        };
      });
      
      // Only keep conversations with active connections and sort by latest message time desc
      formattedConversations = formattedConversations
        .filter(c => c.isConnected)
        .sort((a, b) => {
          const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return tb - ta;
        });
      setConversations(formattedConversations);
      // Log conversations list load
      logActivity({ action: 'messages_list_load', meta: { count: formattedConversations.length } , route: '/messages' });
    } catch (err) {
      console.error('Error fetching conversations:', err);
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
      fetchUserConversations();
    }
  }, [currentUser, fetchUserConversations]);

  // Handle new messages with useCallback
  const handleNewMessage = useCallback(async (payload) => {
    if (!isMountedRef.current || !currentUser) return;

    const newMessage = payload.new;
    const conversationId = newMessage.conversation_id;

    setConversations(prevConvs => {
      const convIndex = prevConvs.findIndex(c => c.id === conversationId);
      let updatedConvs = [...prevConvs];

      if (convIndex !== -1) {
        // Conversation exists, update it and move to top
        const conv = { ...updatedConvs[convIndex] };
        updatedConvs.splice(convIndex, 1);

        conv.lastMessageAt = newMessage.created_at;
        conv.latestMessage = newMessage;

        if (newMessage.sender_id === currentUser.id) {
          conv.latestMessageSender = 'You';
        } else {
          conv.latestMessageSender = conv.name;
          conv.unreadCount = (conv.unreadCount || 0) + 1;

          // Show notification if chat is not open
          if (selectedConversation !== conversationId) {
            showInfo(`New message from ${conv.name}`);
            // The notification creation logic can be triggered here if needed
          }
        }
        return [conv, ...updatedConvs];
      } else {
        // New conversation, refetch everything. This is an edge case.
        fetchUserConversations();
        return prevConvs;
      }
    });
  }, [currentUser, selectedConversation, fetchUserConversations, showInfo]);

  // Real-time listener for new messages
  useEffect(() => {
    if (!currentUser) return;

    isMountedRef.current = true;

    onPostgresChangesOnce(
      'public:messages',
      'messages-listener',
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      },
      handleNewMessage
    );

    return () => {
      isMountedRef.current = false;
    };
  }, [currentUser, handleNewMessage]);

  const handleSelectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
    logActivity({ action: 'messages_open_conversation', meta: { conversationId }, route: '/messages' });
    // Mark messages as read
    const markAsRead = async () => {
        await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .is('read_at', null)
            .neq('sender_id', currentUser.id);
        // Refresh conversations to update unread count
        fetchUserConversations();
    };
    markAsRead();
  };

  const handleCreateConversation = async (targetUserId) => {
    if (!currentUser) {
      showError('You must be logged in to start a conversation.');
      return;
    }

    try {
      setLoading(true);

      // Check if a connection exists with status = 'accepted'
      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .select('status')
        .or(
          `and(requester_id.eq.${currentUser.id},recipient_id.eq.${targetUserId}),` +
          `and(requester_id.eq.${targetUserId},recipient_id.eq.${currentUser.id})`
        )
        .eq('status', 'accepted')
        .maybeSingle();

      if (connectionError || !connection) {
        showError('You must connect with this user first before messaging.');
        setLoading(false);
        return;
      }

      // Proceed only if connected; get current auth user via session (no extra network call)
      const { data: { session }, error: authErr } = await supabase.auth.getSession();
      if (authErr || !session?.user) {
        showError('Not authenticated');
        setLoading(false);
        return;
      }
      const { id: currentId } = session.user;

      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user_1_id: currentId,
        user_2_id: targetUserId
      });

      if (error) throw error;

      await fetchUserConversations();
      setSelectedConversation(data);
      showSuccess('Conversation started!');
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
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Sidebar */}
          <div className="w-full md:w-96 lg:w-[26rem] border-r border-gray-200">
            <ConversationList
              conversations={conversations}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation}
              currentUser={currentUser}
            />
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            <ChatWindow
              conversationId={selectedConversation}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingSystem;
