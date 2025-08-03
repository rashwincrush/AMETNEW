import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Define permissions for each role
const PERMISSIONS = {
  alumni: [
    // Dashboard, Alumni Directory, Job Portal (View), Events, Mentorship, Groups, Messages, Profile Settings
    'access:dashboard', 'view:alumni_directory', 'view:jobs', 'access:events',
    'request:mentorship', 'become:mentor', 'access:groups', 'message:users',
    'access:profile_settings'
  ],
  mentor: [
    // Mentor has all Alumni permissions plus mentorship management
    'access:dashboard', 'view:alumni_directory', 'view:jobs', 'access:events',
    'request:mentorship', 'become:mentor', 'access:groups', 'message:users',
    'access:profile_settings',
    // Additional mentor-specific permissions
    'manage:mentor_profile', 'manage:mentee_requests', 'chat:mentees', 'manage:mentoring_slots'
  ],
  employer: [
    // Dashboard, Alumni Directory, Job Portal (View & Post), Events, Groups, Messages, Profile Settings
    'access:dashboard', 'view:alumni_directory', 'view:jobs', 'post:jobs',
    'access:events', 'access:groups', 'message:users', 'access:profile_settings',
    // Additional employer-specific permissions
    'manage:job_applications', 'manage:job_alerts'
  ],
  student: [
    // Dashboard, Alumni Directory, Mentorship (request only), Messages (with mentors), Profile Settings
    'access:dashboard', 'view:alumni_directory', 'request:mentorship',
    'message:assigned_mentor', 'access:profile_settings'
  ],
  admin: ['access:all', 'manage:users', 'delete:users'],
  super_admin: ['access:all', 'manage:users', 'delete:users'],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [rejectionStatus, setRejectionStatus] = useState({ isRejected: false, reason: null });
  const listenerRef = useRef(null);
  const initializedRef = useRef(false);

  const getUserRole = useCallback(() => {
    return profile?.role || 'student'; // Default to 'student' if no role is found
  }, [profile]);

  const userRole = getUserRole();

  const hasPermission = useCallback((permission) => {
    const userPermissions = PERMISSIONS[userRole] || [];
    if (userPermissions.includes('access:all')) return true;
    return userPermissions.includes(permission);
  }, [userRole]);

  const hasAnyPermission = useCallback((permissions) => {
    const userPermissions = PERMISSIONS[userRole] || [];
    if (userPermissions.includes('access:all')) return true;
    return permissions.some(p => userPermissions.includes(p));
  }, [userRole]);

  const hasAllPermissions = useCallback((permissions) => {
    const userPermissions = PERMISSIONS[userRole] || [];
    if (userPermissions.includes('access:all')) return true;
    return permissions.every(p => userPermissions.includes(p));
  }, [userRole]);

  // Check if user is rejected and should be blocked
  const checkUserRejectionStatus = useCallback((profileData) => {
    if (!profileData) return false;
    
    // Check for rejection condition: alumni_verification_status === 'rejected'
    const isRejected = profileData.alumni_verification_status === 'rejected';
    
    if (isRejected) {
      console.log('User account is rejected');
      
      // Don't store rejection reason in localStorage, it will be fetched from Supabase in RejectionPage
      
      // Update rejection status state
      setRejectionStatus({ isRejected: true });
      return true;
    }
    
    return false;
  }, []);

  const fetchUserProfile = useCallback(async (userId) => {
    console.log(`Fetching profile for userId: ${userId}`);
    if (!userId) {
      console.error("fetchUserProfile called with no userId.");
      setProfile(null);
      setLoading(false);
      return null;
    }

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .throwOnError();

      // Check if user is rejected. If so, stop here.
      if (checkUserRejectionStatus(profileData)) {
        // The checkUserRejectionStatus function already set the rejection state.
        // We must not set the profile for a rejected user.
        setLoading(false);
        return null; // Stop the auth flow for this user
      }

      setProfile(profileData);
      return profileData;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('Starting complete signout process');
      
      // 1. Unsubscribe from auth listener first to prevent callbacks
      if (listenerRef.current) {
        listenerRef.current.unsubscribe();
        listenerRef.current = null;
        console.log('Auth listener unsubscribed');
      }

      // 2. Clear React state
      setUser(null);
      setProfile(null);
      setSession(null);
      console.log('React state cleared');
      
      // 3. Manually clear all Supabase-related items from localStorage
      const supabaseKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          supabaseKeys.push(key);
        }
      }
      
      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`Cleared localStorage key: ${key}`);
      });
      
      // 4. Now try the API call (might still fail, but we've cleared local state)
      try {
        await supabase.auth.signOut();
        console.log('Successfully called Supabase signOut API');
      } catch (supabaseError) {
        console.error('Supabase signOut API error (continuing anyway):', supabaseError);
      }
      
      // 5. Force a complete page reload to ensure all state is cleared
      console.log('Forcing complete page reload');
      setTimeout(() => {
        localStorage.setItem('force_logout_time', Date.now().toString());
        window.location.href = '/login';
      }, 100);
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Final emergency cleanup
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Clear any possible Supabase storage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
      
      window.location.href = '/login';
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
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
  }, [user, fetchUserProfile]);

  // Handle automatic redirect for rejected users
  useEffect(() => {
    if (rejectionStatus.isRejected) {
      if (window.location.pathname !== '/rejection') {
        window.location.href = '/rejection';
      }
    }
  }, [rejectionStatus.isRejected]);

  useEffect(() => {
    console.log('AuthProvider useEffect started.');

    // Prevent duplicate initialization in development
    if (initializedRef.current) {
      console.log('Auth already initialized, skipping duplicate init');
      return;
    }
    initializedRef.current = true;

    // Add a timeout to prevent getting stuck on loading indefinitely
    const loadingTimeout = setTimeout(() => {
      console.error('Auth process timed out after 8 seconds.');
      setLoading(false);
    }, 8000);

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

        if (!supabase?.auth) {
          console.error('CRITICAL: Supabase auth module is not available.');
          setLoading(false);
          clearTimeout(loadingTimeout);
          return;
        }
        console.log('3. Supabase client is available.');

        // Check for existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          console.log('3.5. Found existing session');
          setUser(existingSession.user);
          setSession(existingSession);
          await fetchUserProfile(existingSession.user.id);
        }

        // Set up auth state change listener
        console.log('4. Setting up onAuthStateChange listener...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          clearTimeout(loadingTimeout);
          console.log(`5. Auth state change event: ${event}`, { hasSession: !!session });
          
          const currentUser = session?.user || null;
          setUser(currentUser);
          setSession(session);

          try {
            if (currentUser) {
              console.log('6a. User found, checking if profile needs update...');
              // Only fetch profile if we don't have one or if user changed
              if (!profile || profile.id !== currentUser.id) {
                await fetchUserProfile(currentUser.id);
              }
            } else {
              console.log('6b. No user session, resetting profile.');
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

    // Cleanup function
    return () => {
      console.log('AuthProvider cleanup function called.');
      clearTimeout(loadingTimeout);
      if (listenerRef.current) {
        console.log('Unsubscribing auth listener');
        listenerRef.current.unsubscribe();
        listenerRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [profile?.id, fetchUserProfile]); // Only re-run if profile ID changes

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    updateProfile,
    fetchUserProfile,
    isAuthenticated: !!user,
    isAdmin,
    userRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRole,
    rejectionStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
