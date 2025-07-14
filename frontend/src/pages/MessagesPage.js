import React, { useState, useEffect, useCallback } from 'react';
import { PencilSquareIcon } from '@heroicons/react/24/solid';
import NewConversationModal from '../components/Messages/NewConversationModal';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

const ChatWindow = ({ conversationId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(id, full_name, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, async (payload) => {
        const { data: senderProfile, error } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', payload.new.sender_id).single();
        if (error) {
          console.error('Error fetching sender profile for new message:', error);
          setMessages(currentMessages => [...currentMessages, payload.new]);
        } else {
          const messageWithSender = { ...payload.new, sender: senderProfile };
          setMessages(currentMessages => [...currentMessages, messageWithSender]);
        }
      })
      .subscribe();

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    
    // Store the message text before clearing the input
    const messageText = newMessage.trim();
    
    // Clear the input immediately for better UX
    setNewMessage('');
    
    // Create a temporary message object with a temporary ID
    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: messageText,
      created_at: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || 'You',
        avatar_url: currentUser.user_metadata?.avatar_url
      }
    };
    
    // Add the message to the UI immediately (optimistic update)
    setMessages(currentMessages => [...currentMessages, tempMessage]);
    
    // Then send it to the database
    const { error } = await supabase
      .from('messages')
      .insert({ 
        conversation_id: conversationId, 
        sender_id: currentUser.id, 
        content: messageText
      });

    if (error) {
      console.error('Error sending message:', error);
      // Remove the temporary message if there was an error
      setMessages(currentMessages => 
        currentMessages.filter(msg => msg.id !== tempMessage.id)
      );
      // Re-add the message text to the input
      setNewMessage(messageText);
      alert('Failed to send message. Please try again.');
    }
  };

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-700">Select a conversation</h3>
          <p className="text-gray-500">Choose a chat from the left to start messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-800">Chat</h3>
      </div>
      <div className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
        {loading ? (
          <p>Loading messages...</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
              {msg.sender_id !== currentUser.id && (
                <img src={msg.sender.avatar_url || `https://ui-avatars.com/api/?name=${msg.sender.full_name}`} alt={msg.sender.full_name} className="h-8 w-8 rounded-full object-cover" />
              )}
              <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${msg.sender_id === currentUser.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                <p>{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <input 
            type="text" 
            placeholder="Type a message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Send</button>
        </form>
      </div>
    </div>
  );
};

const ConversationList = ({ conversations, onSelectConversation, selectedConversationId, onNewConversation }) => (
  <div className="h-full flex flex-col bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-800">Chats</h2>
      <button onClick={onNewConversation} className="p-1 text-indigo-600 rounded-full hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" title="New Message">
        <PencilSquareIcon className="h-6 w-6" />
      </button>
    </div>
    <ul className="overflow-y-auto flex-grow">
      {conversations.length === 0 && (
        <p className="p-4 text-sm text-gray-500">No conversations yet.</p>
      )}
      {conversations.map(conv => (
        <li key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 ${
              selectedConversationId === conv.id ? 'bg-indigo-50' : ''
            }`}>
          <div className="flex-shrink-0 mr-3">
            <img className="h-10 w-10 rounded-full object-cover" src={conv.participants[0]?.avatar_url || `https://ui-avatars.com/api/?name=${conv.participants.map(p => p.full_name).join('+')}&background=random`} alt="avatar" />
          </div>
          <div className="flex-grow overflow-hidden">
            <p className="font-semibold text-gray-800 truncate">{conv.participants.map(p => p.full_name).join(', ') || 'Unknown User'}</p>
            <p className="text-sm text-gray-500 truncate">{conv.last_message || 'No messages yet'}</p>
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc('get_user_conversations_v2', { p_user_id: user.id });
      if (error) throw error;

      const formattedConversations = data.map(conv => ({
        id: conv.conversation_id,
        participants: [{
          id: conv.participant_id,
          full_name: conv.participant_name,
          avatar_url: conv.participant_avatar,
        }],
        last_message: conv.unread_count > 0 ? `${conv.unread_count} unread message(s)` : 'No new messages',
        last_updated: conv.last_message_at,
        unread_count: conv.unread_count,
      }));
      setConversations(formattedConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    fetchConversations();

    // Set up a real-time subscription to refetch conversations on new messages
    const subscription = supabase
      .channel('public:messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchConversations]);

  const handleConversationStarted = (conversationId) => {
    fetchConversations().then(() => {
        setSelectedConversationId(conversationId);
    });
    setIsNewConversationModalOpen(false);
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
  }

  return (
    <>
    <div className="h-screen grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      <div className="md:col-span-1 lg:col-span-1">
        <ConversationList 
          conversations={conversations} 
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
          onNewConversation={() => setIsNewConversationModalOpen(true)}
        />
      </div>
      <div className="hidden md:block md:col-span-2 lg:col-span-3">
        <ChatWindow conversationId={selectedConversationId} currentUser={user} />
      </div>
    </div>
    <NewConversationModal 
      isOpen={isNewConversationModalOpen}
      onClose={() => setIsNewConversationModalOpen(false)}
      onConversationStarted={handleConversationStarted}
    />
  </>
  );
};

export default MessagesPage;
