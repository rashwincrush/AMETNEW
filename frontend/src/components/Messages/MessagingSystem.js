import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
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
      
      const { data, error: conversationsError } = await supabase
        .from('conversations')
        .select('*, participant_1:profiles!participant_1(*), participant_2:profiles!participant_2(*)')
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false });
        
      if (conversationsError) throw conversationsError;
      
      const formattedConversations = await Promise.all(
        data.map(async (conv) => {
          const otherParticipant = conv.participant_1.id === currentUser.id ? conv.participant_2 : conv.participant_1;
          
          const { count, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', currentUser.id)
            .is('read_at', null);

          const { data: latestMessage, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            id: conv.id,
            name: otherParticipant.full_name || 'Unknown User',
            avatar: otherParticipant.avatar_url,
            lastMessageAt: conv.last_message_at,
            participantId: otherParticipant.id,
            isOnline: otherParticipant.is_online || false,
            unreadCount: countError ? 0 : count,
            latestMessage: latestMessage ? latestMessage.content : 'No messages yet...',
            latestMessageSender: latestMessage ? (latestMessage.sender_id === currentUser.id ? 'You' : otherParticipant.full_name) : '',
          };
        })
      );
      
      setConversations(formattedConversations);
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

  // Real-time listener for new messages
  useEffect(() => {
    if (!currentUser) return;

    const handleNewMessage = async (payload) => {
      const newMessage = payload.new;
      const conversationId = newMessage.conversation_id;

      if (newMessage.sender_id === currentUser.id) {
        // If sender is current user, just update the last message time and move to top
        setConversations(prev => {
          const conv = prev.find(c => c.id === conversationId);
          if (!conv) return prev;
          const otherConvs = prev.filter(c => c.id !== conversationId);
          return [{ ...conv, lastMessageAt: newMessage.created_at, latestMessage: newMessage.content, latestMessageSender: 'You' }, ...otherConvs];
        });
        return;
      }

      // If the message is for the current user
      await fetchUserConversations(); // Refetch all conversations to get the latest state

      if (selectedConversation !== conversationId) {
        const conversation = conversations.find(c => c.id === conversationId);
        const senderName = conversation ? conversation.name : 'Someone';
        
        showInfo(`New message from ${senderName}`);

        const { error: notificationError } = await supabase.from('notifications').insert({
          user_id: currentUser.id,
          type: 'new_message',
          message: `You have a new message from ${senderName}.`,
          link_to: `/messages?conversationId=${conversationId}`,
        });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
        }
      }
    };

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, handleNewMessage)
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          showError('Real-time connection failed. Please refresh.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, selectedConversation, fetchUserConversations, showError, showInfo, conversations]);

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

  const handleCreateConversation = async (userId) => {
    if (!currentUser) {
      showError('You must be logged in to start a conversation.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_id: userId
      });

      if (error) throw error;

      await fetchUserConversations();
      setSelectedConversation(data);
      showSuccess('Conversation started!');
    } catch (err) {
      console.error('Error creating conversation:', err);
      showError('Failed to start conversation.');
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
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 flex overflow-hidden">
        <ConversationList 
          conversations={conversations}
          loading={loading}
          selectedConversationId={selectedConversation}
          onSelectConversation={handleSelectConversation}
          currentUser={currentUser}
        />
        <ChatWindow 
          conversationId={selectedConversation}
          currentUser={currentUser}
          onCreateConversation={handleCreateConversation}
        />
      </div>
    </div>
  );
};

export default MessagingSystem;
