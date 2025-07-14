import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY || '';

// Create a single instance of the Supabase client to be used throughout the app
// This follows the singleton pattern as per our memory guidance
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Export the client as both a named export and default export for compatibility
export const supabase = supabaseClient;

/**
 * Sign up with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {object} options - Additional options like metadata
 * @returns {Promise} Promise object that resolves to the sign up result
 */
export const signUpWithEmail = async (email, password, options = {}) => {
  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: options.metadata || {},
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        ...options
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

/**
 * Sign in with Google OAuth
 * @returns {Promise} Promise object that resolves to the sign in result
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Sign in with LinkedIn OAuth
 * @returns {Promise} Promise object that resolves to the sign in result
 */
export const signInWithLinkedIn = async () => {
  try {
    const { data, error } = await supabaseClient.auth.signInWithOAuth({
      provider: 'linkedin',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in with LinkedIn:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise} Promise object that resolves when sign out is complete
 */
export const signOut = async () => {
  try {
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

/**
 * Get the current authenticated user session
 * @returns {Promise} Promise object that resolves to the current session
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

export default supabaseClient;
