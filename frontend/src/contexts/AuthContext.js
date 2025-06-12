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
    // Simple initialization with timeout
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000); // 1 second timeout

    const initializeAuth = async () => {
      try {
        // Check environment variables
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;
        
        console.log('Environment check:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          url: supabaseUrl?.substring(0, 20) + '...',
        });
        
        if (supabaseUrl && supabaseKey) {
          // Only try to import Supabase if env vars exist
          try {
            const { supabase, getSession } = await import('../utils/supabase');
            
            // Get initial session
            const { session: initialSession } = await getSession();
            setSession(initialSession);
            setUser(initialSession?.user || null);
            
            console.log('Supabase initialized successfully');
          } catch (supabaseError) {
            console.warn('Supabase initialization failed, continuing without auth:', supabaseError);
          }
        } else {
          console.log('Running without Supabase (missing environment variables)');
        }
        
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => clearTimeout(timer);
  }, []);

  const signOut = async () => {
    try {
      const { supabase } = await import('../utils/supabase');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force logout even if Supabase fails
      setUser(null);
      setProfile(null);
      setSession(null);
    }
  };

  const updateProfile = async (updates) => {
    // Placeholder for profile updates
    return updates;
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    updateProfile,
    isAuthenticated: !!user,
    getUserRole: () => {
      if (!profile && !user) return 'alumni';
      
      // Check user metadata or profile for role
      const userRole = profile?.user_type || user?.user_metadata?.user_type || 'alumni';
      
      if (profile?.email?.includes('@amet.ac.in') && profile?.is_admin) {
        return 'admin';
      }
      
      if (userRole === 'employer' || profile?.is_employer) {
        return 'employer';
      }
      
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
