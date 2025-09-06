import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, onPostgresChangesOnce } from '../../utils/supabase';
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

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
            
          if (profileError) throw profileError;
          
          setCurrentUser({ ...user, ...profile });
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load user profile');
        showError('Failed to load user profile');
      }
    };
    
    fetchCurrentUser();
  }, [showError]);

  // Fetch all conversations for the current user
  const fetchUserConversations = useCallback(async () => {
    if (!currentUser) return;
    
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

      const formattedConversations = await Promise.all(
        convRows.map(async (row) => {
          // Determine the other participant via conversation_participants
          let otherUser = null;
          const { data: otherRow } = await supabase
            .from('conversation_participants')
            .select('user_id, user:profiles(id, full_name, avatar_url, is_online)')
            .eq('conversation_id', row.conversation_id)
            .neq('user_id', currentUser.id)
            .limit(1)
            .maybeSingle();
          if (otherRow && otherRow.user) {
            otherUser = {
              id: otherRow.user.id,
              full_name: otherRow.user.full_name,
              avatar_url: otherRow.user.avatar_url,
              is_online: otherRow.user.is_online,
            };
          } else {
            // As a final fallback, default object
            otherUser = { id: null, full_name: 'Unknown User', avatar_url: null, is_online: false };
          }

          // Check if a connection exists with status = 'accepted'
          const { data: connection } = await supabase
            .from('connections')
            .select('status')
            .or(
              `and(requester_id.eq.${currentUser.id},recipient_id.eq.${otherUser.id}),` +
              `and(requester_id.eq.${otherUser.id},recipient_id.eq.${currentUser.id})`
            )
            .eq('status', 'accepted')
            .maybeSingle();
          const isConnected = connection && connection.status === 'accepted';

          // Unread count: use RPC result if present, else compute
          let unreadCount = 0;
          if (typeof row.unread_count === 'number') {
            unreadCount = row.unread_count;
          } else {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', row.conversation_id)
              .neq('sender_id', currentUser.id)
              .is('read_at', null);
            unreadCount = count || 0;
          }

          // Latest message for preview
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', row.conversation_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: row.conversation_id,
            name: otherUser.full_name || 'Unknown User',
            avatar: otherUser.avatar_url,
            lastMessageAt: row.last_message_at || latestMessage?.created_at || null,
            participantId: otherUser.id,
            isOnline: otherUser.is_online || false,
            unreadCount,
            latestMessage: latestMessage || null,
            latestMessageSender: latestMessage ? (latestMessage.sender_id === currentUser.id ? 'You' : otherUser.full_name) : '',
            isConnected,
          };
        })
      );
      
      // Only keep conversations with active connections
      setConversations(formattedConversations.filter(c => c.isConnected));
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
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

      // Proceed only if connected
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user_1_id: currentUser.id,
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
