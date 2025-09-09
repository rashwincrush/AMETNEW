import { createClient } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, useEffect } from 'react';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
  throw new Error('Missing Supabase environment variables');
}

// Create the client with realtime configuration as a singleton to guard against HMR/rehydration
export const supabase = (() => {
  // guard against HMR/rehydration multipliers
  if (window.__sb__) return window.__sb__;
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 5
      },
    }
  });
  
  // Store the client as a singleton
  window.__sb__ = client;
  
  return client;
})();

// Log current configuration to help with debugging
console.log('Supabase client initialized with:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'undefined',  // Only log partial URL for security
  key: supabaseKey ? 'defined' : 'undefined',
  autoRefreshToken: true,
  persistSession: true,
});

// --- REALTIME CONTEXT AND PROVIDER ---

// Realtime context for system status
export const RealtimeContext = createContext({
  supabase,
  isReady: false,
});

// Global channel registry to manage channels across component remounts
// Persist on window to survive Strict Mode double-mounts and Fast Refresh
const _channelRegistry = (() => {
  if (typeof window !== 'undefined') {
    if (!window.__sb_channels__) {
      window.__sb_channels__ = {};
    }
    return window.__sb_channels__;
  }
  return {};
})();

/**
 * Get or create a channel from the registry.
 * This is idempotent and safe to call multiple times.
 */
export function getOrCreateChannel(name) {
  if (!_channelRegistry[name]) {
    console.log(`Creating new channel: ${name}`);
    _channelRegistry[name] = {
      channel: supabase.channel(name),
      // Whether the SUBSCRIBED status callback has fired
      subscribed: false,
      // Whether we have ever invoked channel.subscribe on this instance
      hasSubscribeCall: false,
      // Track attached listener keys to avoid duplicate .on bindings
      listeners: new Set(),
      refCount: 0
    };
  }
  
  _channelRegistry[name].refCount++;
  return _channelRegistry[name].channel;
}

/**
 * Ensures a channel is subscribed exactly once.
 * Safe to call multiple times; subsequent calls are no-ops.
 */
export function ensureChannelSubscribed(name) {
  const entry = _channelRegistry[name] || { hasSubscribeCall: false, subscribed: false };
  if (!entry.hasSubscribeCall) {
    const channel = getOrCreateChannel(name);
    console.log(`Subscribing to ${name}`);
    entry.hasSubscribeCall = true;
    _channelRegistry[name] = { ...entry, channel };
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime is ready');
        _channelRegistry[name].subscribed = true;
      }
    });
  }
  return _channelRegistry[name].channel;
}

/**
 * Idempotently attach a postgres_changes listener to a channel.
 * key should uniquely describe this listener (e.g., `${event}:${schema}:${table}:${filter}`).
 */
export function onPostgresChangesOnce(channelName, key, params, handler) {
  const channel = ensureChannelSubscribed(channelName);
  const entry = _channelRegistry[channelName];
  if (!entry.listeners) entry.listeners = new Set();
  if (entry.listeners.has(key)) {
    return channel;
  }
  entry.listeners.add(key);
  channel.on('postgres_changes', params, handler);
  return channel;
}

/**
 * A simplified RealtimeProvider that only handles core system status.
 * It's designed to be resilient to React Strict Mode double-invocation.
 */
export const RealtimeProvider = ({ children }) => {
  const [isReady, setReady] = useState(false);
  
  useEffect(() => {
    const channelName = 'system-status';
    const channel = ensureChannelSubscribed(channelName);
    
    if (_channelRegistry[channelName]?.subscribed) {
      setReady(true);
    }
    
    // Cleanup function - note we don't actually unsubscribe or remove the channel
    // We just decrement the reference count
    return () => {
      if (_channelRegistry[channelName]) {
        _channelRegistry[channelName].refCount--;
        
        // Only actually clean up if no components are using this channel
        if (_channelRegistry[channelName].refCount <= 0) {
          console.log(`No more refs to ${channelName}, cleaning up`);
          // We intentionally don't remove the subscription here
          // to prevent issues with React Strict Mode
        }
      }
    };
  }, [])

  return (
    <RealtimeContext.Provider value={{ supabase, isReady }}>
      {children}
    </RealtimeContext.Provider>
  );
};

export const setupRealtimeSubscription = (channelName, options = {}) => {
  const { allowFallback = false } = options;
  try {
    const channel = ensureChannelSubscribed(channelName);
    console.log(`Realtime subscription setup for channel: ${channelName}`);
    return channel;
  } catch (error) {
    console.error(`Failed to setup realtime subscription for ${channelName}:`, error);
    if (allowFallback) {
      console.warn(`Falling back to non-realtime mode for ${channelName}.`);
      return null;
    }
    throw error;
  }
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return { ...context, setupRealtimeSubscription };
};

/**
 * Checks if the realtime connection is established and ready.
 * @returns {Promise<void>} - A promise that resolves when the connection is ready
 */
export function checkRealtimeConnection() {
  return new Promise((resolve, reject) => {
    try {
      // If channel registry has system-status and it's subscribed, resolve immediately
      if (_channelRegistry['system-status']?.subscribed) {
        console.log('Realtime connection already confirmed ready');
        resolve();
        return;
      }
      
      // Otherwise set up the channel and wait for subscription
      const channel = ensureChannelSubscribed('system-status');
      
      // Set a reasonable timeout
      const timeout = setTimeout(() => {
        console.warn('Realtime connection check timed out after 5 seconds');
        // Resolve anyway to prevent blocking UI
        resolve();
      }, 5000);
      
      // Check for subscription status
      const checkInterval = setInterval(() => {
        if (_channelRegistry['system-status']?.subscribed) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          console.log('Realtime connection confirmed ready');
          resolve();
        }
      }, 100);
    } catch (error) {
      console.error('Error checking realtime connection:', error);
      reject(error);
    }
  });
}

// --- Jobs Channel Singleton --- 
let jobsChannel = null;
const jobsChangeListeners = new Map();

export function ensureJobsChannel(supabase) {
  if (jobsChannel && jobsChannel.state !== 'closed') return jobsChannel;
  
  jobsChannel = supabase
    .channel('job-listings')
    .on('postgres_changes', { schema: 'public', table: 'jobs', event: '*' }, payload => {
      // Dispatch to all registered listeners
      jobsChangeListeners.forEach(listener => {
        try {
          listener(payload);
        } catch (error) {
          console.error('Error in jobs change listener:', error);
        }
      });
    })
    .subscribe((status) => console.log('jobs channel status:', status));
    
  return jobsChannel;
}

// Use a unique ID for each listener to prevent duplicate subscriptions
let nextListenerId = 1;

export function onJobsChange(supabase, cb) {
  // Ensure the channel exists
  ensureJobsChannel(supabase);
  
  // Register this callback
  const id = `listener_${nextListenerId++}`;
  jobsChangeListeners.set(id, cb);
  
  // Return an unsubscribe function
  return () => {
    jobsChangeListeners.delete(id);
    console.log(`Removed jobs listener ${id}, ${jobsChangeListeners.size} listeners remaining`);
  };
}

export async function closeJobsChannel(supabase) {
  if (jobsChannel) {
    // Clear all listeners
    jobsChangeListeners.clear();
    
    const ch = jobsChannel;
    jobsChannel = null;
    
    try {
      await supabase.removeChannel(ch);
    } catch (error) {
      console.warn('Error removing jobs channel:', error);
    }
  }
}

// Helper for conditional logging
const isDev = process.env.NODE_ENV === 'development';
const logger = {
  log: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),
  warn: (...args) => isDev && console.warn(...args)
};

/**
 * Maps OAuth provider data to a standardized profile format
 * for consistent profile creation and updates
 */
export const mapOAuthToProfileData = (provider, userData) => {
  const userMetadata = userData?.user_metadata || {};
  const appMetadata = userData?.app_metadata || {};
  const mappedData = {};
  
  // Common fields across providers
  if (userMetadata.full_name) mappedData.full_name = userMetadata.full_name;
  if (userMetadata.email) mappedData.email = userMetadata.email;
  if (userMetadata.avatar_url) mappedData.avatar_url = userMetadata.avatar_url;
  
  // Provider-specific mapping
  if (provider === 'google') {
    // Map Google profile data
    if (userMetadata.name) mappedData.full_name = userMetadata.name;
    if (userMetadata.email) mappedData.email = userMetadata.email;
    if (userMetadata.picture) mappedData.avatar_url = userMetadata.picture;
    
    // Parse name into components if available
    if (userMetadata.given_name) mappedData.first_name = userMetadata.given_name;
    if (userMetadata.family_name) mappedData.last_name = userMetadata.family_name;
  } 
  else if (provider === 'linkedin') {
    // Map LinkedIn profile data
    if (userMetadata.name) mappedData.full_name = userMetadata.name;
    if (userMetadata.email) mappedData.email = userMetadata.email;
    if (userMetadata.picture) mappedData.avatar_url = userMetadata.picture;
    
    // LinkedIn may provide these separately
    if (userMetadata.given_name) mappedData.first_name = userMetadata.given_name;
    if (userMetadata.family_name) mappedData.last_name = userMetadata.family_name;
    
    // Professional data if available
    if (userMetadata.headline) mappedData.job_title = userMetadata.headline;
    if (userMetadata.linkedInUrl) mappedData.linkedin_url = userMetadata.linkedInUrl;
  }
  
  // Log the mapping for debugging
  if (isDev) {
    logger.log(`OAuth profile data mapped from ${provider}:`, mappedData);
  }
  
  return mappedData;
};

// Auth helper functions
export const signInWithEmail = async (email, password, otpCode = null) => {
  const params = {
    email,
    password,
  };
  
  // Add OTP code if provided (for 2FA)
  if (otpCode) {
    params.options = {
      twoFactorToken: otpCode
    };
  }
  
  const { data, error } = await supabase.auth.signInWithPassword(params);
  
  // Check if 2FA is required
  if (error?.message?.includes('two-factor')) {
    return { data, error, requiresTwoFactor: true };
  }
  
  return { data, error };
};

export const signUpWithEmail = async (email, password, options = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: options,
    },
  });
  return { data, error };
};

export const signInWithGoogle = async () => {
  // Fix Google sign-in access denied issue by properly configuring OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`, // Send to OAuth callback route for processing
      scopes: 'email profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      // Pass additional data to be stored in user_metadata
      // This will help with profile creation
      meta: {
        provider_name: 'google',
        provider_type: 'oauth' 
      }
    },
  });
  
  return { data, error };
};

export const signInWithLinkedIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`, // Send to OAuth callback route for processing
      scopes: 'r_liteprofile r_emailaddress',
      // Pass additional data to be stored in user_metadata
      // This will help with profile creation
      meta: {
        provider_name: 'linkedin',
        provider_type: 'oauth'
      }
    },
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

// Database helper functions
export const fetchProfiles = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  return { data, error };
};

export const fetchProfile = async (id) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

export const updateProfile = async (id, updates) => {
  // Clean updates object by removing null/undefined and converting empty strings for numbers to null
  const cleanUpdates = {};
  
  Object.entries(updates).forEach(([key, value]) => {
    // Skip null/undefined values
    if (value === null || value === undefined) return;
    
    // Handle empty strings for numeric fields
    if (value === '' && ['graduation_year', 'expected_graduation_year', 'mentorship_experience_years'].includes(key)) {
      cleanUpdates[key] = null;
    } else {
      cleanUpdates[key] = value;
    }
  });
  
  // Set updated_at timestamp
  cleanUpdates.updated_at = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('profiles')
    .update(cleanUpdates)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
};

export const fetchEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true });
  return { data, error };
};

export const fetchEvent = async (id) => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();
  return { data, error };
};

export const registerForEvent = async (eventId, attendeeId) => {
  const { data, error } = await supabase
    .from('event_attendees')
    .insert([{
      event_id: eventId,
      attendee_id: attendeeId,
      registration_date: new Date().toISOString()
    }])
    .select();
  return { data, error };
};

export const fetchJobs = async () => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const fetchJob = async (id) => {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single();
  return { data, error };
};

export const createJob = async (jobData) => {
  const { data, error } = await supabase
    .from('jobs')
    .insert([jobData])
    .select()
    .single();
  return { data, error };
};

export const applyForJob = async (jobId, applicationData) => {
  const { data, error } = await supabase
    .from('job_applications')
    .insert([{
      job_id: jobId,
      ...applicationData,
      application_date: new Date().toISOString()
    }])
    .select();
  return { data, error };
};

// Conversation functions (aligned with conversation_participants schema)
export const fetchConversations = async (userId) => {
  // Prefer RPC if available for efficient fetching
  try {
    const { data, error } = await supabase.rpc('get_user_conversations_v2', { p_user_id: userId });
    if (error) throw error;
    return { data, error: null };
  } catch (rpcErr) {
    // Fallback: derive conversations via conversation_participants
    try {
      const { data: myConvs, error: convsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, conversation:conversations(id, last_message_at, created_at)')
        .eq('user_id', userId);
      if (convsError) return { data: null, error: convsError };

      // Deduplicate conversation IDs
      const seen = new Set();
      const convIds = [];
      (myConvs || []).forEach(r => {
        if (!seen.has(r.conversation_id)) {
          seen.add(r.conversation_id);
          convIds.push({ id: r.conversation_id, last_message_at: r.conversation?.last_message_at || null, created_at: r.conversation?.created_at || null });
        }
      });

      // For each conversation, fetch the other participant profile
      const detailed = await Promise.all(convIds.map(async (c) => {
        const { data: otherRow } = await supabase
          .from('conversation_participants')
          .select('user:profiles(id, full_name, avatar_url, is_online)')
          .eq('conversation_id', c.id)
          .neq('user_id', userId)
          .limit(1)
          .maybeSingle();
        return {
          conversation_id: c.id,
          last_message_at: c.last_message_at,
          created_at: c.created_at,
          other_participant: otherRow?.user || null,
        };
      }));

      return { data: detailed, error: null };
    } catch (fbErr) {
      console.error('Error fetching conversations (fallback):', fbErr);
      return { data: null, error: fbErr };
    }
  }
};

export const createConversation = async (user1Id, user2Id) => {
  // Check for existing conversation via join table: conversations having both users
  const { data: parts, error: partsErr } = await supabase
    .from('conversation_participants')
    .select('conversation_id, user_id')
    .in('user_id', [user1Id, user2Id]);
  if (partsErr) return { data: null, error: partsErr };

  const counts = {};
  (parts || []).forEach(r => {
    counts[r.conversation_id] = (counts[r.conversation_id] || 0) + 1;
  });
  const existingId = Object.keys(counts).find(cid => counts[cid] >= 2);
  if (existingId) {
    return { data: { id: existingId }, error: null };
  }

  // Use RPC to create or get conversation relative to current auth user
  // Determine which of the provided IDs matches the current user
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { data: null, error: authErr || new Error('Not authenticated') };

  const currentId = user.id;
  let otherId = null;
  if (currentId === user1Id) otherId = user2Id;
  else if (currentId === user2Id) otherId = user1Id;
  else return { data: null, error: new Error('Current user must be one of the participants') };

  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    user_1_id: currentId,
    user_2_id: otherId,
  });
  return { data, error };
};

export const fetchMessages = async (conversationId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
    
  return { data, error };
};

export const sendMessage = async (messageData) => {
  // Send the message
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData])
    .select()
    .single();
  
  if (!error && messageData.conversation_id) {
    // Update conversation's last_message_at timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', messageData.conversation_id);
  }
  
  return { data, error };
};

export const markMessageAsRead = async (messageId) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId)
    .select();
  return { data, error };
};

export const markConversationMessagesAsRead = async (conversationId, userId) => {
  // Mark all messages in a conversation as read by the specified user
  const { data, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId) // Only mark messages sent by the other user
    .is('read_at', null) // Only mark unread messages
    .select();
    
  return { data, error };
};

export const getUnreadMessageCount = async (userId) => {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .neq('sender_id', userId)
    .is('read_at', null);
    
  return { count: count || 0, error };
};

// Functions for file uploads in messages
export const uploadMessageAttachment = async (file, userId) => {
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('message_attachments')
    .upload(fileName, file);
    
  if (error) {
    return { data: null, error };
  }
  
  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from('message_attachments')
    .getPublicUrl(fileName);
    
  return { data: { path: fileName, url: publicUrlData.publicUrl }, error: null };
};

export const fetchMentors = async () => {
  const { data, error } = await supabase
    .from('mentors')
    .select(`
      *,
      profiles(*)
    `)
    .eq('is_available', true);
  return { data, error };
};

export const createMentorshipRequest = async (requestData) => {
  const { data, error } = await supabase
    .from('mentorship_requests')
    .insert([requestData])
    .select()
    .single();
  return { data, error };
};

// Networking Groups Functions

// Fetch all groups with optional filtering
export const fetchGroups = async (options = {}) => {
  const {
    searchQuery = '',
    tags = [],
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 100,
    isAdmin = false,
    currentUserId = null,
  } = options;

  // Base selection with creator explicit embed and member count
  const baseSelect = `*, creator:profiles!groups_created_by_fkey(id, full_name, avatar_url), group_members(count)`;

  // Admin path: fetch all groups
  if (isAdmin) {
    let adminQ = supabase
      .from('groups')
      .select(baseSelect)
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .limit(limit);
    if (searchQuery) adminQ = adminQ.ilike('name', `%${searchQuery}%`);
    if (tags && tags.length > 0) adminQ = adminQ.contains('tags', tags);
    const { data, error } = await adminQ;
    return { data, error };
  }

  // Non-admin path: public groups + private groups where user is a member
  let publicQ = supabase
    .from('groups')
    .select(baseSelect)
    .eq('is_private', false)
    .eq('is_approved', true)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .limit(limit);
  if (searchQuery) publicQ = publicQ.ilike('name', `%${searchQuery}%`);
  if (tags && tags.length > 0) publicQ = publicQ.contains('tags', tags);

  const [{ data: pub, error: pubErr }, memberRes] = await Promise.all([
    publicQ,
    (async () => {
      if (!currentUserId) return { data: [], error: null };
      // Fetch groups where current user is a member (includes private ones)
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group:groups(${baseSelect})
        `)
        .eq('user_id', currentUserId);
      if (error) return { data: null, error };
      // Map to group rows and mark membership
      const groups = (data || []).map(r => ({ ...r.group, is_member: true }));
      return { data: groups, error: null };
    })()
  ]);

  if (pubErr) return { data: null, error: pubErr };
  if (memberRes.error) return { data: null, error: memberRes.error };

  const membershipMap = new Map();
  (memberRes.data || []).forEach(g => membershipMap.set(g.id, true));

  // Merge public + member groups, prefer member flag
  const merged = [];
  const seen = new Set();
  (pub || []).forEach(g => {
    const is_member = membershipMap.get(g.id) || false;
    merged.push({ ...g, is_member });
    seen.add(g.id);
  });
  (memberRes.data || []).forEach(g => {
    if (!seen.has(g.id)) merged.push(g);
  });

  // Apply client-side filters that weren't applicable to member join select
  let filtered = merged;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(g => (g.name || '').toLowerCase().includes(q));
  }
  if (tags && tags.length > 0) {
    filtered = filtered.filter(g => Array.isArray(g.tags) && tags.every(t => g.tags.includes(t)));
  }

  return { data: filtered, error: null };
};

// For backward compatibility
export const fetchPublicGroups = async () => {
  return fetchGroups({ includePrivate: false });
};

// Fetch a single group's details, including members
export const fetchGroupDetails = async (groupId) => {
  // Try explicit FK embed for creator; fallback if relation name differs
  let { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      creator:profiles!groups_created_by_fkey(id, full_name, avatar_url),
      members:group_members(profiles(*))
    `)
    .eq('id', groupId)
    .single();

  if (error) {
    // Fallback: fetch without creator embed, then resolve creator manually
    const { data: base, error: baseErr } = await supabase
      .from('groups')
      .select(`
        *,
        members:group_members(profiles(*))
      `)
      .eq('id', groupId)
      .single();
    if (baseErr) return { data: null, error: baseErr };
    let creator = null;
    if (base?.created_by) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', base.created_by)
        .maybeSingle();
      creator = prof || null;
    }
    data = { ...base, creator };
    error = null;
  }
  return { data, error };
};

// Create a new group (backend triggers will set creator/admin membership)
export const createGroup = async (groupData) => {
  const { data, error } = await supabase
    .from('groups')
    .insert([groupData])
    .select()
    .single();
  return { data, error };
};

// Join a group (backend trigger/RLS infers user_id and role)
export const joinGroup = async (groupId) => {
  const { data, error } = await supabase
    .from('group_members')
    .insert([{ group_id: groupId }])
    .select();
  return { data, error };
};

// Leave a group
export const leaveGroup = async (groupId, userId) => {
  const { data, error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  return { data, error };
};

// Fetch posts from a specific group
export const fetchGroupPosts = async (groupId) => {
  const { data, error } = await supabase
    .from('group_posts')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });
  return { data, error };
};

// Create a new post in a group
export const createGroupPost = async (postData) => {
  const { data, error } = await supabase
    .from('group_posts')
    .insert([postData])
    .select()
    .single();
  return { data, error };
};

// Delete a post from a group
export const deleteGroupPost = async (postId) => {
  const { data, error } = await supabase
    .from('group_posts')
    .delete()
    .eq('id', postId);
  return { data, error };
};

// Remove a member from a group
export const removeGroupMember = async (groupId, userId) => {
  const { data, error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  return { data, error };
};

// Update group details
export const updateGroupDetails = async (groupId, updates) => {
  const { data, error } = await supabase
    .from('groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();
  return { data, error };
};

// Upload group avatar
export const uploadGroupAvatar = async (file, groupId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `group_avatar_${groupId}_${Date.now()}.${fileExt}`;
    const filePath = fileName;
    
    // Use post_images bucket for all uploads
    const bucketName = 'post_images';
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/png',
      });
      
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: uploadError };
    }
    
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    // Update group with new avatar URL
    const { data, error } = await updateGroupDetails(groupId, {
      group_avatar_url: urlData.publicUrl
    });
    
    return { data, error, url: urlData.publicUrl };
  } catch (err) {
    console.error('Error in uploadGroupAvatar:', err);
    return { error: err };
  }
};

// Upload post image
export const uploadPostImage = async (file, userId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `post_image_${userId}_${Date.now()}.${fileExt}`;
    const filePath = fileName;
    
    // Use post_images bucket for all uploads
    const bucketName = 'post_images';
    
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/png',
      });
      
    if (uploadError) {
      console.error('Post image upload error:', uploadError);
      return { error: uploadError };
    }
    
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return { url: data.publicUrl };
  } catch (err) {
    console.error('Error in uploadPostImage:', err);
    return { error: err };
  }
};

export const fetchMentorshipRequests = async (userId) => {
  const { data, error } = await supabase
    .from('mentorship_requests')
    .select(`
      *,
      mentor:mentor_id(profiles(*)),
      mentee:mentee_id(profiles(*))
    `)
    .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);
  return { data, error };
};

