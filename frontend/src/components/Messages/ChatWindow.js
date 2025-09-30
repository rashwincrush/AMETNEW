import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase, createThread, onPostgresChangesOnce, checkConnectionStatus } from '../../utils/supabase';
import { useLocation, useNavigate } from 'react-router-dom';
import { idempotentConnect, getLatestEdge, acceptPending, declinePending, cancelPending } from '../../utils/connections';
import { 
  PaperAirplaneIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import { format } from 'date-fns';
import { getDisconnectCooldown, setDisconnectCooldown, clearDisconnectCooldown, formatCooldownTime } from '../../utils/ui';
import AvatarComponent from '../common/Avatar';

const ChatWindow = ({ thread, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [otherProfile, setOtherProfile] = useState(null);
  const [activeThread, setActiveThread] = useState(thread || null);
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

  const canSend = !!(activeThread && activeThread.can_send);
  const [edge, setEdge] = useState(null);
  const [localAccepted, setLocalAccepted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState(null);
  const [cooldownTimer, setCooldownTimer] = useState(null);
  const sendingMessageRef = useRef(false);
  const canSendDerived = (canSend || localAccepted || (edge && (edge.status === 'accepted' || edge.status === 'connected'))) && isConnected;

  // Keep local activeThread in sync and ensure dm_threads exists
  useEffect(() => {
    let cancelled = false;
    const ensureThread = async () => {
      try {
        if (!currentUser) return;
        if (!thread) { setActiveThread(null); return; }
        // If we have a thread_id, validate it exists in dm_threads
        if (thread.thread_id) {
          const { data: th } = await supabase
            .from('dm_threads')
            .select('id')
            .eq('id', thread.thread_id)
            .maybeSingle();
          if (th) { if (!cancelled) setActiveThread(thread); return; }
        }
        // If missing or invalid thread_id but we have other_user_id, try to create/resolve
        if (thread.other_user_id) {
          try { await createThread(currentUser.id, thread.other_user_id); } catch(_) { void 0; }
          const { data: resolved } = await supabase
            .from('v_my_dm_threads')
            .select('*')
            .eq('other_user_id', thread.other_user_id)
            .maybeSingle();
          if (!cancelled) setActiveThread(resolved || { other_user_id: thread.other_user_id });
        } else {
          if (!cancelled) setActiveThread(thread);
        }
      } catch (_) {
        if (!cancelled) setActiveThread(thread);
      }
    };
    ensureThread();
    return () => { cancelled = true; };
  }, [thread?.thread_id, thread?.other_user_id, currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;

    // If we have a thread id, load messages and subscribe
    if (activeThread?.thread_id) {
      const threadId = activeThread.thread_id;
      const load = async () => {
        setLoading(true);
        try {
          const { data: pub } = await supabase
            .from('alumni_directory_public')
            .select('id, full_name, avatar_url, current_job_title, company_name, location_city, location_country')
            .eq('id', activeThread.other_user_id)
            .maybeSingle();
          if (pub) {
            setOtherProfile({
              id: pub.id,
              full_name: pub.full_name,
              avatar_url: pub.avatar_url,
              job_title: pub.current_job_title,
              company: pub.company_name,
              location: [pub.location_city, pub.location_country].filter(Boolean).join(', ')
            });
          }

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

      // Attach realtime listener idempotently via registry to avoid double subscribe in Strict Mode
      onPostgresChangesOnce(
        `dm-messages-${threadId}`,
        `dm-messages-handler-${threadId}`,
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
      );

      // No explicit cleanup needed; registry manages single subscribe
      return undefined;
    }

    // If deep-linked with only other_user_id, load that user's public profile for header
    if (activeThread?.other_user_id && !activeThread?.thread_id) {
      (async () => {
        try {
          const { data: pub } = await supabase
            .from('alumni_directory_public')
            .select('id, full_name, avatar_url, current_job_title, company_name, location_city, location_country')
            .eq('id', activeThread.other_user_id)
            .maybeSingle();
          if (pub) {
            setOtherProfile({
              id: pub.id,
              full_name: pub.full_name,
              avatar_url: pub.avatar_url,
              job_title: pub.current_job_title,
              company: pub.company_name,
              location: [pub.location_city, pub.location_country].filter(Boolean).join(', ')
            });
          }
        } catch (_) {
          // benign: ignore if profile fetch fails
        }
      })();
    }
  }, [activeThread?.thread_id, activeThread?.other_user_id, currentUser?.id]);

  // Check connection status using centralized utility
  const checkConnection = useCallback(async () => {
    if (!currentUser?.id || !activeThread?.other_user_id) {
      setIsConnected(false);
      return;
    }
    setCheckingConnection(true);
    try {
      const connected = await checkConnectionStatus(currentUser.id, activeThread.other_user_id);
      setIsConnected(connected);
      
      // If disconnected, check for cooldown
      if (!connected) {
        const cooldown = getDisconnectCooldown(activeThread.other_user_id);
        setCooldownEnd(cooldown);
      } else {
        // If reconnected, clear cooldown
        clearDisconnectCooldown(activeThread.other_user_id);
        setCooldownEnd(null);
      }
    } catch (err) {
      console.warn('Failed to check connection status', err);
      setIsConnected(false);
    } finally {
      setCheckingConnection(false);
    }
  }, [currentUser?.id, activeThread?.other_user_id]);

  // Load current connection edge between users and subscribe to changes
  useEffect(() => {
    let unsub = null;
    const loadEdge = async () => {
      if (!currentUser?.id || !activeThread?.other_user_id) return;
      try {
        const e = await getLatestEdge(currentUser.id, activeThread.other_user_id);
        setEdge(e);
        // Also check connection status
        await checkConnection();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load connection edge', err);
      }
    };
    loadEdge();

    // Realtime subscribe to connections affecting this pair (idempotent)
    try {
      onPostgresChangesOnce(
        `conn-${currentUser?.id}-${activeThread?.other_user_id}`,
        `conn-handler-${currentUser?.id}-${activeThread?.other_user_id}`,
        { event: '*', schema: 'public', table: 'connections' },
        (payload) => {
          const r = payload.new || payload.old;
          if (!r) return;
          const involvesPair = (
            (r.requester_id === currentUser?.id && r.recipient_id === activeThread?.other_user_id) ||
            (r.recipient_id === currentUser?.id && r.requester_id === activeThread?.other_user_id)
          );
          if (involvesPair) {
            getLatestEdge(currentUser.id, activeThread.other_user_id).then(setEdge).catch(()=>{});
            checkConnection();
          }
        }
      );
    } catch(e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to subscribe connection channel', e);
    }

    return () => { /* no-op cleanup; registry manages channels */ };
  }, [currentUser?.id, activeThread?.other_user_id, checkConnection]);

  const handleSendMessage = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    
    if (isSending || sendingMessageRef.current) return; // guard against double-dispatch
    if (!newMessage.trim() || !currentUser || !activeThread?.thread_id) return;
    
    // Check if users can send first (connection gate)
    if (!canSendDerived) {
      toast.error('You must be connected to send messages.');
      return;
    }
    
    try {
      setIsSending(true);
      sendingMessageRef.current = true;
      
      // Send message (text only) to dm_messages
      const { data, error } = await supabase
        .from('dm_messages')
        .insert([{ thread_id: activeThread.thread_id, sender_id: currentUser.id, body: newMessage.trim() }])
        .select()
        .single();
        
      if (error) {
        console.error('Error sending message:', error);
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          toast.error('You are not allowed to send messages in this thread.');
          return;
        }
        // Check if disconnected during send
        const stillConnected = await checkConnectionStatus(currentUser.id, activeThread.other_user_id);
        if (!stillConnected) {
          toast.error('Message could not be sent — connection removed');
          await checkConnection();
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
      sendingMessageRef.current = false;
    }
  };

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  // Cooldown timer effect
  useEffect(() => {
    if (!cooldownEnd) {
      setCooldownTimer(null);
      return;
    }
    
    const updateTimer = () => {
      const now = Date.now();
      if (now >= cooldownEnd) {
        setCooldownEnd(null);
        setCooldownTimer(null);
        clearDisconnectCooldown(activeThread?.other_user_id);
      } else {
        setCooldownTimer(formatCooldownTime(cooldownEnd));
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [cooldownEnd, activeThread?.other_user_id]);

  const handleReconnect = async () => {
    if (!currentUser?.id || !activeThread?.other_user_id || isReconnecting || cooldownEnd) return;
    setIsReconnecting(true);
    try {
      await idempotentConnect(currentUser.id, activeThread.other_user_id);
      toast.success('Connection request sent');
      // Recheck connection status and refetch in parallel
      await Promise.all([
        checkConnection(),
        // Refetch thread to get updated can_send
        (async () => {
          const { data: updated } = await supabase
            .from('v_my_dm_threads')
            .select('*')
            .eq('other_user_id', activeThread.other_user_id)
            .maybeSingle();
          if (updated) setActiveThread(updated);
        })()
      ]);
    } catch (err) {
      console.error('Failed to reconnect:', err);
      toast.error('Failed to send connection request');
    } finally {
      setIsReconnecting(false);
    }
  };

  if (!activeThread?.thread_id && activeThread?.other_user_id) {
    // Show header for the selected peer even if the DM thread is not created yet
    return (
      <div className="flex-1 flex flex-col bg-white">
        {otherProfile && (
          <div className="bg-white border-b border-gray-200 p-4 flex items-center">
            <div className="flex items-center space-x-3">
              <AvatarComponent src={otherProfile.avatar_url} alt={otherProfile.full_name} size={40} />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{otherProfile.full_name}</h3>
                {(otherProfile.job_title || otherProfile.company) && (
                  <p className="text-sm text-gray-500">
                    {[otherProfile.job_title, otherProfile.company].filter(Boolean).join(' at ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty messages area */}
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">No conversation yet. The thread will appear once a connection is established.</p>
          </div>
        </div>

        {/* Connection banner without thread */}
        {!canSendDerived && (
          <div className="p-2 bg-yellow-50 border-t border-yellow-200">
            <div className="px-2 text-yellow-800 text-sm font-medium">Connection required to send messages.</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header with recipient info */}
      {otherProfile && (
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <div className="flex items-center space-x-3">
            <AvatarComponent src={otherProfile.avatar_url} alt={otherProfile.full_name} size={40} />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {otherProfile.full_name}
                <button
                  className="ml-3 text-sm text-ocean-600 hover:underline"
                  onClick={() => {
                    if (activeThread.other_user_role === 'employer') {
                      navigate(`/companies/${activeThread.other_user_id}`);
                    } else {
                      navigate(`/profile/${activeThread.other_user_id}`);
                    }
                  }}
                >
                  {activeThread.other_user_role === 'employer' ? 'View Company' : 'View Profile'}
                </button>
              </h3>
              {activeThread.other_user_role === 'employer' ? (
                <p className="text-sm text-gray-500">
                  {activeThread.other_user_company || otherProfile.company || 'Company'}
                </p>
              ) : (
                (otherProfile.job_title || otherProfile.company) && (
                  <p className="text-sm text-gray-500">
                    {[otherProfile.job_title, otherProfile.company]
                      .filter(Boolean)
                      .join(' at ')}
                  </p>
                )
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
      {!canSendDerived && activeThread?.thread_id && (
        <div 
          className="p-3 bg-yellow-50 border-t border-yellow-200"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 px-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1">
              {edge?.status === 'pending' && edge.recipient_id === currentUser?.id ? (
                <div className="flex items-center justify-between">
                  <div className="text-yellow-800 text-sm font-medium">This user requested to connect.</div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                      onClick={async () => {
                        try {
                          await acceptPending(currentUser.id, activeThread.other_user_id);
                          setLocalAccepted(true);
                          await checkConnection();
                          toast.success('Connection accepted');
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      aria-label="Accept connection request"
                    >Accept</button>
                    <button
                      className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                      onClick={async () => {
                        try {
                          await declinePending(currentUser.id, activeThread.other_user_id);
                          toast('Request rejected');
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      aria-label="Reject connection request"
                    >Reject</button>
                  </div>
                </div>
              ) : edge?.status === 'pending' && edge.requester_id === currentUser?.id ? (
                <div className="flex items-center justify-between">
                  <div className="text-yellow-800 text-sm font-medium">Connection request pending approval.</div>
                  <button
                    className="px-3 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    onClick={async () => {
                      try {
                        await cancelPending(currentUser.id, activeThread.other_user_id);
                        await checkConnection();
                        toast('Request canceled');
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    aria-label="Cancel connection request"
                  >Cancel Request</button>
                </div>
              ) : edge?.status === 'removed' || edge?.status === 'declined' || !isConnected ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-yellow-800 text-sm font-medium">You are disconnected from this user.</div>
                    <div className="text-yellow-700 text-xs mt-0.5">Message history is read-only. Reconnect to continue messaging.</div>
                  </div>
                  <button
                    className="px-3 py-1.5 text-sm rounded bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleReconnect}
                    disabled={isReconnecting || !!cooldownEnd}
                    aria-label={cooldownEnd ? `Reconnect available in ${cooldownTimer}` : 'Reconnect with this user'}
                    title={cooldownEnd ? `You can reconnect in ${cooldownTimer}` : ''}
                  >
                    <UserPlusIcon className="w-4 h-4" aria-hidden="true" />
                    {isReconnecting ? 'Sending...' : cooldownEnd ? `Wait ${cooldownTimer}` : 'Reconnect'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="text-yellow-800 text-sm font-medium">Connection required to send messages.</div>
                  <button
                    className="px-3 py-1.5 text-sm rounded bg-ocean-600 text-white hover:bg-ocean-700 flex items-center gap-1.5"
                    onClick={handleReconnect}
                    aria-label="Request connection"
                  >
                    <UserPlusIcon className="w-4 h-4" aria-hidden="true" />
                    Request Connection
                  </button>
                </div>
              )}
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
