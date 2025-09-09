import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase, onPostgresChangesOnce } from '../../utils/supabase';
import { 
  PaperAirplaneIcon, 
  PaperClipIcon, 
  FaceSmileIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import { format } from 'date-fns';

// Cache failed avatar URLs to prevent retry storms (e.g., 429 from external hosts)
const failedAvatarCache = new Set();

const Avatar = ({ url, name }) => {
  const [failed, setFailed] = useState(() => (url ? failedAvatarCache.has(url) : true));
  const initial = useMemo(() => (name ? name.charAt(0).toUpperCase() : '?'), [name]);
  if (!url || failed) {
    return (
      <div className="h-10 w-10 rounded-full bg-ocean-100 flex items-center justify-center">
        <span className="text-ocean-600 font-medium">{initial}</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={name || 'avatar'}
      className="h-10 w-10 rounded-full object-cover"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      width={40}
      height={40}
      onError={() => { if (url) failedAvatarCache.add(url); setFailed(true); }}
    />
  );
};

const ChatWindow = ({ conversationId, currentUser, onCreateConversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
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

  const handleNewMessage = React.useCallback((payload) => {
    const newMsg = payload.new;
    setMessages(prev => {
      if (prev.some(msg => msg.id === newMsg.id)) {
        return prev;
      }
      return [...prev, newMsg];
    });

    if (newMsg.sender_id !== currentUser?.id) {
      setTimeout(() => {
        supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', newMsg.id)
          .then(({ error }) => {
            if (error) console.error('Error marking message as read:', error);
          });
      }, 300);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const fetchAndSubscribe = async () => {
      setLoading(true);
      try {
        // Fetch the other participant via the join table
        const { data: otherRow, error: otherErr } = await supabase
          .from('conversation_participants')
          .select('user_id, user:profiles(id, full_name, avatar_url, job_title, is_online)')
          .eq('conversation_id', conversationId)
          .neq('user_id', currentUser.id)
          .maybeSingle();

        if (otherErr) throw otherErr;

        const other = otherRow?.user || null;
        setOtherParticipant(other);

        const { data: connection } = await supabase
          .from('connections')
          .select('status')
          .or(
            `and(requester_id.eq.${currentUser.id},recipient_id.eq.${other?.id}),and(requester_id.eq.${other?.id},recipient_id.eq.${currentUser.id})`
          )
          .eq('status', 'accepted')
          .maybeSingle();
        setIsConnected(connection && connection.status === 'accepted');

        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData || []);

        try {
          await supabase.rpc('mark_conversation_as_read', { p_conversation_id: conversationId, p_user_id: currentUser.id });
        } catch (rpcErr) {
          // Fallback if RPC doesn't exist: mark messages as read manually
          await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('conversation_id', conversationId)
            .neq('sender_id', currentUser.id)
            .is('read_at', null);
        }

      } catch (err) {
        console.error('Error loading conversation:', err);
        toast.error('Failed to load conversation.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndSubscribe();

    const channelName = `messages-conv-${conversationId}`;
    onPostgresChangesOnce(
      channelName,
      'messages-insert-listener',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      },
      handleNewMessage
    );

    return () => {
      // Cleanup is handled by the utility, which will remove the listener
      // when the component unmounts or dependencies change.
    };
  }, [conversationId, currentUser, handleNewMessage]);

  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    if (isSending) return; // guard against double-dispatch
    if ((!newMessage.trim() && !fileAttachment) || !currentUser || !conversationId) return;
    
    // Check if users are connected first
    if (!isConnected) {
      toast.error('You must connect with this user before sending messages.');
      return;
    }
    
    try {
      setIsSending(true);
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
      const messageUuid = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const messageObject = {
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: newMessage.trim() || (attachmentUrl ? 'Sent an attachment' : ''),
        message_type: messageType,
        attachment_url: attachmentUrl,
        client_uuid: messageUuid,
      };
      
      // Send message
      const { data, error } = await supabase
        .from('messages')
        .insert([messageObject])
        .select()
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        // Unique violation (idempotent retry) — treat as success
        if (error.code === '23505' || /duplicate key value/.test(error.message || '')) {
          // noop — message will arrive via realtime listener
        } else if (error.code === '42501' || error.message?.includes('permission denied')) {
          // Check for permission errors (RLS blocking)
          // Recheck connection status as it might have changed
          const { data: connection } = await supabase
            .from('connections')
            .select('status')
            .or(
              `and(requester_id.eq.${currentUser.id},recipient_id.eq.${otherParticipant?.id}),and(requester_id.eq.${otherParticipant?.id},recipient_id.eq.${currentUser.id})`
            )
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
    } finally {
      setIsSending(false);
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
      <div className="flex-1 flex items-center justify-center bg-white">
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
    <div className="flex-1 flex flex-col bg-white">
      {/* Header with recipient info */}
      {otherParticipant && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <div className="flex items-center space-x-3">
            <Avatar url={otherParticipant.avatar_url} name={otherParticipant.full_name} />
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

      {/* Messages (no inner scrollbar) */}
      <div className="flex-1 p-4 space-y-4">
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
        <form onSubmit={(e) => { e.preventDefault(); if (!isSending) handleSendMessage(e); }} className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && isConnected) {
                    e.preventDefault();
                    if (!isSending) handleSendMessage(e);
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
