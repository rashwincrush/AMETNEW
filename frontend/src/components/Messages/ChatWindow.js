import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../../utils/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import { idempotentConnect, getLatestEdge, acceptPending, declinePending, cancelPending } from '../../utils/connections';
import { 
  PaperAirplaneIcon, 
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

const ChatWindow = ({ thread, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Context from query string (job/event)
  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const ctxJobId = qs.get('job');
  const ctxEventId = qs.get('event');

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const canSend = !!(thread && thread.can_send);
  const [edge, setEdge] = useState(null);
  const [localAccepted, setLocalAccepted] = useState(false);
  const canSendDerived = canSend || localAccepted || (edge && (edge.status === 'accepted' || edge.status === 'connected'));

  useEffect(() => {
    if (!thread?.thread_id || !currentUser) return;

    const threadId = thread.thread_id;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch other participant identity from public view (no PII)
        const { data: pub, error: pErr } = await supabase
          .from('alumni_directory_public')
          .select('id, full_name, avatar_url, current_job_title, company_name, location_city, location_country')
          .eq('id', thread.other_user_id)
          .maybeSingle();
        if (!pErr && pub) {
          setOtherProfile({
            id: pub.id,
            full_name: pub.full_name,
            avatar_url: pub.avatar_url,
            job_title: pub.current_job_title,
            company: pub.company_name,
            location: [pub.location_city, pub.location_country].filter(Boolean).join(', ')
          });
        }

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
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to remove dm-messages channel', e);
      }
    };
  }, [thread?.thread_id, currentUser?.id]);

  // Load current connection edge between users and subscribe to changes
  useEffect(() => {
    let unsub = null;
    const loadEdge = async () => {
      if (!currentUser?.id || !thread?.other_user_id) return;
      try {
        const e = await getLatestEdge(currentUser.id, thread.other_user_id);
        setEdge(e);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load connection edge', err);
      }
    };
    loadEdge();

    // Realtime subscribe to connections affecting this pair
    try {
      const channel = supabase
        .channel(`conn-${currentUser?.id}-${thread?.other_user_id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'connections' }, (payload) => {
          const r = payload.new || payload.old;
          if (!r) return;
          const involvesPair = (
            (r.requester_id === currentUser?.id && r.recipient_id === thread?.other_user_id) ||
            (r.recipient_id === currentUser?.id && r.requester_id === thread?.other_user_id)
          );
          if (involvesPair) {
            getLatestEdge(currentUser.id, thread.other_user_id).then(setEdge).catch(()=>{});
          }
        })
        .subscribe();
      unsub = () => { 
        try { 
          supabase.removeChannel(channel); 
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to remove connection channel', e);
        } 
      };
    } catch(e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to subscribe connection channel', e);
    }

    return () => { if (unsub) unsub(); };
  }, [currentUser?.id, thread?.other_user_id]);

  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    if (isSending) return; // guard against double-dispatch
    if (!newMessage.trim() || !currentUser || !thread?.thread_id) return;
    
    // Check if users can send first (connection gate)
    if (!canSendDerived) {
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
              {/* Context chips */}
              {(ctxJobId || ctxEventId) && (
                <div className="mt-1 flex items-center gap-2">
                  {ctxJobId && (
                    <button onClick={() => navigate(`/jobs/${ctxJobId}`)} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs border border-blue-200">Job: {ctxJobId}</button>
                  )}
                  {ctxEventId && (
                    <button onClick={() => navigate(`/events/${ctxEventId}`)} className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs border border-green-200">Event: {ctxEventId}</button>
                  )}
                </div>
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

      {/* Connection banners */}
      {!canSendDerived && thread?.thread_id && (
        <div className="p-2 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center justify-between px-2">
            {edge?.status === 'pending' && edge.recipient_id === currentUser?.id ? (
              <>
                <div className="text-yellow-800 text-sm font-medium">This user requested to connect.</div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 text-xs rounded bg-green-600 text-white"
                    onClick={async () => {
                      try {
                        await acceptPending(currentUser.id, thread.other_user_id);
                        setLocalAccepted(true);
                        toast.success('Connection accepted');
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >Accept</button>
                  <button
                    className="px-2 py-1 text-xs rounded bg-red-600 text-white"
                    onClick={async () => {
                      try {
                        await declinePending(currentUser.id, thread.other_user_id);
                        toast('Request rejected');
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                  >Reject</button>
                </div>
              </>
            ) : edge?.status === 'pending' && edge.requester_id === currentUser?.id ? (
              <>
                <div className="text-yellow-800 text-sm font-medium">Pending approval.</div>
                <button
                  className="text-yellow-900 text-sm underline"
                  onClick={async () => {
                    try {
                      await cancelPending(currentUser.id, thread.other_user_id);
                      toast('Request canceled');
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                >Cancel</button>
              </>
            ) : (
              <>
                <div className="text-yellow-800 text-sm font-medium">Connection required to send messages.</div>
                <button
                  className="text-yellow-900 text-sm underline"
                  onClick={async () => {
                    try {
                      await idempotentConnect(currentUser.id, thread.other_user_id);
                      toast.success('Connection request sent');
                    } catch (e) {
                      console.error('Failed to send connection request:', e);
                    }
                  }}
                >Request Connection</button>
              </>
            )}
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
                  if (e.key === 'Enter' && !e.shiftKey && canSendDerived) {
                    e.preventDefault();
                    if (!isSending) handleSendMessage(e);
                  }
                }}
                className={`form-input w-full py-3 rounded-lg resize-none ${!canSendDerived ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                rows="1"
                placeholder={canSendDerived ? "Type a message..." : "Cannot send messages - connection required"}
                disabled={!canSendDerived}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || !canSendDerived}
            title={!canSendDerived ? 'Send a connection request to start messaging.' : ''}
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
