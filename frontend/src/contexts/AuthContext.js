import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase';

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
  const [permissionsCache, setPermissionsCache] = useState({});
  const listenerRef = useRef(null);

  useEffect(() => {
    console.log('AuthProvider useEffect started.');

    // Add a timeout to prevent getting stuck on loading indefinitely
    const loadingTimeout = setTimeout(() => {
      console.error('Auth process timed out after 8 seconds. This might be a Supabase connection issue or incorrect credentials.');
      // Force loading to false and create a guest session to unblock UI
      setLoading(false);
      // If we're still stuck, we might want to provide a guest experience
      if (!user) {
        console.log('Creating guest session to allow app usage without authentication');
        // Create a guest user to allow basic app functionality
        const guestUser = {
          id: 'guest-' + Date.now(),
          email: 'guest@example.com',
          is_guest: true
        };
        setUser(guestUser);
        
        // Create a basic profile for the guest user
        const guestProfile = {
          id: guestUser.id,
          email: guestUser.email,
          full_name: 'Guest User',
          role: 'guest',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_fallback: true,
          is_guest: true
        };
        setProfile(guestProfile);
        console.log('Guest session created:', { user: guestUser, profile: guestProfile });
      }
    }, 8000); // Reduced from 10s to 8s

    const initializeAuth = async () => {
      console.log('1. Initializing authentication...');
      try {
        const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
        const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.error('CRITICAL: Supabase URL or Key is missing. Check your .env.development file.');
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
        console.log('2. Supabase credentials found.');

        if (!supabase || !supabase.auth) {
          console.error('CRITICAL: Supabase client or auth module is not available.');
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
        console.log('3. Supabase client is available.');

        // Clean up previous listener if exists
        if (listenerRef.current) {
          console.log('Cleaning up previous auth listener.');
          listenerRef.current.unsubscribe();
        }

        console.log('4. Setting up onAuthStateChange listener...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          clearTimeout(loadingTimeout); // Clear timeout once auth state is received
          console.log(`5. Auth state change event received: ${event}`, { hasSession: !!session });
          
          const currentUser = session?.user || null;
          setUser(currentUser);
          setSession(session);

          try {
            if (currentUser) {
              console.log('6a. User found, fetching profile...');
              await fetchUserProfile(currentUser.id);
            } else {
              console.log('6b. No user session, setting profile to null.');
              setProfile(null);
            }
          } catch (e) {
            console.error("Error during profile fetch on auth change:", e);
            setProfile(null);
          } finally {
            console.log('7. Auth process finished. Setting loading to false.');
            setLoading(false);
          }
        });

        listenerRef.current = subscription;

      } catch (error) {
        console.error('CRITICAL: Error during auth initialization:', error);
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    };

    initializeAuth();

    // The cleanup function is returned directly by useEffect
    return () => {
      console.log('AuthProvider cleanup function called.');
      clearTimeout(loadingTimeout);
      if (listenerRef.current) {
        listenerRef.current.unsubscribe();
        console.log('Auth listener unsubscribed on cleanup.');
      }
    };
  }, []);

  const fetchUserProfile = async (userId) => {
    console.log(`Fetching profile for userId: ${userId}`);
    if (!userId) {
      console.error("fetchUserProfile called with no userId.");
      setProfile(null);
      setLoading(false); // Ensure loading is set to false
      return null;
    }

    // Create a manual timeout that will force completion after 5 seconds
    const timeoutPromise = new Promise(resolve => {
      setTimeout(() => {
        console.log('⚠️ Profile fetch timeout reached - forcing fallback profile');
        resolve({ timedOut: true });
      }, 5000); // Reduced from 8s to 5s for faster fallback
    });
    
    try {
      console.log('Executing Supabase profile query with timeout...');
      
      // Race between the profile fetch and the timeout
      const result = await Promise.race([
        timeoutPromise,
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()
      ]);
      
      // If we got the timeout result
      if (result.timedOut) {
        console.warn('Profile fetch timed out - creating fallback profile');
        const fallbackProfile = createFallbackProfile(userId);
        console.log('Fallback profile created:', fallbackProfile);
        setProfile(fallbackProfile);
        setLoading(false); // Ensure loading is set to false
        return fallbackProfile;
      }
      
      // Otherwise we got the actual query result
      const { data, error } = result;
      console.log('Supabase profile query finished.');
      
      if (error) {
        console.error('Error fetching profile:', error);
        // Create a fallback profile with basic user info instead of throwing
        console.log('Creating fallback profile due to error');
        const fallbackProfile = createFallbackProfile(userId);
        console.log('Fallback profile created:', fallbackProfile);
        setProfile(fallbackProfile);
        setLoading(false); // Ensure loading is set to false
        return fallbackProfile;
      }
      
      if (data) {
        console.log('Profile data found, setting profile state:', data);
        setProfile(data);
        setLoading(false); // Ensure loading is set to false
        return data;
      } else {
        console.log('No profile data found for user.');
        // Create a fallback profile with basic user info
        console.log('Creating fallback profile due to missing data');
        const fallbackProfile = createFallbackProfile(userId);
        console.log('Fallback profile created:', fallbackProfile);
        setProfile(fallbackProfile);
        setLoading(false); // Ensure loading is set to false
        return fallbackProfile;
      }
    } catch (error) {
      console.error('Exception during profile fetch:', error);
      
      // Create a fallback profile with basic user info
      console.log('Creating fallback profile after exception');
      const fallbackProfile = createFallbackProfile(userId);
      console.log('Fallback profile created:', fallbackProfile);
      setProfile(fallbackProfile);
      setLoading(false); // Ensure loading is set to false
      return fallbackProfile;
    }
  };
  
  // Helper function to create a fallback profile
  const createFallbackProfile = (userId) => {
    return {
      id: userId,
      email: user?.email || 'unknown@email.com',
      full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
      role: 'alumni', // Default role
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_fallback: true, // Flag to indicate this is a fallback profile
      avatar_url: null
    };
  };

  const signOut = async () => {
    try {
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
      throw new Error('No authenticated user');
    }
    
    try {
      // Check if profile exists first
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Create a copy of updates to avoid mutating the original
      const updatesToApply = { ...updates };
      
      // Always include updated_at
      updatesToApply.updated_at = new Date().toISOString();
      
      console.log('Applying profile updates:', updatesToApply);
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('profiles')
          .update(updatesToApply)
          .eq('id', user.id)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating profile:', error);
          throw error;
        }
        result = data;
      } else {
        // Create new profile
        const newProfileData = { 
          id: user.id,
          ...updatesToApply,
          created_at: new Date().toISOString()
        };
        
        console.log('Creating new profile with data:', newProfileData);
        
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
      
      // Re-fetch the profile to ensure the auth context has the latest data.
      if (result) {
        await fetchUserProfile(user.id);
      }
      
      console.log('Profile updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  };

  // Permission checking functions
  const hasPermission = async (permissionName) => {
    if (!user) return false;
    
    // For super_admin, always return true
    if (getUserRole() === 'super_admin') return true;
    
    // Check cache first
    if (permissionsCache[permissionName] !== undefined) {
      return permissionsCache[permissionName];
    }
    
    try {
      const { data, error } = await supabase.rpc(
        'has_permission',
        { user_id: user.id, permission_name: permissionName }
      );
      
      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }
      
      // Cache the result
      setPermissionsCache(prev => ({
        ...prev,
        [permissionName]: !!data
      }));
      
      return !!data;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };
  
  const hasAnyPermission = async (permissions) => {
    if (!user || !permissions || !permissions.length) return false;
    
    // For super_admin, always return true
    if (getUserRole() === 'super_admin') return true;
    
    try {
      const results = await Promise.all(
        permissions.map(permission => hasPermission(permission))
      );
      
      return results.some(result => result === true);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };
  
  const hasAllPermissions = async (permissions) => {
    if (!user || !permissions || !permissions.length) return false;
    
    // For super_admin, always return true
    if (getUserRole() === 'super_admin') return true;
    
    try {
      const results = await Promise.all(
        permissions.map(permission => hasPermission(permission))
      );
      
      return results.every(result => result === true);
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };
  
  // Helper to get user role
  const getUserRole = () => {
    if (!profile && !user) return 'alumni';
    
    // Check profile role first
    if (profile?.role) {
      // Explicit role checks
      if (profile.role === 'super_admin') return 'super_admin';
      if (profile.role === 'admin') return 'admin';
      if (profile.role === 'moderator') return 'moderator';
      if (profile.role === 'employer') return 'employer';
      if (profile.role) return profile.role;
    }
    
    // Fallbacks if no profile role
    // Check if admin based on email domain and is_admin flag
    if (profile?.email?.includes('@amet.ac.in') && profile?.is_admin) {
      return 'admin';
    }
    
    // Check if employer based on is_employer flag
    if (profile?.is_employer) {
      return 'employer';
    }
    
    // Final fallback to user metadata or default
    return user?.user_metadata?.role || 'alumni';
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
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
