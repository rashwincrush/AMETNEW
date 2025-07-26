import { createClient } from '@supabase/supabase-js';
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
  throw new Error('Missing Supabase environment variables');
}

// Create the client with realtime configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: { 
      'apikey': supabaseKey 
    },
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    // Explicitly set endpoint to ensure proper connection
    endpoint: `${supabaseUrl}/realtime/v1`.replace('http', 'ws')
  }
});

// Log current configuration to help with debugging
console.log('Supabase client initialized with:', {
  url: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : 'undefined',  // Only log partial URL for security
  hasKey: !!supabaseKey,
  realtimeEnabled: true
});

// Create a context for WebSocket connection status
export const RealtimeContext = createContext({
  isRealtimeReady: false,
  setupRealtimeSubscription: async () => {},
});

// Realtime status provider component
export const RealtimeProvider = ({ children }) => {
  const [isRealtimeReady, setIsRealtimeReady] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const statusRef = useRef(null);
  
  // Track realtime status to prevent multiple connections
  const channelRef = useRef(null);
  
  // Initialize and setup realtime connection
  useEffect(() => {
    // If there's already a status channel, don't create another one
    if (channelRef.current) return;

    console.log('Setting up realtime status channel...');
    
    try {
      // Log Supabase client status
      console.log('Supabase client status:', {
        authUrl: supabase.auth.url,
        hasAuthSession: !!supabase.auth.session,
        realtimeUrl: supabase.realtime?.url || '(using default)'
      });
      
      // Create a status channel to monitor connection
      const statusChannel = supabase.channel('system:status');
      channelRef.current = statusChannel;
      
      // Subscribe to status events
      statusChannel
        .on('system', { event: '*' }, (status) => {
          console.log('Realtime status event:', status);
          if (status.event === 'connected') {
            console.log('Realtime connected successfully!');
            setIsRealtimeReady(true);
          } else if (status.event === 'disconnected') {
            console.warn('Realtime disconnected!');
            setIsRealtimeReady(false);
            // Only attempt reconnect if not unmounting
            if (!statusRef.current?.unmounting) {
              // Increment connection attempts
              setConnectionAttempts(prev => prev + 1);
            }
          }
        })
        .subscribe(status => {
          console.log('Realtime subscription status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to system status channel');
            setIsRealtimeReady(true);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Error connecting to realtime:', status);
            setIsRealtimeReady(false);
            // Only attempt reconnect if not unmounting
            if (!statusRef.current?.unmounting) {
              // Increment connection attempts
              setConnectionAttempts(prev => prev + 1);
            }
          }
        });
    } catch (error) {
      console.error('Error setting up realtime channel:', error);
      // Set a retry attempt on error
      setTimeout(() => {
        setConnectionAttempts(prev => prev + 1);
      }, 2000);
    }

    statusRef.current = { unmounting: false };
    
    // Clean up function
    return () => {
      if (statusRef.current) {
        statusRef.current.unmounting = true;
      }
      
      if (channelRef.current) {
        console.log('Cleaning up realtime status channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);
  
  // Auto reconnect with exponential backoff
  useEffect(() => {
    if (connectionAttempts === 0) return;
    
    // Increase max attempts to 8 for more resilience
    const maxAttempts = 8;
    if (connectionAttempts > maxAttempts) {
      console.warn(`Realtime connection failed after ${maxAttempts} attempts. Manual refresh may be needed.`);
      // Even after max attempts, still allow components to render without realtime
      // Mark realtime as "available" to prevent components from waiting indefinitely
      setIsRealtimeReady(true); 
      return;
    }
    
    // Exponential backoff (1s, 2s, 4s, 8s, 16s, 32s, 60s, 60s)
    const backoff = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 60000);
    
    console.log(`Attempting to reconnect realtime in ${backoff/1000}s (attempt ${connectionAttempts}/${maxAttempts})`);
    
    const timer = setTimeout(() => {
      if (channelRef.current) {
        // Remove old channel
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      
      // Create new channel
      const statusChannel = supabase.channel('system:status');
      channelRef.current = statusChannel;
      
      statusChannel
        .on('system', { event: '*' }, (status) => {
          console.log('Realtime status:', status);
          if (status.event === 'connected') {
            setIsRealtimeReady(true);
            // Reset connection attempts on success
            setConnectionAttempts(0);
          } else if (status.event === 'disconnected') {
            setIsRealtimeReady(false);
          }
        })
        .subscribe();
        
    }, backoff);
    
    return () => clearTimeout(timer);
  }, [connectionAttempts]);
  
  // Function to safely setup a realtime subscription with extended timeout and retries
  const setupRealtimeSubscription = async (channelName, options) => {
    return new Promise((resolve, reject) => {
      if (!options?.skipReadyCheck && !isRealtimeReady) {
        console.log(`Realtime not ready yet for ${channelName}, waiting...`);
        
        // Wait up to 15 seconds for connection to be ready (increased from 5s)
        let attempts = 0;
        const maxAttempts = 30; // 30 attempts * 500ms = 15 seconds max wait
        
        const checkInterval = setInterval(() => {
          attempts++;
          
          if (isRealtimeReady) {
            clearInterval(checkInterval);
            console.log(`Realtime connection ready, proceeding with subscription to ${channelName}`);
            resolve(true);
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            // Log more detailed diagnostic information
            console.warn(`Timed out waiting for realtime connection after ${maxAttempts * 500}ms for ${channelName}`);
            console.warn('Connection state:', {
              connectionAttempts, 
              isRealtimeReady,
              hasStatusChannel: !!channelRef.current
            });
            
            // Allow component to proceed even without realtime - better UX than total failure
            if (options?.allowFallback) {
              console.log('Proceeding without realtime connection (fallback mode)');
              resolve(false);
            } else {
              reject(new Error('Realtime connection timed out'));
            }
          } else if (attempts % 5 === 0) { // Log every 2.5 seconds
            console.log(`Still waiting for realtime connection... (${attempts}/${maxAttempts})`);
          }
        }, 500);
      } else {
        // Already connected, proceed immediately
        resolve(true);
      }
    });
  };
  
  return (
    <RealtimeContext.Provider value={{ isRealtimeReady, setupRealtimeSubscription }}>
      {children}
    </RealtimeContext.Provider>
  );
};

// Custom hook for accessing the realtime status
export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
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
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { data, error };
};

export const signInWithLinkedIn = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'linkedin',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
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
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
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

// Conversation functions
export const fetchConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id, 
      last_message_at,
      created_at,
      participant_1:participant_1(id, full_name, avatar_url),
      participant_2:participant_2(id, full_name, avatar_url)
    `)
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .order('last_message_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversations:', error);
  }
  
  return { data, error };
};

export const createConversation = async (user1Id, user2Id) => {
  // First check if conversation already exists
  const { data: existingConv, error: checkError } = await supabase
    .from('conversations')
    .select('id')
    .or(
      `and(participant_1.eq.${user1Id},participant_2.eq.${user2Id}),` +
      `and(participant_1.eq.${user2Id},participant_2.eq.${user1Id})`
    )
    .maybeSingle();
    
  if (checkError) {
    return { data: null, error: checkError };
  }
  
  if (existingConv) {
    return { data: existingConv, error: null };
  }
  
  const { data, error } = await supabase
    .from('conversations')
    .insert([
      { 
        participant_1: user1Id, 
        participant_2: user2Id,
        last_message_at: new Date().toISOString()
      }
    ])
    .select()
    .single();
  
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
    limit = 100
  } = options;
  
  let query = supabase
    .from('groups')
    .select('*, group_members(count)')
    .eq('is_private', false) // Always fetch only public groups
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .limit(limit);
  
  // Apply search filter if provided
  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }
  
  // Apply tags filter if provided
  if (tags && tags.length > 0) {
    query = query.contains('tags', tags);
  }
  
  const { data, error } = await query;
  return { data, error };
};

// For backward compatibility
export const fetchPublicGroups = async () => {
  return fetchGroups({ includePrivate: false });
};

// Fetch a single group's details, including members
export const fetchGroupDetails = async (groupId) => {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      members:group_members(profiles(*))
    `)
    .eq('id', groupId)
    .single();
  return { data, error };
};

// Create a new group
export const createGroup = async (groupData, creatorId) => {
  const { data, error } = await supabase
    .from('groups')
    .insert([{ ...groupData, created_by: creatorId }])
    .select()
    .single();

  // If group created successfully, add creator as admin member
  if (data && !error) {
    await supabase.from('group_members').insert([{
      group_id: data.id,
      user_id: creatorId,
      role: 'admin'
    }]);
  }

  return { data, error };
};

// Join a group
export const joinGroup = async (groupId, userId) => {
  const { data, error } = await supabase
    .from('group_members')
    .insert([{ group_id: groupId, user_id: userId, role: 'member' }])
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
