import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../utils/supabase';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  FaceSmileIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import { format } from 'date-fns';

const ChatWindow = ({ conversationId, currentUser, onCreateConversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [otherParticipant, setOtherParticipant] = useState(null);
  const [fileAttachment, setFileAttachment] = useState(null);
  const [isConnected, setIsConnected] = useState(true); // Added connection status state
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages when conversation id changes
  useEffect(() => {
    if (!conversationId || !currentUser) return;
    
    setMessages([]);
    setLoading(true);
    
    const fetchMessagesAndParticipants = async () => {
      try {
        // First fetch the conversation to get participants
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select(`
            participant_1:profiles!conversations_participant_1_fkey(id, full_name, avatar_url, job_title, is_online),
            participant_2:profiles!conversations_participant_2_fkey(id, full_name, avatar_url, job_title, is_online)
          `)
          .eq('id', conversationId)
          .single();
          
        if (convError) {
          console.error('Error fetching conversation:', convError);
          toast.error('Failed to load conversation details');
          setLoading(false);
          return;
        }
        
        // Determine which participant is not the current user
        const other = 
          conversation.participant_1.id === currentUser.id 
            ? conversation.participant_2 
            : conversation.participant_1;
            
        setOtherParticipant(other);
        
        // Check if a connection exists with status = 'accepted'
        const { data: connection, error: connectionError } = await supabase
          .from('connections')
          .select('status')
          .or(`requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
          .eq('recipient_id', other.id)
          .eq('status', 'accepted')
          .maybeSingle();
        
        if (connectionError) {
          console.error('Error checking connection:', connectionError);
        }
        
        // Update connection status
        setIsConnected(connection && connection.status === 'accepted');
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
          
        if (messagesError) {
          console.error('Error fetching messages:', messagesError);
          toast.error('Failed to load messages');
          setLoading(false);
          return;
        }
        
        setMessages(messagesData || []);
        
        // Mark messages as read using our new function
        try {
          const { error: rpcError } = await supabase.rpc('mark_conversation_as_read', {
            p_conversation_id: conversationId,
            p_user_id: currentUser.id
          });
          
          if (rpcError) {
            throw rpcError;
          }
        } catch (markError) {
          console.error('Error marking messages as read:', markError);
          
          // Fallback: Manually mark messages as read
          const unreadMessages = messagesData.filter(
            msg => msg.sender_id !== currentUser.id && msg.read_at === null
          );
          
          console.log(`Manually marking ${unreadMessages.length} messages as read`);
          
          if (unreadMessages.length > 0) {
            const now = new Date().toISOString();
            await Promise.all(unreadMessages.map(msg => 
              supabase
                .from('messages')
                .update({ read_at: now })
                .eq('id', msg.id)
            ));
          }
        }
      } catch (err) {
        console.error('Error in message fetching process:', err);
        toast.error('Failed to load conversation');
      } finally {
        setLoading(false);
      }
    };

    fetchMessagesAndParticipants();
    
    // Subscribe to new messages
    let messagesChannel;
    try {
      messagesChannel = supabase.channel(`messages-${conversationId}`);
      
      // Listen for new messages in this conversation
      messagesChannel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => handleNewMessage(payload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Successfully subscribed to messages for conversation ${conversationId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`Error subscribing to messages for conversation ${conversationId}`);
          // Set up a polling fallback if realtime fails
          setupPollingFallback();
        }
      });
    } catch (err) {
      console.error('Error setting up realtime subscription:', err);
      // Set up a polling fallback if realtime fails
      setupPollingFallback();
    }
    
    // Polling fallback for when WebSockets fail
    let pollingInterval = null;
    
    const setupPollingFallback = () => {
      // Poll every 5 seconds
      pollingInterval = setInterval(async () => {
        try {
          // Fetch the latest messages
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
            
          if (error) throw error;
          
          // If there are new messages we don't have, update the state
          if (data && data.length > messages.length) {
            setMessages(data);
          }
        } catch (err) {
          console.error('Error polling for messages:', err);
        }
      }, 5000);
    };
    
    console.log(`Setting up subscription for conversation ${conversationId}`);
      
    return () => {
      // Clean up realtime subscription
      if (messagesChannel) {
        supabase.removeChannel(messagesChannel);
      }
      
      // Clean up polling interval
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [conversationId, currentUser]);

  const handleNewMessage = (payload) => {
    const newMsg = payload.new;
    
    // Only add the message if it's not already in the messages array
    const messageExists = messages.some(msg => msg.id === newMsg.id);
    if (!messageExists) {
      setMessages(prev => [...prev, newMsg]);
      
      // If not sent by current user, mark as read
      if (newMsg.sender_id !== currentUser?.id) {
        // Add a small delay to ensure message is processed first
        setTimeout(() => {
          supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', newMsg.id)
            .then(({ error }) => {
              if (error) {
                console.error('Error marking message as read:', error);
                
                // If we hit an error with the direct update, try the RPC function as backup
                supabase.rpc('mark_conversation_as_read', {
                  p_conversation_id: conversationId,
                  p_user_id: currentUser.id
                }).then(({ error: rpcError }) => {
                  if (rpcError) {
                    console.error('RPC fallback also failed:', rpcError);
                  }
                });
              }
            });
        }, 300);
        // Note: Removed conflicting await statement from previous code
      }
    }
    
    // Scroll to the new message
    scrollToBottom();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !fileAttachment) || !currentUser || !conversationId) return;
    
    // Check if users are connected first
    if (!isConnected) {
      toast.error('You must connect with this user before sending messages.');
      return;
    }
    
    try {
      // Show loading indicator
      toast.loading('Sending message...');
      
      let attachmentUrl = null;
      
      // If there's a file attachment, upload it first
      if (fileAttachment) {
        try {
          const fileExt = fileAttachment.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `message_attachments/${conversationId}/${fileName}`;
          
          // Upload file
          const { error: uploadError } = await supabase.storage
            .from('message_attachments')
            .upload(filePath, fileAttachment);
            
          if (uploadError) {
            throw uploadError;
          }
          
          // Get public URL
          const { data } = supabase.storage
            .from('message_attachments')
            .getPublicUrl(filePath);
            
          attachmentUrl = data.publicUrl;
        } catch (uploadErr) {
          console.error('Error uploading attachment:', uploadErr);
          toast.error('Failed to upload attachment');
          return;
        }
      }
      
      // Determine message type
      const messageType = attachmentUrl ? 'file' : 'text';
      
      // Prepare message object
      const messageObject = {
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: newMessage.trim() || (attachmentUrl ? 'Sent an attachment' : ''),
        message_type: messageType,
        attachment_url: attachmentUrl,
      };
      
      // Send message
      const { data, error } = await supabase
        .from('messages')
        .insert([messageObject])
        .select()
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        // Check for permission errors (RLS blocking)
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          // Recheck connection status as it might have changed
          const { data: connection } = await supabase
            .from('connections')
            .select('status')
            .or(`requester_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
            .eq('recipient_id', otherParticipant.id)
            .eq('status', 'accepted')
            .maybeSingle();
          
          setIsConnected(connection && connection.status === 'accepted');
          toast.error('You are no longer connected with this user.');
        } else {
          throw error;
        }
        return;
      }
      
      // Clear form
      setNewMessage('');
      setFileAttachment(null);
      
      // Dismiss loading toast
      toast.dismiss();
      
    } catch (err) {
      console.error('Error sending message:', err);
      toast.dismiss();
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size exceeds 5MB limit');
        return;
      }
      setFileAttachment(file);
    }
  };

  const removeAttachment = () => {
    setFileAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No conversation selected</h3>
          <p className="text-gray-600">
            Choose a conversation from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header with recipient info */}
      {otherParticipant && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <div className="flex items-center space-x-3">
            {otherParticipant.avatar_url ? (
              <img 
                src={otherParticipant.avatar_url} 
                alt={otherParticipant.full_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-ocean-100 flex items-center justify-center">
                <span className="text-ocean-600 font-medium">
                  {otherParticipant.full_name?.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {otherParticipant.full_name}
              </h3>
              {(otherParticipant.job_title || otherParticipant.company) && (
                <p className="text-sm text-gray-500">
                  {[otherParticipant.job_title, otherParticipant.company]
                    .filter(Boolean)
                    .join(' at ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-ocean-500 mx-auto mb-3"></div>
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUser?.id}
                timestamp={formatMessageDate(message.created_at)}
                readStatus={message.sender_id === currentUser?.id && message.read_at !== null}
              />
            ))}
            <div ref={messagesEndRef} /> {/* Scroll anchor */}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Attachment preview */}
      {fileAttachment && (
        <div className="bg-gray-100 p-3 mx-4 mb-2 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <PaperClipIcon className="w-5 h-5 text-gray-500 mr-2" />
            <span className="text-sm truncate max-w-xs">
              {fileAttachment.name}
            </span>
          </div>
          <button 
            onClick={removeAttachment}
            className="text-gray-500 hover:text-red-500"
          >
            &times;
          </button>
        </div>
      )}

      {/* Connection Warning */}
      {!isConnected && conversationId && (
        <div className="p-2 bg-red-50 border-t border-red-200">
          <div className="flex items-center justify-center">
            <div className="text-red-500 text-sm font-medium">
              You are no longer connected with this user. You cannot send messages until you reconnect.
            </div>
          </div>
        </div>
      )}
      
      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && isConnected) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                className={`form-input w-full pr-20 py-3 rounded-lg resize-none ${!isConnected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                rows="1"
                placeholder={isConnected ? "Type a message..." : "Cannot send messages - connection removed"}
                disabled={!isConnected}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <PaperClipIcon className="w-5 h-5" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                </button>
                <button
                  type="button"
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <FaceSmileIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() && !fileAttachment}
            className="btn-ocean p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
