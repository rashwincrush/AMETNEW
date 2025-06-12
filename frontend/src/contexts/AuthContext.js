import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Initialize auth context
    const initializeAuth = async () => {
      try {
        // Check if Supabase environment variables are available
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase environment variables not found. Running in demo mode.');
          setLoading(false);
          return;
        }

        // Dynamically import Supabase utilities only if env vars are available
        const { supabase, getCurrentUser, getSession } = await import('../utils/supabase');
        
        // Get initial session
        const { session: initialSession } = await getSession();
        setSession(initialSession);
        setUser(initialSession?.user || null);
        
        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id, supabase);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state change:', event, session);
          
          setSession(session);
          setUser(session?.user || null);
          
          if (session?.user) {
            await fetchUserProfile(session.user.id, supabase);
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
        
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      } finally {
        // Ensure loading is set to false after a timeout
        setTimeout(() => setLoading(false), 3000);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserProfile = async (userId, supabaseClient) => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create a basic profile if none exists
        const newProfile = {
          user_id: userId,
          email: user?.email || '',
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: createdProfile, error: createError } = await supabaseClient
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          setProfile(createdProfile);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // Dynamically import supabase
      const { supabase } = await import('../utils/supabase');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates) => {
    if (!user || !profile) return;

    try {
      const { supabase } = await import('../utils/supabase');
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    updateProfile,
    fetchUserProfile,
    isAuthenticated: !!user,
    // Helper function to determine user role
    getUserRole: () => {
      if (!profile) return 'alumni'; // default role
      
      // Check if user is admin
      if (profile.email && profile.email.includes('@amet.ac.in') && profile.is_admin) {
        return 'admin';
      }
      
      // Check if user is employer
      if (profile.user_type === 'employer' || profile.is_employer) {
        return 'employer';
      }
      
      // Default to alumni
      return 'alumni';
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
