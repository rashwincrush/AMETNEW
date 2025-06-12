import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
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

export const fetchMessages = async (userId) => {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:sender_id(full_name, avatar_url),
      recipient:recipient_id(full_name, avatar_url)
    `)
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false });
  return { data, error };
};

export const sendMessage = async (messageData) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([messageData])
    .select()
    .single();
  return { data, error };
};

export const markMessageAsRead = async (messageId) => {
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .select();
  return { data, error };
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
