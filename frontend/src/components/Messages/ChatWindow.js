import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../utils/supabase';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
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

const ChatWindow = ({ thread, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const canSend = !!(thread && thread.can_send);

  useEffect(() => {
    if (!thread?.thread_id || !currentUser) return;

    const threadId = thread.thread_id;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch other participant profile (to get avatar, title)
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, job_title, company')
          .eq('id', thread.other_user_id)
          .single();
        if (!pErr) setOtherProfile(profile);

        // Fetch last 30 days messages in this thread
        const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const { data: msgs, error: mErr } = await supabase
          .from('dm_messages')
          .select('*')
          .eq('thread_id', threadId)
          .gte('created_at', sinceISO)
          .order('created_at', { ascending: true });
        if (mErr) throw mErr;
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (err) {
        console.error('Error loading thread:', err);
        toast.error('Failed to load messages.');
      } finally {
        setLoading(false);
      }
    };

    load();

    const channel = supabase
      .channel(`dm-messages-${threadId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          setMessages((prev) => {
            if (payload.eventType === 'INSERT') {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((m) => (m.id === payload.new.id ? payload.new : m));
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((m) => m.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log('dm-messages channel status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [thread?.thread_id, currentUser?.id]);

  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    if (isSending) return; // guard against double-dispatch
    if (!newMessage.trim() || !currentUser || !thread?.thread_id) return;
    
    // Check if users can send first (connection gate)
    if (!canSend) {
      toast.error('You must be connected to send messages.');
      return;
    }
    
    try {
      setIsSending(true);
      // Send message (text only) to dm_messages
      const { data, error } = await supabase
        .from('dm_messages')
        .insert([{ thread_id: thread.thread_id, sender_id: currentUser.id, body: newMessage.trim() }])
        .select()
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          toast.error('You are not allowed to send messages in this thread.');
          return;
        }
        throw error;
      }
      
      // Optimistic append
      if (data) {
        setMessages((prev) => [...prev, data]);
      }
      
      // Clear form
      setNewMessage('');
      
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  if (!thread?.thread_id) {
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
      {otherProfile && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <div className="flex items-center space-x-3">
            <Avatar url={otherProfile.avatar_url} name={otherProfile.full_name} />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {otherProfile.full_name}
                <button
                  className="ml-3 text-sm text-ocean-600 hover:underline"
                  onClick={() => navigate(`/profile/${thread.other_user_id}`)}
                >
                  View profile
                </button>
              </h3>
              {(otherProfile.job_title || otherProfile.company) && (
                <p className="text-sm text-gray-500">
                  {[otherProfile.job_title, otherProfile.company]
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
                message={{ ...message, content: message.content ?? message.body }}
                isOwn={message.sender_id === currentUser?.id}
                timestamp={formatMessageDate(message.created_at)}
                readStatus={false}
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

      {/* Connection Warning */}
      {!canSend && thread?.thread_id && (
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
                  if (e.key === 'Enter' && !e.shiftKey && canSend) {
                    e.preventDefault();
                    if (!isSending) handleSendMessage(e);
                  }
                }}
                className={`form-input w-full py-3 rounded-lg resize-none ${!canSend ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                rows="1"
                placeholder={canSend ? "Type a message..." : "Cannot send messages - connection removed"}
                disabled={!canSend}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
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
