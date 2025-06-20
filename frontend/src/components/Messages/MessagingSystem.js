import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import toast from 'react-hot-toast';

const MessagingSystem = () => {
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
          // Get the user's profile
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
        toast.error('Failed to load user profile');
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Fetch conversations using direct queries instead of RPC functions
  const fetchUserConversations = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      
      // Get all conversations for the current user
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id, 
          last_message_at,
          created_at,
          participant_1,
          participant_2
        `)
        .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false });
        
      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        throw conversationsError;
      }
      
      if (conversations.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }
      
      // Fetch participant details and message info for each conversation
      const formattedConversations = await Promise.all(
        conversations.map(async (conv) => {
          // Determine the other participant (not the current user)
          const otherParticipantId = 
            conv.participant_1 === currentUser.id ? conv.participant_2 : conv.participant_1;
          
          // Get participant profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, job_title, is_online')
            .eq('id', otherParticipantId)
            .single();
            
          if (profileError) {
            console.error('Error fetching participant profile:', profileError);
            // Continue with limited profile info
          }
            
          // Get unread count
          const { count, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', currentUser.id)
            .is('read_at', null);
            
          // Get latest message
          const { data: latestMessage, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
            
          return {
            id: conv.id,
            name: profileError ? 'Unknown User' : (profile?.full_name || 'Unknown User'),
            avatar: profile?.avatar_url || null,
            lastMessageAt: conv.last_message_at,
            createdAt: conv.created_at,
            participantId: otherParticipantId,
            isOnline: profile?.is_online || false,
            unreadCount: countError ? 0 : (count || 0),
            latestMessage: msgError ? null : latestMessage
          };
        })
      );
      
      setConversations(formattedConversations);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  
  // Fetch conversations when user changes
  useEffect(() => {
    fetchUserConversations();
  }, [fetchUserConversations]);
  
  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;
    
    // Subscribe to new conversations and conversation updates
    const conversationsChannel = supabase.channel('conversations-changes');
    
    // Listen for conversation inserts where user is participant_1
    conversationsChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `participant_1=eq.${currentUser.id}`,
      },
      handleNewConversation
    );
    
    // Listen for conversation inserts where user is participant_2
    conversationsChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'conversations',
        filter: `participant_2=eq.${currentUser.id}`,
      },
      handleNewConversation
    );
    
    // Listen for conversation updates where user is participant_1
    conversationsChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `participant_1=eq.${currentUser.id}`,
      },
      handleConversationUpdate
    );
    
    // Listen for conversation updates where user is participant_2
    conversationsChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations',
        filter: `participant_2=eq.${currentUser.id}`,
      },
      handleConversationUpdate
    );
    
    // Subscribe to the channel
    try {
      conversationsChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to conversation changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to conversation changes');
          toast.error('Real-time updates unavailable');
        }
      });
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
      toast.error('Real-time updates unavailable');
    }
      
    return () => {
      try {
        if (conversationsChannel) {
          supabase.removeChannel(conversationsChannel);
          console.log('Unsubscribed from conversation changes');
        }
      } catch (err) {
        console.error('Error cleaning up conversation subscription:', err);
      }
    };
  }, [currentUser]);

  const handleNewConversation = async (payload) => {
    try {
      // Fetch the conversation details
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id, 
          last_message_at,
          participant_1,
          participant_2
        `)
        .eq('id', payload.new.id)
        .single();
        
      if (error) throw error;
      
      // Get the other participant's profile info separately
      const otherParticipantId = 
        data.participant_1 === currentUser.id ? data.participant_2 : data.participant_1;
        
      const { data: otherParticipant, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, job_title, is_online')
        .eq('id', otherParticipantId)
        .single();
        
      if (error) throw error;
      
      // Format the conversation for display
      if (profileError) {
        console.error('Error fetching participant profile:', profileError);
      }
          
      // Create conversation entry even with limited data
      const newConversation = {
        id: data.id,
        name: otherParticipant?.full_name || 'Unknown User',
        avatar: otherParticipant?.avatar_url || null,
        lastMessageAt: data.last_message_at,
        participantId: otherParticipantId,
        isOnline: otherParticipant?.is_online || false
      };
      
      // Add to conversations state
      setConversations(prevConversations => [newConversation, ...prevConversations]);
      
    } catch (err) {
      console.error('Error handling new conversation:', err);
    }
  };

  const handleConversationUpdate = async (payload) => {
    try {
      // Update the conversation in the state
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === payload.new.id 
            ? { ...conv, lastMessageAt: payload.new.last_message_at } 
            : conv
        ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      );
      
    } catch (err) {
      console.error('Error handling conversation update:', err);
    }
  };

  const handleSelectConversation = (conversationId) => {
    setSelectedConversation(conversationId);
  };

  const handleCreateConversation = async (userId) => {
    try {
      setLoading(true);
      
      if (!currentUser) {
        toast.error('You need to be logged in to start a conversation');
        return;
      }
      
      // Try using RPC function first but be prepared for it to fail
      let conversationId, error;
      try {
        const result = await supabase.rpc('get_or_create_conversation', {
          user1_id: currentUser.id,
          user2_id: userId
        });
        conversationId = result.data;
        error = result.error;
        
        if (error) {
          console.error('RPC function failed:', error);
        }
      } catch (rpcError) {
        console.error('RPC function exception:', rpcError);
        error = rpcError; // Set error to trigger fallback
      }
      
      if (error) {
        // Fallback to manual check and create
        // Check if a conversation already exists
        const { data: existingConv, error: checkError } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participant_1.eq.${currentUser.id},participant_2.eq.${userId}),and(participant_1.eq.${userId},participant_2.eq.${currentUser.id})`)
          .maybeSingle();
          
        if (checkError) throw checkError;
        
        // If conversation exists, select it
        if (existingConv) {
          setSelectedConversation(existingConv.id);
          return;
        }
        
        // Create a new conversation
        const { data, error: insertError } = await supabase
          .from('conversations')
          .insert([
            { 
              participant_1: currentUser.id, 
              participant_2: userId,
              last_message_at: new Date().toISOString()
            }
          ])
          .select()
          .single();
          
        if (insertError) throw insertError;
        
        // Select the new conversation
        setSelectedConversation(data.id);
        toast.success('New conversation started');
        
        // Update the conversations list
        fetchUserConversations();
      } else {
        // If we got a conversation ID from the RPC function, use it
        setSelectedConversation(conversationId);
        toast.success('Conversation opened');
        
        // Make sure the conversation is in our list
        fetchUserConversations();
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      toast.error('Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-6 max-w-sm mx-auto bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-3 text-lg font-medium text-gray-900">Error</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <button 
            className="mt-4 btn-ocean"
            onClick={() => window.location.reload()}
          >
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
