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
    // Initialize authentication
    const initializeAuth = async () => {
      try {
        // Check environment variables
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
        
        console.log('Initializing auth with:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          url: supabaseUrl
        });
        
        if (supabaseUrl && supabaseKey) {
          // Import Supabase utilities
          const { supabase, getSession } = await import('../utils/supabase');
          
          // Get initial session
          const { session: initialSession } = await getSession();
          console.log('Initial session:', initialSession);
          
          setSession(initialSession);
          setUser(initialSession?.user || null);
          
          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user.id);
          }
          
          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event, session);
            
            setSession(session);
            setUser(session?.user || null);
            
            if (session?.user) {
              await fetchUserProfile(session.user.id);
            } else {
              setProfile(null);
            }
            
            setLoading(false);
          });

          // Cleanup subscription
          return () => subscription.unsubscribe();
        } else {
          console.log('Missing Supabase credentials, running in demo mode');
        }
        
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const { supabase } = await import('../utils/supabase');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('Profile fetch result:', { data, error });

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      } else {
        console.log('No profile found, user might be new');
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const signOut = async () => {
    try {
      const { supabase } = await import('../utils/supabase');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
      }
      
      // Force logout even if there's an error
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force logout
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  const updateProfile = async (updates) => {
    if (!user) {
      console.error('Cannot update profile: No authenticated user');
      return null;
    }
    
    try {
      const { supabase } = await import('../utils/supabase');
      
      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Sanitize updates to only include fields that actually exist in the database
      // Based on the schema in server.py and registration function
      const sanitizedUpdates = {};
      
      // Only copy fields we know exist in the database schema
      if (updates.first_name !== undefined) sanitizedUpdates.first_name = updates.first_name;
      if (updates.last_name !== undefined) sanitizedUpdates.last_name = updates.last_name;
      if (updates.phone !== undefined) sanitizedUpdates.phone = updates.phone;
      if (updates.email !== undefined) sanitizedUpdates.email = updates.email;
      
      // Always include updated_at
      sanitizedUpdates.updated_at = new Date().toISOString();
      
      console.log('Sanitized updates (only including fields confirmed to exist in DB):', sanitizedUpdates);
      
      let result;
      
      if (existingProfile) {
        // Update existing profile with sanitized fields only
        const { data, error } = await supabase
          .from('profiles')
          .update(sanitizedUpdates)
          .eq('id', user.id)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
        
        result = data;
      } else {
        // Create new profile with sanitized fields only
        const newProfileData = { 
          id: user.id,
          ...sanitizedUpdates,
          created_at: new Date().toISOString(),
        };
        
        console.log('Creating new profile with sanitized data:', newProfileData);
        
        const { data, error } = await supabase
          .from('profiles')
          .insert([newProfileData])
          .select()
          .single();
          
        if (error) {
          console.error('Error creating profile:', error);
          throw error;
        }
        
        result = data;
      }
      
      // Update local state
      const updatedProfile = {
        ...profile,
        ...result
      };
      
      console.log('Profile updated successfully:', updatedProfile);
      setProfile(updatedProfile);
      return updatedProfile;
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
    getUserRole: () => {
      if (!profile && !user) return 'alumni';
      
      // Check user metadata or profile for role
      const userRole = profile?.primary_role || profile?.user_type || user?.user_metadata?.primary_role || 'alumni';
      
      // Check if admin
      if (profile?.email?.includes('@amet.ac.in') && profile?.is_admin) {
        return 'admin';
      }
      
      // Check if employer
      if (userRole === 'employer' || profile?.is_employer) {
        return 'employer';
      }
      
      return userRole || 'alumni';
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
