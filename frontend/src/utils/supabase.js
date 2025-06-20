import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Auth helper functions
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
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
